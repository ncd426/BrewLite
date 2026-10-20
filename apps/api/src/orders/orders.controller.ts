import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
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
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

type AuthenticatedUser = { userId: number; email: string };

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create({
      userId: user.userId,
      items: dto.items,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyOrders(@CurrentUser() user: AuthenticatedUser) {
    return {
      userId: user.userId,
      orders: [],
      message: 'Order history endpoint is ready for persistence layer integration',
    };
  }
}
