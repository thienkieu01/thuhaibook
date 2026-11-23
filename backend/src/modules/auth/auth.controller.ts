import { Body, Controller, Get, Delete, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateAddressDto, AddressDto } from './dto/address.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Request() req: any) {
    return {
      message: 'Lấy thông tin tài khoản thành công',
      data: req.user,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.UserID, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('change-password')
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.UserID, dto);
  }
  @Post('forgot-password')
forgotPassword(@Body() dto: ForgotPasswordDto) {
  return this.authService.forgotPassword(dto);
}

@Post('reset-password')
resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto);
}
@UseGuards(AuthGuard('jwt'))
@Get('addresses')
getAddresses(@Request() req: any) {
  return this.authService.getAddresses(req.user.UserID);
}

@UseGuards(AuthGuard('jwt'))
@Post('addresses')
addAddress(@Request() req: any, @Body() dto: AddressDto) {
  return this.authService.addAddress(req.user.UserID, dto.address);
}

@UseGuards(AuthGuard('jwt'))
@Patch('addresses')
updateAddress(@Request() req: any, @Body() dto: UpdateAddressDto) {
  return this.authService.updateAddress(req.user.UserID, dto);
}

@UseGuards(AuthGuard('jwt'))
@Delete('addresses') // Nhớ import Delete từ @nestjs/common
deleteAddress(@Request() req: any, @Body() dto: AddressDto) {
  return this.authService.deleteAddress(req.user.UserID, dto.address);
}
}