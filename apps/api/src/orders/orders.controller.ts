import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';

class OrderItemDto {
  @IsNumber()
  productId: number;

  @IsNotEmpty()
  size: string;

  @IsNumber()
  @Min(1)
  qty: number;

  @IsNumber()
  price: number;
}

class CreateOrderDto {
  @IsNumber()
  userId: number;

  items: OrderItemDto[];
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyOrders(@Req() request: { user: { userId: number; email: string } }) {
    return {
      userId: request.user.userId,
      orders: [],
      message: 'Order history endpoint is ready for persistence layer integration',
    };
  }
}
