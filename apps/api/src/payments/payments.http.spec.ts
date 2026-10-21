import { jest } from '@jest/globals';
import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

type TestOrder = {
  id: number;
  status: string;
  total: number;
};

type TestPaymentCreateData = {
  orderId: number;
  amount: number;
  method: string;
  status: string;
  idempotencyKey: string;
};

describe('POST /payments', () => {
  let app: INestApplication;

  const tx = {
    order: {
      findFirst: jest.fn<
        () => Promise<TestOrder | null>
      >(),
      updateMany: jest.fn<
        () => Promise<{ count: number }>
      >(),
    },
    payment: {
      create: jest.fn<
        (args: { data: TestPaymentCreateData }) => Promise<{
          id: number;
          orderId: number;
          amount: number;
          method: string;
          status: string;
        }>
      >(),
    },
  };

  const prisma = {
    $transaction: jest.fn<
      (callback: (client: typeof tx) => Promise<unknown>) => Promise<unknown>
    >(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: 7 };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(tx));
    tx.order.findFirst.mockResolvedValue({
      id: 42,
      status: 'PENDING',
      total: 94000,
    });
    tx.order.updateMany.mockResolvedValue({ count: 1 });
    tx.payment.create.mockImplementation(async ({ data }) => ({
      id: 9,
      orderId: data.orderId,
      amount: data.amount,
      method: data.method,
      status: data.status,
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  it('persists a successful payment and marks the order PAID', async () => {
    const response = await request(app.getHttpServer())
      .post('/payments')
      .send({ orderId: 42, method: 'MOMO' })
      .expect(201);

    expect(response.body).toMatchObject({
      id: 9,
      orderId: 42,
      amount: 94000,
      method: 'MOMO',
      status: 'PAID',
      paymentStatus: 'SUCCESS',
    });
    expect(tx.order.findFirst).toHaveBeenCalledWith({
      where: { id: 42, userId: 7 },
      select: { id: true, status: true, total: true },
    });
    expect(tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: 42, userId: 7, status: 'PENDING' },
      data: { status: 'PAID' },
    });
    expect(tx.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 42,
        amount: 94000,
        method: 'MOMO',
        status: 'SUCCESS',
      }),
      select: {
        id: true,
        orderId: true,
        amount: true,
        method: true,
        status: true,
      },
    });
  });

  it('persists a failed payment and marks the order PAYMENT_FAILED', async () => {
    const response = await request(app.getHttpServer())
      .post('/payments')
      .send({
        orderId: 42,
        method: 'CARD',
        simulateFailure: true,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      orderId: 42,
      amount: 94000,
      method: 'CARD',
      status: 'PAYMENT_FAILED',
      paymentStatus: 'FAILED',
    });
    expect(tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: 42, userId: 7, status: 'PENDING' },
      data: { status: 'PAYMENT_FAILED' },
    });
    expect(tx.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'FAILED',
      }),
      select: expect.any(Object),
    });
  });

  it('rejects unknown and non-pending orders without recording a payment', async () => {
    tx.order.findFirst.mockResolvedValue(null);
    await request(app.getHttpServer())
      .post('/payments')
      .send({ orderId: 42, method: 'CARD' })
      .expect(404);
    expect(tx.payment.create).not.toHaveBeenCalled();

    tx.order.findFirst.mockResolvedValue({
      id: 42,
      status: 'PAID',
      total: 94000,
    });
    await request(app.getHttpServer())
      .post('/payments')
      .send({ orderId: 42, method: 'CARD' })
      .expect(409);
    expect(tx.payment.create).not.toHaveBeenCalled();
  });

  it('rejects malformed payment requests', async () => {
    await request(app.getHttpServer())
      .post('/payments')
      .send({ orderId: 0, method: 'CASH' })
      .expect(400);

    expect(tx.order.findFirst).not.toHaveBeenCalled();
  });
});
