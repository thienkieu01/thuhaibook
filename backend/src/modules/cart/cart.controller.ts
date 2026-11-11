import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Endpoint dịch vụ đặt trước để cho phép Public/User đều đọc được
  @Get('services')
  getServices() {
    return this.cartService.getAvailableServices();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  getCart(@Request() req: any) {
    return this.cartService.getCart(req.user.UserID);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  addToCart(@Request() req: any, @Body() dto: AddToCartDto) {
    // Truyền chính xác dto.copyId dạng chuỗi
    return this.cartService.addToCart(req.user.UserID, dto.copyId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':copyId')
  removeFromCart(@Request() req: any, @Param('copyId') copyId: string) {
    return this.cartService.removeFromCart(req.user.UserID, copyId);
  }
}