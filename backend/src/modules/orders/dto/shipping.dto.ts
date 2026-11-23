import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CalculateShippingDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập địa chỉ nhận hàng' })
  address: string;
}

export class ShippingWebhookDto {
  @IsString()
  @IsNotEmpty()
  orderCode: string; // Mã đơn hàng (Orders.OrderCode)

  @IsString()
  @IsNotEmpty()
  shippingStatus: string; // VD: PICKED_UP, IN_TRANSIT, DELIVERED, FAILED

  @IsString()
  @IsOptional()
  note?: string;
}