import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SIZE_SURCHARGE, TOPPING_PRICE } from './pricing';
import { resolvePromotion } from './promotion-rule';

const MAX_DATABASE_INT = 2147483647;

function checkAmount(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_DATABASE_INT) {
    throw new BadRequestException('Order amount exceeds supported range');
  }
  return value;
}

@Injectable()
export class PromotionPreviewService {
  constructor(private readonly prisma: PrismaService) {}

  async preview(dto: CreateOrderDto) {
    const promotionCode = dto.promotionCode?.trim().toUpperCase();
    if (!promotionCode) {
      throw new BadRequestException('Promotion code is required');
    }
    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('Cart cannot be empty');
    }

    // Use DB product prices and the SAME pricing constants as OrdersService.create().
    // The final POST /orders independently revalidates the code and prices.
    return this.prisma.$transaction(async (tx) => {
      const ids = [...new Set(dto.items.map((item) => item.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, price: true, stock: true },
      });
      const productById = new Map(products.map((product) => [product.id, product]));
      const requestedQuantity = new Map<number, number>();
      let subtotal = 0;

      for (const item of dto.items) {
        const product = productById.get(item.productId);
        if (!product) {
          throw new BadRequestException(`Product ${item.productId} does not exist`);
        }
        if (!Number.isInteger(item.qty) || item.qty < 1) {
          throw new BadRequestException('Invalid quantity');
        }
        const sizeCharge = SIZE_SURCHARGE[item.size as keyof typeof SIZE_SURCHARGE];
        if (sizeCharge === undefined) {
          throw new BadRequestException('Invalid product size');
        }
        const toppings = item.toppings ?? [];
        if (new Set(toppings).size !== toppings.length) {
          throw new BadRequestException('Duplicate toppings are not allowed');
        }
        let toppingCharge = 0;
        for (const topping of toppings) {
          const amount = TOPPING_PRICE[topping as keyof typeof TOPPING_PRICE];
          if (amount === undefined) {
            throw new BadRequestException(`Invalid topping: ${topping}`);
          }
          toppingCharge += amount;
        }

        const unitPrice = checkAmount(product.price + sizeCharge + toppingCharge);
        const lineTotal = checkAmount(unitPrice * item.qty);
        subtotal = checkAmount(subtotal + lineTotal);
        requestedQuantity.set(
          item.productId,
          checkAmount((requestedQuantity.get(item.productId) ?? 0) + item.qty),
        );
      }

      for (const [productId, qty] of requestedQuantity) {
        if ((productById.get(productId)?.stock ?? 0) < qty) {
          throw new BadRequestException(`Insufficient stock for product ${productId}`);
        }
      }

      const { promotionId, discountAmount } = await resolvePromotion(
        tx,
        promotionCode,
        subtotal,
      );
      return {
        promotionCode,
        promotionId,
        subtotal,
        discountAmount,
        total: checkAmount(subtotal - discountAmount),
      };
    });
  }
}
