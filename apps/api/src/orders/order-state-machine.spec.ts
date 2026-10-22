
import { jest } from '@jest/globals';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';

import {
  assertTransition,
  transitionOrderStatus,
} from './order-state-machine';

describe('Order State Machine', () => {
  const validPairs: Array<[OrderStatus, OrderStatus]> = [
    [OrderStatus.PENDING, OrderStatus.PAID],
    [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED],
    [OrderStatus.PENDING, OrderStatus.CANCELLED],

    [OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING],
    [OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED],

    [OrderStatus.PAID, OrderStatus.PREPARING],
    [OrderStatus.PAID, OrderStatus.CANCELLED],

    [OrderStatus.PREPARING, OrderStatus.READY],
    [OrderStatus.READY, OrderStatus.COMPLETED],
  ];

  const validTransitions = new Set(
    validPairs.map(([from, to]) => `${from}->${to}`),
  );

  describe('assertTransition', () => {
    const statuses = Object.values(OrderStatus);

    for (const from of statuses) {
      for (const to of statuses) {
        const valid = validTransitions.has(
          `${from}->${to}`,
        );

        it(
          `${from} -> ${to}: ${
            valid ? 'allowed' : 'rejected'
          }`,
          () => {
            if (valid) {
              expect(() =>
                assertTransition(from, to),
              ).not.toThrow();
            } else {
              expect(() =>
                assertTransition(from, to),
              ).toThrow(ConflictException);
            }
          },
        );
      }
    }
  });

  describe('transitionOrderStatus', () => {
    const findUnique = jest.fn<
      () => Promise<{
        id: number;
        status: OrderStatus;
      } | null>
    >();

    const updateMany = jest.fn<
      () => Promise<{ count: number }>
    >();

    const tx = {
      order: {
        findUnique,
        updateMany,
      },
    } as unknown as Prisma.TransactionClient;

    beforeEach(() => {
      jest.clearAllMocks();

      findUnique.mockResolvedValue({
        id: 1,
        status: OrderStatus.PENDING,
      });

      updateMany.mockResolvedValue({ count: 1 });
    });

    it('updates a valid transition', async () => {
      await expect(
        transitionOrderStatus(
          tx,
          1,
          OrderStatus.PAID,
        ),
      ).resolves.toEqual({
        id: 1,
        status: OrderStatus.PAID,
      });

      expect(updateMany).toHaveBeenCalledWith({
        where: {
          id: 1,
          status: OrderStatus.PENDING,
        },
        data: {
          status: OrderStatus.PAID,
        },
      });
    });

    it('blocks invalid transition without writing', async () => {
      await expect(
        transitionOrderStatus(
          tx,
          1,
          OrderStatus.COMPLETED,
        ),
      ).rejects.toThrow(ConflictException);

      expect(updateMany).not.toHaveBeenCalled();
    });

    it('rejects an unknown order', async () => {
      findUnique.mockResolvedValue(null);

      await expect(
        transitionOrderStatus(
          tx,
          999,
          OrderStatus.PAID,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(updateMany).not.toHaveBeenCalled();
    });

    it('detects concurrent status modification', async () => {
      updateMany.mockResolvedValue({ count: 0 });

      await expect(
        transitionOrderStatus(
          tx,
          1,
          OrderStatus.PAID,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
