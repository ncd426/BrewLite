
import { OrderStatus, Prisma } from '@prisma/client';
import { jest } from '@jest/globals';

import { awardLoyaltyPointsOnce } from './loyalty-points';

describe('Loyalty Points', () => {
  const paidOrder = {
    id: 12,
    userId: 4,
    total: 84600,
    status: OrderStatus.PAID as OrderStatus,
    loyaltyAwardedAt: null as Date | null,
    };

  const findUnique = jest.fn<
    () => Promise<typeof paidOrder | null>
  >();

  const updateMany = jest.fn<
    () => Promise<{ count: number }>
  >();

  const updateUser = jest.fn<
    () => Promise<unknown>
  >();

  const tx = {
    order: {
      findUnique,
      updateMany,
    },
    user: {
      update: updateUser,
    },
  } as unknown as Prisma.TransactionClient;

  beforeEach(() => {
    jest.resetAllMocks();
    findUnique.mockResolvedValue({ ...paidOrder });
    updateMany.mockResolvedValue({ count: 1 });
    updateUser.mockResolvedValue({});
  });

  it('awards 8 points after PAID', async () => {
    const points = await awardLoyaltyPointsOnce(tx, 12);

    expect(points).toBe(8);

    expect(updateUser).toHaveBeenCalledWith({
      where: { id: 4 },
      data: {
        loyaltyPoints: {
          increment: 8,
        },
      },
    });

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 12,
          status: OrderStatus.PAID,
          loyaltyAwardedAt: null,
        },
      }),
    );
  });

  it('does not award points on failed payment', async () => {
    findUnique.mockResolvedValue({
      ...paidOrder,
      status: OrderStatus.PAYMENT_FAILED,
    });

    const points = await awardLoyaltyPointsOnce(tx, 12);

    expect(points).toBe(0);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('does not award points twice', async () => {
    findUnique
      .mockResolvedValueOnce({ ...paidOrder })
      .mockResolvedValueOnce({
        ...paidOrder,
        loyaltyAwardedAt: new Date(),
      });

    const first = await awardLoyaltyPointsOnce(tx, 12);
    const second = await awardLoyaltyPointsOnce(tx, 12);

    expect(first).toBe(8);
    expect(second).toBe(0);

    expect(updateUser).toHaveBeenCalledTimes(1);
  });

  it('avoids duplicate award if another request won', async () => {
    updateMany.mockResolvedValue({ count: 0 });

    const points = await awardLoyaltyPointsOnce(tx, 12);

    expect(points).toBe(0);
    expect(updateUser).not.toHaveBeenCalled();
  });
});
