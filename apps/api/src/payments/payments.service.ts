import { Injectable } from '@nestjs/common';

export type PaymentMethod = 'MOMO' | 'CARD';

@Injectable()
export class PaymentsService {
  processPayment(orderId: number, amount: number, method: PaymentMethod, idempotencyKey: string) {
    const success = method === 'CARD' || method === 'MOMO';

    return {
      orderId,
      amount,
      method,
      idempotencyKey,
      status: success ? 'PAID' : 'PAYMENT_FAILED',
      paymentReference: `PAY-${Date.now()}`,
    };
  }
}
