
import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Param,
  ParseIntPipe,
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
      promotionCode: dto.promotionCode,
    });
  }

  
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyOrders(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.getMyOrders(
      user.userId,
    );
  }

  
@UseGuards(JwtAuthGuard)
@Get(':id')
getOrderById(
  @CurrentUser() user: AuthenticatedUser,
  @Param('id', ParseIntPipe) orderId: number,
) {
  return this.ordersService.getOrderById(
    user.userId,
    orderId,
  );
}

}
