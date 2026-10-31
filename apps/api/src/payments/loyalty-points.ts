
import { NotFoundException } from '@nestjs/common';
import {
  OrderStatus,
  Prisma,
} from '@prisma/client';

export const VND_PER_LOYALTY_POINT = 10000;
export const VND_PER_REDEEMED_POINT = 1000;

/**
 * Award loyalty points once, after an order is PAID.
 * Must be called inside the same transaction as payment.
 */
export async function awardLoyaltyPointsOnce(
  tx: Prisma.TransactionClient,
  orderId: number,
  amountPaid?: number,
): Promise<number> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      total: true,
      loyaltyAwardedAt: true,
    },
  });

  if (!order) {
    throw new NotFoundException(
      `Order ${orderId} not found`,
    );
  }

  // Only PAID orders can receive points.
  if (order.status !== OrderStatus.PAID) {
    return 0;
  }

  // Already awarded: do not increment again.
  if (order.loyaltyAwardedAt !== null) {
    return 0;
  }

  const points = Math.floor(
    (amountPaid ?? order.total) / VND_PER_LOYALTY_POINT,
  );

  // Atomically claim the reward for this order.
  const result = await tx.order.updateMany({
    where: {
      id: orderId,
      status: OrderStatus.PAID,
      loyaltyAwardedAt: null,
    },
    data: {
      loyaltyAwardedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    // Another request may have awarded it already.
    return 0;
  }

  if (points > 0) {
    await tx.user.update({
      where: { id: order.userId },
      data: {
        loyaltyPoints: {
          increment: points,
        },
      },
    });
  }

  return points;
}
