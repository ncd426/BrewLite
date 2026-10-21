import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type PaymentMethod = 'MOMO' | 'CARD';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  processPayment(
    orderId: number,
    userId: number,
    method: PaymentMethod,
    simulateFailure = false,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, userId },
        select: { id: true, status: true, total: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new ConflictException('Order cannot be paid in its current status');
      }

      const succeeded = !simulateFailure;
      const orderStatus = succeeded
        ? OrderStatus.PAID
        : OrderStatus.PAYMENT_FAILED;
      const paymentStatus = succeeded
        ? PaymentStatus.SUCCESS
        : PaymentStatus.FAILED;

      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          userId,
          status: OrderStatus.PENDING,
        },
        data: { status: orderStatus },
      });

      if (updated.count !== 1) {
        throw new ConflictException('Order cannot be paid in its current status');
      }

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          method,
          status: paymentStatus,
          idempotencyKey: randomUUID(),
        },
        select: {
          id: true,
          orderId: true,
          amount: true,
          method: true,
          status: true,
        },
      });

      return {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        method: payment.method,
        status: orderStatus,
        paymentStatus: payment.status,
      };
    });
  }
}
