import { Body, Controller, Post } from '@nestjs/common';
import { IsIn, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { PaymentsService } from './payments.service';

class PaymentDto {
  @IsNumber()
  orderId: number;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['MOMO', 'CARD'])
  method: 'MOMO' | 'CARD';

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  pay(@Body() dto: PaymentDto) {
    return this.paymentsService.processPayment(dto.orderId, dto.amount, dto.method, dto.idempotencyKey);
  }
}
