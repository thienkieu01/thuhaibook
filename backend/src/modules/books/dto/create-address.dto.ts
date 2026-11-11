import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Quận 1' })
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiProperty({ example: 'Phường Bến Nghé' })
  @IsNotEmpty()
  @IsString()
  ward: string;

  @ApiProperty({ example: '123 Nguyễn Huệ' })
  @IsNotEmpty()
  @IsString()
  streetAddress: string;
}