
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OrderStatus as PrismaOrderStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderItemDto } from './dto/create-order.dto';
import { SIZE_SURCHARGE, TOPPING_PRICE } from './pricing';

export type OrderStatus = PrismaOrderStatus;

export type CreateOrderInput = {
  userId: number;
  items: CreateOrderItemDto[];
};

const MAX_DATABASE_INT = 2147483647;

function checkMoney(value: number): number {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_DATABASE_INT
  ) {
    throw new BadRequestException(
      'Order amount exceeds supported range',
    );
  }

  return value;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateOrderInput) {
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new BadRequestException('Cart cannot be empty');
    }

    return this.prisma.$transaction(async (tx) => {
      // User ID comes from the verified JWT.
      const user = await tx.user.findUnique({
        where: { id: input.userId },
        select: { id: true },
      });

      if (!user) {
        throw new UnauthorizedException('User does not exist');
      }

      // Fetch prices from PostgreSQL, never from the request.
      const productIds = [
        ...new Set(input.items.map((item) => item.productId)),
      ];

      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: {
          id: true,
          price: true,
          stock: true,
        },
      });

      const productMap = new Map(
        products.map((product) => [product.id, product]),
      );

      for (const productId of productIds) {
        if (!productMap.has(productId)) {
          throw new BadRequestException(
            `Product ${productId} does not exist`,
          );
        }
      }

      // Check quantities across all cart lines for each product.
      const requestedQuantity = new Map<number, number>();

      for (const item of input.items) {
        requestedQuantity.set(
          item.productId,
          (requestedQuantity.get(item.productId) ?? 0) + item.qty,
        );
      }

      for (const [productId, quantity] of requestedQuantity) {
        const product = productMap.get(productId)!;

        if (quantity > product.stock) {
          throw new BadRequestException(
            `Insufficient stock for product ${productId}`,
          );
        }
      }

      // Calculate each line using authoritative product prices.
      const orderItems = input.items.map((item) => {
        const product = productMap.get(item.productId)!;

        const sizeCharge =
          SIZE_SURCHARGE[
            item.size as keyof typeof SIZE_SURCHARGE
          ];

        if (sizeCharge === undefined) {
          throw new BadRequestException('Invalid product size');
        }

        const toppings = item.toppings ?? [];

        if (new Set(toppings).size !== toppings.length) {
          throw new BadRequestException(
            'Duplicate toppings are not allowed',
          );
        }

        let toppingCharge = 0;

        for (const topping of toppings) {
          const price =
            TOPPING_PRICE[
              topping as keyof typeof TOPPING_PRICE
            ];

          if (price === undefined) {
            throw new BadRequestException(
              `Invalid topping: ${topping}`,
            );
          }

          toppingCharge += price;
        }

        const unitPrice = checkMoney(
          product.price + sizeCharge + toppingCharge,
        );

        const lineTotal = checkMoney(
          unitPrice * item.qty,
        );

        return {
          product: {
            connect: { id: item.productId },
          },
          size: item.size,
          qty: item.qty,
          unitPrice,
          lineTotal,
          toppings,
        };
      });

      const total = checkMoney(
        orderItems.reduce(
          (sum, item) => sum + item.lineTotal,
          0,
        ),
      );

      // Nested write inside an interactive transaction.
      // Either Order and all OrderItems persist, or none do.
      const order = await tx.order.create({
        data: {
          user: {
            connect: { id: input.userId },
          },
          status: PrismaOrderStatus.PENDING,
          total,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            orderBy: { id: 'asc' },
          },
        },
      });

      return {
        orderId: order.id,
        status: order.status,
        total: order.total,
        userId: order.userId,
        items: order.items.map((item) => ({
          productId: item.productId,
          size: item.size,
          qty: item.qty,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          toppings: item.toppings,
        })),
      };
    });
  }
}
