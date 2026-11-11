import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddToCartDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn bản sách cụ thể' })
  copyId: string;
}

export class UpdateCartServicesDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serviceIds?: string[];
}