import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateOrderDto } from './dto/order.dto';
import { OrdersService } from './orders.service';
import { CalculateShippingDto, ShippingWebhookDto } from './dto/shipping.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.UserID, dto);
  }

  @Get()
  getMyOrders(@Request() req: any) {
    return this.ordersService.getMyOrders(req.user.UserID);
  }

  @Patch(':id/cancel')
  cancelOrder(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.cancelOrder(req.user.UserID, id);
  }
  @UseGuards(AuthGuard('jwt'))
@Post('shipping-fee')
calculateShippingFee(@Body() dto: CalculateShippingDto) {
  return this.ordersService.calculateShippingFee(dto.address);
}

@UseGuards(AuthGuard('jwt'))
@Get(':id/tracking')
getOrderTracking(@Request() req: any, @Param('id') id: string) {
  return this.ordersService.getOrderTracking(req.user.UserID, id);
}

// Public Webhook cho đối tác giao hàng
@Post('shipping-webhook')
handleShippingWebhook(@Body() dto: ShippingWebhookDto) {
  return this.ordersService.handleShippingWebhook(dto);
}
}