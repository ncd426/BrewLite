
import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

type AuthenticatedUser = {
  userId: number;
  email: string;
};

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

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
      message:
        'Order history endpoint is ready for persistence layer integration',
    };
  }
}
