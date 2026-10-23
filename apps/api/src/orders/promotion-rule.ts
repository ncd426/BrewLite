
import { BadRequestException } from '@nestjs/common';
import {
  DiscountType,
  Prisma,
} from '@prisma/client';

/**
 * Validate a promotion and calculate its discount.
 * Subtotal is the amount before discount, in VND.
 */
export async function resolvePromotion(
  tx: Prisma.TransactionClient,
  promotionCode: string | undefined,
  subtotal: number,
  now: Date = new Date(),
): Promise<{
  promotionId: number | null;
  discountAmount: number;
}> {
  if (promotionCode === undefined) {
    return {
      promotionId: null,
      discountAmount: 0,
    };
  }

  const code = promotionCode.trim().toUpperCase();

  if (!code) {
    throw new BadRequestException(
      'Promotion code cannot be empty',
    );
  }

  const promotion = await tx.promotion.findUnique({
    where: { code },
  });

  if (!promotion) {
    throw new BadRequestException(
      'Invalid promotion code',
    );
  }

  if (!promotion.isActive) {
    throw new BadRequestException(
      'Promotion is inactive',
    );
  }

  if (promotion.startsAt && now < promotion.startsAt) {
    throw new BadRequestException(
      'Promotion has not started',
    );
  }

  if (promotion.expiresAt && now >= promotion.expiresAt) {
    throw new BadRequestException(
      'Promotion has expired',
    );
  }

  if (subtotal < promotion.minOrderTotal) {
    throw new BadRequestException(
      'Order does not meet minimum amount',
    );
  }

  if (
    !Number.isInteger(promotion.value) ||
    promotion.value <= 0
  ) {
    throw new BadRequestException(
      'Invalid promotion value',
    );
  }

  let discountAmount: number;

  if (promotion.type === DiscountType.PERCENT) {
    if (promotion.value > 100) {
      throw new BadRequestException(
        'Invalid percentage discount',
      );
    }

    discountAmount = Math.floor(
      (subtotal * promotion.value) / 100,
    );
  } else if (promotion.type === DiscountType.FIXED) {
    discountAmount = promotion.value;
  } else {
    throw new BadRequestException(
      'Unsupported discount type',
    );
  }

  // The total must never become negative.
  discountAmount = Math.min(
    subtotal,
    discountAmount,
  );

  return {
    promotionId: promotion.id,
    discountAmount,
  };
}
