
import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  Payment,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { transitionOrderStatus } from '../orders/order-state-machine';

export type PaymentMethod = 'MOMO' | 'CARD';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private formatPayment(payment: Payment) {
    const status: OrderStatus =
      payment.status === PaymentStatus.SUCCESS
        ? OrderStatus.PAID
        : payment.status === PaymentStatus.FAILED
          ? OrderStatus.PAYMENT_FAILED
          : OrderStatus.PENDING;

    return {
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      method: payment.method,
      idempotencyKey: payment.idempotencyKey,
      status,
      paymentStatus: payment.status,
      paymentReference: `PAY-${payment.id}`,
    };
  }

  async processPayment(
    userId: number,
    orderId: number,
    amount: number | undefined,
    method: PaymentMethod,
    idempotencyKey: string | undefined,
    simulateFailure = false,
  ) {
    // Nếu client không gửi key, tự sinh key.
    // Để đảm bảo idempotency khi retry, client nên gửi key.
    const key = idempotencyKey ?? randomUUID();

    if (!key.trim()) {
      throw new BadRequestException(
        'Idempotency key is required',
      );
    }

    if (
      simulateFailure &&
      process.env.NODE_ENV === 'production'
    ) {
      throw new BadRequestException(
        'Payment simulation is disabled in production',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          select: {
            id: true,
            userId: true,
            total: true,
            status: true,
          },
        });

        if (!order) {
          throw new NotFoundException(
            `Order ${orderId} not found`,
          );
        }

        if (order.userId !== userId) {
          throw new ForbiddenException(
            'You cannot pay for this order',
          );
        }

        // Luôn dùng tổng tiền từ database.
        const paymentAmount = amount ?? order.total;

        // Kiểm tra giao dịch có cùng idempotency key.
        const existing = await tx.payment.findUnique({
          where: { idempotencyKey: key },
        });

        if (existing) {
          if (
            existing.orderId !== orderId ||
            existing.amount !== paymentAmount ||
            existing.method !== method
          ) {
            throw new ConflictException(
              'Idempotency key was used for another request',
            );
          }

          return this.formatPayment(existing);
        }

        // Không tin số tiền do frontend gửi.
        if (paymentAmount !== order.total) {
          throw new BadRequestException(
            'Payment amount does not match order total',
          );
        }

        // Ghi Payment PENDING trong transaction.
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            amount: order.total,
            method,
            idempotencyKey: key,
            status: PaymentStatus.PENDING,
          },
        });

        // Thanh toán thất bại trước đó:
        // PAYMENT_FAILED -> PENDING
        if (order.status === OrderStatus.PAYMENT_FAILED) {
          await transitionOrderStatus(
            tx,
            order.id,
            OrderStatus.PENDING,
          );
        }

        const nextStatus = simulateFailure
          ? OrderStatus.PAYMENT_FAILED
          : OrderStatus.PAID;

        const nextPaymentStatus = simulateFailure
          ? PaymentStatus.FAILED
          : PaymentStatus.SUCCESS;

        // State Machine kiểm tra chuyển trạng thái.
        await transitionOrderStatus(
          tx,
          order.id,
          nextStatus,
        );

        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: nextPaymentStatus,
          },
        });

        return this.formatPayment(updatedPayment);
      });
    } catch (error) {
      // Xử lý unique constraint khi hai request
      // dùng cùng idempotency key đồng thời.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.prisma.payment.findUnique({
          where: { idempotencyKey: key },
        });

        if (
          existing &&
          existing.orderId === orderId &&
          existing.method === method &&
          (amount === undefined || existing.amount === amount)
        ) {
          return this.formatPayment(existing);
        }

        throw new ConflictException(
          'Idempotency key already exists',
        );
      }

      throw error;
    }
  }
}
