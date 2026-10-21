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
  IsOptional,
  Min,
} from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

class PaymentDto {
  @IsInt()
  @Min(1)
  orderId: number;

  @IsIn(['MOMO', 'CARD'])
  method: 'MOMO' | 'CARD';

  @IsOptional()
  @IsBoolean()
  simulateFailure?: boolean;
}

type AuthenticatedUser = {
  userId: number;
};

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  pay(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PaymentDto,
  ) {
    return this.paymentsService.processPayment(
      dto.orderId,
      user.userId,
      dto.method,
      dto.simulateFailure,
    );
  }
}
