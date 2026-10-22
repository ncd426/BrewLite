
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
    amount: number,
    method: PaymentMethod,
    idempotencyKey: string,
    simulateFailure = false,
  ) {
    if (!idempotencyKey.trim()) {
      throw new BadRequestException(
        'Idempotency key is required',
      );
    }

    // Không cho client giả lập kết quả trong production.
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

        // Cùng key phải trả lại kết quả thanh toán cũ.
        const existing = await tx.payment.findUnique({
          where: { idempotencyKey },
        });

        if (existing) {
          if (
            existing.orderId !== orderId ||
            existing.amount !== amount ||
            existing.method !== method
          ) {
            throw new ConflictException(
              'Idempotency key was used for another request',
            );
          }

          return this.formatPayment(existing);
        }

        // Không tin số tiền do frontend gửi.
        if (order.total !== amount) {
          throw new BadRequestException(
            'Payment amount does not match order total',
          );
        }

        // Tạo payment PENDING trước để giữ unique key.
        // Nếu transaction lỗi, bản ghi này sẽ rollback.
        const payment = await tx.payment.create({
          data: {
            orderId,
            amount,
            method,
            idempotencyKey,
            status: PaymentStatus.PENDING,
          },
        });

        // Nếu lần trước thất bại, đưa đơn về PENDING
        // trước khi thử thanh toán lại.
        if (order.status === OrderStatus.PAYMENT_FAILED) {
          await transitionOrderStatus(
            tx,
            orderId,
            OrderStatus.PENDING,
          );
        }

        // Mock payment: mặc định thành công.
        // simulateFailure chỉ dành cho demo/test.
        const nextStatus = simulateFailure
          ? OrderStatus.PAYMENT_FAILED
          : OrderStatus.PAID;

        const paymentStatus = simulateFailure
          ? PaymentStatus.FAILED
          : PaymentStatus.SUCCESS;

        // Bắt buộc kiểm tra State Machine.
        await transitionOrderStatus(
          tx,
          orderId,
          nextStatus,
        );

        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: { status: paymentStatus },
        });

        return this.formatPayment(updatedPayment);
      });
    } catch (error) {
      // Trường hợp hai request dùng cùng key đồng thời.
      // Unique constraint chỉ cho một payment được tạo.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.prisma.payment.findUnique({
          where: { idempotencyKey },
        });

        if (
          existing &&
          existing.orderId === orderId &&
          existing.amount === amount &&
          existing.method === method
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
