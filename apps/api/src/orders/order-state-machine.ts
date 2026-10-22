
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';

export const ORDER_TRANSITIONS: Readonly<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PAID,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.CANCELLED,
  ],

  [OrderStatus.PAYMENT_FAILED]: [
    OrderStatus.PENDING,
    OrderStatus.CANCELLED,
  ],

  [OrderStatus.PAID]: [
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
  ],

  [OrderStatus.PREPARING]: [
    OrderStatus.READY,
  ],

  [OrderStatus.READY]: [
    OrderStatus.COMPLETED,
  ],

  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

/**
 * Validate a change from the current order status
 * to the requested next status.
 */
export function assertTransition(
  current: OrderStatus,
  next: OrderStatus,
): void {
  const allowed = ORDER_TRANSITIONS[current];

  if (!allowed?.includes(next)) {
    throw new ConflictException(
      `Invalid order transition: ${current} -> ${next}`,
    );
  }
}

/**
 * Atomically change status inside an existing Prisma
 * transaction. Reuse this in Orders and Payments.
 */
export async function transitionOrderStatus(
  tx: Prisma.TransactionClient,
  orderId: number,
  next: OrderStatus,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!order) {
    throw new NotFoundException(
      `Order ${orderId} not found`,
    );
  }

  assertTransition(order.status, next);

  // Guard against another request changing the
  // status between the read and the update.
  const result = await tx.order.updateMany({
    where: {
      id: orderId,
      status: order.status,
    },
    data: {
      status: next,
    },
  });

  if (result.count !== 1) {
    throw new ConflictException(
      'Order status was changed by another request',
    );
  }

  return {
    id: orderId,
    status: next,
  };
}
