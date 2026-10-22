
import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

class PaymentDto {
  @IsInt()
  @Min(1)
  orderId!: number;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  amount!: number;

  @IsIn(['MOMO', 'CARD'])
  method!: 'MOMO' | 'CARD';

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  idempotencyKey!: string;

  // Chỉ dùng để mô phỏng lỗi thanh toán khi demo.
  @IsOptional()
  @IsBoolean()
  simulateFailure?: boolean;
}

type AuthenticatedUser = {
  userId: number;
  email: string;
};

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  pay(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PaymentDto,
  ) {
    return this.paymentsService.processPayment(
      user.userId,
      dto.orderId,
      dto.amount,
      dto.method,
      dto.idempotencyKey,
      dto.simulateFailure ?? false,
    );
  }
}
