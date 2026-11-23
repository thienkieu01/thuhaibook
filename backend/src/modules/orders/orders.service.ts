import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';
import { ShippingWebhookDto } from './dto/shipping.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const addressLower = dto.recipientAddress.toLowerCase();
    if (!addressLower.includes('tp.hcm') && !addressLower.includes('hồ chí minh') && !addressLower.includes('tphcm')) {
      throw new BadRequestException('Hệ thống chỉ phục vụ giao hàng trong khu vực TP.HCM');
    }

    const shippingFee = 20000;

    return await this.prisma.$transaction(async (tx) => {
      const copies = await tx.bookCopies.findMany({
        where: { CopyID: { in: dto.copyIds } },
      });

      if (copies.length !== dto.copyIds.length) {
        throw new BadRequestException('Một số bản sách không tồn tại');
      }

      const hasSoldCopy = copies.some((c) => c.Status !== 'AVAILABLE');
      if (hasSoldCopy) {
        throw new ConflictException('Một hoặc nhiều bản sách đã được người khác đặt mua trước');
      }

      const booksTotal = copies.reduce((sum, c) => sum + Number(c.Price), 0);
      let servicesTotal = 0;
      const serviceRecords: { copyId: string; serviceId: string; price: number; message?: string }[] = [];

      if (dto.services && dto.services.length > 0) {
        for (const s of dto.services) {
          const serviceItem = await tx.services.findUnique({ where: { ServiceID: s.serviceId } });
          if (serviceItem && serviceItem.IsActive) {
            const servicePrice = Number(serviceItem.Price);
            servicesTotal += servicePrice;
            serviceRecords.push({
              copyId: s.copyId,
              serviceId: s.serviceId,
              price: servicePrice,
              message: s.message,
            });
          }
        }
      }

      const totalAmount = booksTotal + servicesTotal + shippingFee;
      const orderCode = `TH${Math.floor(100000 + Math.random() * 900000)}`;

      const order = await tx.orders.create({
        data: {
          UserID: userId,
          OrderCode: orderCode,
          Status: 'PENDING',
          TotalAmount: totalAmount,
          delivery: {
            create: {
              RecipientName: dto.recipientName,
              RecipientPhone: dto.recipientPhone,
              RecipientAddress: dto.recipientAddress,
              DeliveryNote: dto.deliveryNote,
              ShippingFee: shippingFee,
              ShippingStatus: 'PENDING',
            },
          },
          payment: {
            create: {
              Method: dto.paymentMethod,
              PaymentStatus: 'PENDING',
              Amount: totalAmount,
            },
          },
          statusHistory: {
            create: {
              Status: 'PENDING',
              Note: 'Đơn hàng vừa được tạo',
            },
          },
        },
      });

      for (const copy of copies) {
        await tx.orderBookCopies.create({
          data: {
            OrderID: order.OrderID,
            CopyID: copy.CopyID,
            PriceAtOrder: copy.Price,
          },
        });

        await tx.bookCopies.update({
          where: { CopyID: copy.CopyID },
          data: { Status: 'SOLD' },
        });
      }

      for (const s of serviceRecords) {
        await tx.orderCopyServices.create({
          data: {
            OrderID: order.OrderID,
            CopyID: s.copyId,
            ServiceID: s.serviceId,
            PriceAtOrderService: s.price,
            Message: s.message,
          },
        });
      }

      await tx.cartBookCopies.deleteMany({
        where: {
          UserID: userId,
          CopyID: { in: dto.copyIds },
        },
      });

      return {
        success: true,
        message: 'Đặt hàng thành công',
        data: {
          orderId: order.OrderID,
          orderCode: order.OrderCode,
          totalAmount,
          paymentMethod: dto.paymentMethod,
          bankInfo: dto.paymentMethod === 'BANK_TRANSFER' ? {
            bankName: 'MBBank',
            accountNumber: '090123456789',
            accountName: 'THU HAI BOOKSTORE',
            transferContent: orderCode,
          } : null,
        },
      };
    });
  }

  async getMyOrders(userId: string) {
    const orders = await this.prisma.orders.findMany({
      where: { UserID: userId },
      include: {
        delivery: true,
        payment: true,
        orderBookCopies: {
          include: {
            copy: {
              include: { book: { select: { Title: true, CoverImage: true } } },
            },
          },
        },
        orderCopyServices: {
          include: { service: true },
        },
        statusHistory: { orderBy: { Timestamp: 'desc' } },
      },
      orderBy: { Date: 'desc' },
    });

    return { success: true, data: orders };
  }

  // HÀM HỦY ĐƠN HÀNG (BR-05)
  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.orders.findFirst({
      where: { OrderID: orderId, UserID: userId },
      include: { orderBookCopies: true, delivery: true },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.Status !== 'PENDING' || (order.delivery && order.delivery.ShippingStatus !== 'PENDING')) {
      throw new BadRequestException('Đơn hàng đã bàn giao vận chuyển, không thể hủy');
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.orders.update({
        where: { OrderID: orderId },
        data: { Status: 'CANCELLED' },
      });

      await tx.orderStatusHistory.create({
        data: {
          OrderID: orderId,
          Status: 'CANCELLED',
          Note: 'Người mua chủ động hủy đơn hàng',
        },
      });

      // Chuyển lại các bản sách trong đơn về trạng thái AVAILABLE (BR-05)
      for (const item of order.orderBookCopies) {
        await tx.bookCopies.update({
          where: { CopyID: item.CopyID },
          data: { Status: 'AVAILABLE' },
        });
      }

      return { success: true, message: 'Hủy đơn hàng thành công' };
    });
  }
  // FR-16: Tính phí giao hàng theo khu vực TP.HCM
