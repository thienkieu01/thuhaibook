import { IsNotEmpty, IsString } from 'class-validator';

export class AddressDto {
  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  address: string;
}

export class UpdateAddressDto {
  @IsString()
  @IsNotEmpty()
  oldAddress: string;

  @IsString()
  @IsNotEmpty()
  newAddress: string;
}