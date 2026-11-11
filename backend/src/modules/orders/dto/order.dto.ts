import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export enum PaymentMethod {
  COD = 'COD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

// Sub-DTO đại diện cho dịch vụ đính kèm theo từng bản sách (FR-24)
export class CreateOrderServiceDto {
  @IsString()
  @IsNotEmpty({ message: 'CopyID không được để trống' })
  copyId: string;

  @IsString()
  @IsNotEmpty({ message: 'ServiceID không được để trống' })
  serviceId: string;

  @IsOptional()
  @IsString()
  message?: string;
}

// Main DTO cho Đặt hàng (FR-23, FR-26, FR-27, BR-01)
export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  recipientName: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại người nhận không được để trống' })
  recipientPhone: string;

  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ giao hàng không được để trống' })
  recipientAddress: string;

  @IsOptional()
  @IsString()
  deliveryNote?: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: 'Đơn hàng phải chứa ít nhất 1 bản sách' })
  copyIds: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderServiceDto)
  services?: CreateOrderServiceDto[];

  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán phải là COD hoặc BANK_TRANSFER' })
  paymentMethod: PaymentMethod;
}