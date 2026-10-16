import { Injectable } from '@nestjs/common';

export type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'PAYMENT_FAILED' | 'CANCELLED';

export type CreateOrderInput = {
  userId: number;
  items: Array<{ productId: number; size: string; qty: number; price: number }>;
};

@Injectable()
export class OrdersService {
  create(input: CreateOrderInput) {
    const total = input.items.reduce((sum, item) => sum + item.qty * item.price, 0);

    return {
      orderId: Math.floor(Math.random() * 100000),
      status: 'PENDING' as OrderStatus,
      total,
      userId: input.userId,
      items: input.items,
    };
  }
}
