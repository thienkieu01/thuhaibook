import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // Lấy danh sách bản sách trong giỏ của User (Khớp model CartBookCopies)
  async getCart(userId: string) {
    const items = await this.prisma.cartBookCopies.findMany({
      where: { UserID: userId },
      include: {
        copy: {
          include: {
            book: { select: { Title: true, CoverImage: true } },
            images: true,
          },
        },
      },
    });

    const formattedItems = items.map((item) => ({
      copyId: item.CopyID,
      bookTitle: item.copy.book.Title,
      conditionPercent: item.copy.ConditionPercent,
      damageDescription: item.copy.DamageDescription,
      price: Number(item.copy.Price),
      image: item.copy.images[0]?.ImageUrl || item.copy.book.CoverImage,
      isAvailable: item.copy.Status === 'AVAILABLE',
    }));

    const subTotal = formattedItems
      .filter((i) => i.isAvailable)
      .reduce((sum, i) => sum + i.price, 0);

    return {
      success: true,
      data: {
        items: formattedItems,
        subTotal,
      },
    };
  }

  // Thêm bản sách vào giỏ
  async addToCart(userId: string, copyId: string) {
    const copy = await this.prisma.bookCopies.findUnique({
      where: { CopyID: copyId },
    });

    if (!copy || copy.Status !== 'AVAILABLE') {
      throw new BadRequestException('Bản sách này đã bán hoặc không tồn tại');
    }

    const existing = await this.prisma.cartBookCopies.findUnique({
      where: {
        UserID_CopyID: { UserID: userId, CopyID: copyId },
      },
    });

    if (existing) {
      throw new BadRequestException('Bản sách này đã có trong giỏ hàng');
    }

    await this.prisma.cartBookCopies.create({
      data: { UserID: userId, CopyID: copyId },
    });

    return this.getCart(userId);
  }

  // Xóa bản sách khỏi giỏ
  async removeFromCart(userId: string, copyId: string) {
    await this.prisma.cartBookCopies.delete({
      where: {
        UserID_CopyID: { UserID: userId, CopyID: copyId },
      },
    });

    return this.getCart(userId);
  }

  async getAvailableServices() {
    const services = await this.prisma.services.findMany({
      where: { IsActive: true },
    });
    return { success: true, data: services };
  }
}