async calculateShippingFee(address: string) {
  const hcmRegex = /(tp\.?\s*hcm|hồ\s*chí\s*minh|ho\s*chi\s*minh|tphcm)/i;
  if (!hcmRegex.test(address)) {
    throw new BadRequestException('Chỉ hỗ trợ giao hàng trong địa bàn TP.HCM');
  }

  // Mô phỏng phản hồi API đơn vị vận chuyển (Nội thành vs Ngoại thành)
  const suburbanRegex = /(củ chi|hóc môn|bình chánh|nhà bè|cần giờ|thủ đức|quận 9|quận 12|bình tân)/i;
  const isSuburban = suburbanRegex.test(address);

  const shippingFee = isSuburban ? 28000 : 18000;
  const estimatedDays = isSuburban ? '2 - 3 ngày' : '1 - 2 ngày';

  return {
    message: 'Tính phí vận chuyển thành công',
    data: {
      address,
      provider: 'Giao Hàng Nhanh (GHN)',
      shippingFee,
      estimatedDays,
    },
  };
}

// FR-18 (Phần 1): Khách hàng xem dòng thời gian trạng thái đơn hàng
async getOrderTracking(userId: string, orderId: string) {
  const order = await this.prisma.orders.findFirst({
    where: { OrderID: orderId, UserID: userId },
    include: {
      delivery: true,
      statusHistory: {
        orderBy: { Timestamp: 'asc' },
      },
    },
  });

  if (!order) {
    throw new NotFoundException('Không tìm thấy đơn hàng');
  }

  return {
    message: 'Lấy thông tin vận chuyển thành công',
    data: {
      orderCode: order.OrderCode,
      orderStatus: order.Status,
      delivery: order.delivery,
      timeline: order.statusHistory,
    },
  };
}

// FR-18 (Phần 2): Webhook nhận cập nhật trạng thái từ đơn vị vận chuyển
async handleShippingWebhook(dto: ShippingWebhookDto) {
  const order = await this.prisma.orders.findUnique({
    where: { OrderCode: dto.orderCode },
    include: { user: true, delivery: true },
  });

  if (!order) {
    throw new NotFoundException(`Không tìm thấy đơn hàng với mã ${dto.orderCode}`);
  }

  const now = new Date();
  const isDelivered = dto.shippingStatus === 'DELIVERED';
  const isHandedOver = dto.shippingStatus === 'PICKED_UP';

  await this.prisma.$transaction(async (tx) => {
    // 1. Cập nhật bảng Delivery nếu có
    if (order.delivery) {
      await tx.delivery.update({
        where: { OrderID: order.OrderID },
        data: {
          ShippingStatus: dto.shippingStatus,
          ...(isHandedOver ? { HandedOverAt: now } : {}),
          ...(isDelivered ? { DeliveredAt: now } : {}),
        },
      });
    }

    // 2. Đồng bộ trạng thái đơn hàng chính khi giao thành công
    if (isDelivered) {
      await tx.orders.update({
        where: { OrderID: order.OrderID },
        data: { Status: 'COMPLETED' },
      });
    }

    // 3. Ghi lịch sử trạng thái vào OrderStatusHistory
    await tx.orderStatusHistory.create({
      data: {
        OrderID: order.OrderID,
        Status: dto.shippingStatus,
        Note: dto.note || `Đơn vị vận chuyển cập nhật trạng thái: ${dto.shippingStatus}`,
      },
    });
  });

  // 4. Thông báo cho khách hàng
  const contact = order.user.Email || order.user.Phone;
  console.log(
    `[FR-18 Thông báo tới ${contact}] Đơn hàng ${order.OrderCode} vừa chuyển sang trạng thái: ${dto.shippingStatus}`,
  );

  return { message: 'Cập nhật trạng thái vận chuyển thành công' };
}
}