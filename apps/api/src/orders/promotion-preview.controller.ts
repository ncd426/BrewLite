import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { PromotionPreviewService } from './promotion-preview.service';

@Controller('orders')
export class PromotionPreviewController {
  constructor(private readonly service: PromotionPreviewService) {}

  // This endpoint computes a quote; it never creates an order or reserves stock.
  @UseGuards(JwtAuthGuard)
  @Post('promotion-preview')
  preview(@Body() dto: CreateOrderDto) {
    return this.service.preview(dto);
  }
}
