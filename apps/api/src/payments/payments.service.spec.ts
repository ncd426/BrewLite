
import { jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  OrderStatus,
  Payment,
  PaymentStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';

type TestOrder = {
  id: number;
  userId: number;
  total: number;
  status: OrderStatus;
};

describe('PaymentsService State Machine integration', () => {
  let order: TestOrder;
  let nextPaymentId: number;

  const payments = new Map<string, Payment>();

  const findOrder = jest.fn<
    (args: { where: { id: number } }) =>
      Promise<TestOrder | null>
  >();

  const updateOrder = jest.fn<
    (args: {
      where: { id: number; status: OrderStatus };
      data: { status: OrderStatus };
    }) => Promise<{ count: number }>
  >();

  const findPayment = jest.fn<
    (args: {
      where: { idempotencyKey: string };
    }) => Promise<Payment | null>
  >();

  const createPayment = jest.fn<
    (args: {
      data: Pick<
        Payment,
        'orderId' | 'amount' | 'method' |
        'idempotencyKey' | 'status'
      >;
    }) => Promise<Payment>
  >();

  const updatePayment = jest.fn<
    (args: {
      where: { id: number };
      data: { status: PaymentStatus };
    }) => Promise<Payment>
  >();

  const tx = {
    order: {
      findUnique: findOrder,
      updateMany: updateOrder,
    },
    payment: {
      findUnique: findPayment,
      create: createPayment,
      update: updatePayment,
    },
  };

  const transaction = jest.fn<
    (
      callback: (client: typeof tx) => Promise<unknown>,
    ) => Promise<unknown>
  >();

  const prisma = {
    $transaction: transaction,
    payment: { findUnique: findPayment },
  };

  const service = new PaymentsService(
    prisma as unknown as PrismaService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    payments.clear();
    nextPaymentId = 1;

    order = {
      id: 8,
      userId: 7,
      total: 94000,
      status: OrderStatus.PENDING,
    };

    transaction.mockImplementation(
      async (callback) => callback(tx),
    );

    findOrder.mockImplementation(async ({ where }) =>
      where.id === order.id ? order : null,
    );

    updateOrder.mockImplementation(async ({ where, data }) => {
      if (
        where.id !== order.id ||
        where.status !== order.status
      ) {
        return { count: 0 };
      }

      order.status = data.status;
      return { count: 1 };
    });

    findPayment.mockImplementation(async ({ where }) =>
      payments.get(where.idempotencyKey) ?? null,
    );

    createPayment.mockImplementation(async ({ data }) => {
      const payment: Payment = {
        id: nextPaymentId++,
        ...data,
        createdAt: new Date(),
      };

      payments.set(payment.idempotencyKey, payment);
      return payment;
    });

    updatePayment.mockImplementation(async ({ where, data }) => {
      const payment = [...payments.values()].find(
        (item) => item.id === where.id,
      );

      if (!payment) {
        throw new Error('Payment not found');
      }

      const updated = {
        ...payment,
        status: data.status,
      };

      payments.set(updated.idempotencyKey, updated);
      return updated;
    });
  });

  it('moves PENDING to PAID after successful payment', async () => {
    const result = await service.processPayment(
      7, 8, 94000, 'MOMO', 'pay-success',
    );

    expect(result.status).toBe(OrderStatus.PAID);
    expect(result.paymentStatus).toBe(PaymentStatus.SUCCESS);
    expect(order.status).toBe(OrderStatus.PAID);

    expect(updateOrder).toHaveBeenCalledWith({
      where: {
        id: 8,
        status: OrderStatus.PENDING,
      },
      data: { status: OrderStatus.PAID },
    });
  });

  it('handles failed payment and a successful retry', async () => {
    const failed = await service.processPayment(
      7, 8, 94000, 'CARD', 'pay-failed', true,
    );

    expect(failed.status).toBe(OrderStatus.PAYMENT_FAILED);
    expect(order.status).toBe(OrderStatus.PAYMENT_FAILED);

    const retried = await service.processPayment(
      7, 8, 94000, 'CARD', 'pay-retry',
    );

    expect(retried.status).toBe(OrderStatus.PAID);
    expect(order.status).toBe(OrderStatus.PAID);

    expect(
      updateOrder.mock.calls.map(([args]) => args.data.status),
    ).toEqual([
      OrderStatus.PAYMENT_FAILED,
      OrderStatus.PENDING,
      OrderStatus.PAID,
    ]);
  });

  it('blocks invalid payment transition', async () => {
    order.status = OrderStatus.READY;

    await expect(
      service.processPayment(
        7, 8, 94000, 'MOMO', 'pay-invalid',
      ),
    ).rejects.toThrow(ConflictException);

    expect(order.status).toBe(OrderStatus.READY);
  });

  it('returns same payment for same idempotency key', async () => {
    const first = await service.processPayment(
      7, 8, 94000, 'MOMO', 'same-key',
    );

    const second = await service.processPayment(
      7, 8, 94000, 'MOMO', 'same-key',
    );

    expect(second).toEqual(first);
    expect(createPayment).toHaveBeenCalledTimes(1);
  });

  it('rejects a payment amount mismatch', async () => {
    await expect(
      service.processPayment(
        7, 8, 1, 'MOMO', 'wrong-amount',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(createPayment).not.toHaveBeenCalled();
  });
});
