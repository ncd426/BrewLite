
import { BadRequestException } from '@nestjs/common';
import {
  DiscountType,
  Prisma,
  Promotion,
} from '@prisma/client';
import { jest } from '@jest/globals';

import { resolvePromotion } from './promotion-rule';

describe('Promotion validation', () => {
  const now = new Date('2026-10-23T00:00:00Z');

  const samplePromotion: Promotion = {
    id: 1,
    code: 'GIAM10',
    type: DiscountType.PERCENT,
    value: 10,
    minOrderTotal: 80000,
    startsAt: null,
    expiresAt: null,
    isActive: true,
    createdAt: new Date(),
  };

  const findUnique = jest.fn<
    () => Promise<Promotion | null>
  >();

  const tx = {
    promotion: { findUnique },
  } as unknown as Prisma.TransactionClient;

  beforeEach(() => {
    jest.resetAllMocks();
    findUnique.mockResolvedValue(samplePromotion);
  });

  it('applies valid 10% discount', async () => {
    const result = await resolvePromotion(
      tx, 'giam10', 94000, now,
    );

    expect(result).toEqual({
      promotionId: 1,
      discountAmount: 9400,
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: { code: 'GIAM10' },
    });
  });

  it('rejects unknown promotion code', async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      resolvePromotion(tx, 'SAIMA', 94000, now),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects expired promotion', async () => {
    findUnique.mockResolvedValue({
      ...samplePromotion,
      expiresAt: new Date('2026-10-22T00:00:00Z'),
    });

    await expect(
      resolvePromotion(tx, 'GIAM10', 94000, now),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects inactive promotion', async () => {
    findUnique.mockResolvedValue({
      ...samplePromotion,
      isActive: false,
    });

    await expect(
      resolvePromotion(tx, 'GIAM10', 94000, now),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects order below minimum amount', async () => {
    await expect(
      resolvePromotion(tx, 'GIAM10', 70000, now),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects promotion that has not started', async () => {
    findUnique.mockResolvedValue({
      ...samplePromotion,
      startsAt: new Date('2026-10-24T00:00:00Z'),
    });

    await expect(
      resolvePromotion(tx, 'GIAM10', 94000, now),
    ).rejects.toThrow(BadRequestException);
  });

  it('supports fixed discount without negative total', async () => {
    findUnique.mockResolvedValue({
      ...samplePromotion,
      type: DiscountType.FIXED,
      value: 150000,
    });

    const result = await resolvePromotion(
      tx, 'GIAM10', 94000, now,
    );

    expect(result.discountAmount).toBe(94000);
  });

  it('does not discount an order without promo code', async () => {
    const result = await resolvePromotion(
      tx, undefined, 94000, now,
    );

    expect(result.discountAmount).toBe(0);
    expect(result.promotionId).toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });
});
