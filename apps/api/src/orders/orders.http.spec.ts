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
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

type TestOrderCreateData = {
  total: number;
  items: {
    create: Array<{
      product: { connect: { id: number } };
      size: string;
      qty: number;
      unitPrice: number;
      lineTotal: number;
      toppings: string[];
    }>;
  };
};
describe('POST /orders', () => {
  let app: INestApplication;

  const tx = {
    user: {
        findUnique: jest.fn<
        () => Promise<{ id: number } | null>
        >(),
    },
    product: {
        findMany: jest.fn<
        () => Promise<
            Array<{
            id: number;
            price: number;
            stock: number;
            }>
        >
        >(),
    },
    order: {
        create: jest.fn<
        (args: { data: TestOrderCreateData }) => Promise<unknown>
        >(),
    },
    };

    const prisma = {
    $transaction: jest.fn<
        (
        callback: (client: typeof tx) => Promise<unknown>,
        ) => Promise<unknown>
    >(),
    };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        OrdersService,
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

          req.user = {
            userId: 7,
            email: 'test@brewlite.test',
          };

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

    prisma.$transaction.mockImplementation(
      (callback) => callback(tx),
    );

    tx.user.findUnique.mockResolvedValue({ id: 7 });

    tx.product.findMany.mockResolvedValue([
      {
        id: 1,
        price: 35000,
        stock: 12,
      },
    ]);

    tx.order.create.mockImplementation(async ({ data }) => ({
      id: 42,
      status: 'PENDING',
      total: data.total,
      userId: 7,
      items: data.items.create.map((item, index) => ({
        id: index + 1,
        productId: item.product.connect.id,
        size: item.size,
        qty: item.qty,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        toppings: item.toppings,
      })),
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates an order using server prices (201)', async () => {
    const response = await request(app.getHttpServer())
      .post('/orders')
      .send({
        items: [
          {
            productId: 1,
            size: 'M',
            qty: 2,
            toppings: ['Trân châu'],
            price: 1,
          },
        ],
      })
      .expect(201);

    // (35000 + 5000 + 7000) * 2 = 94000
    expect(response.body).toMatchObject({
      orderId: 42,
      status: 'PENDING',
      total: 94000,
      userId: 7,
    });

    const createData = tx.order.create.mock.calls[0][0].data;

    expect(createData.total).toBe(94000);
    expect(createData.items.create[0]).toMatchObject({
      qty: 2,
      unitPrice: 47000,
      lineTotal: 94000,
    });
  });

  it.each([
    [{ items: [] }, 'empty cart'],
    [
      { items: [{ productId: 1, size: 'XL', qty: 1 }] },
      'invalid size',
    ],
    [
      { items: [{ productId: 1, size: 'M', qty: 0 }] },
      'zero quantity',
    ],
    [
      { items: [{ productId: '1', size: 'M', qty: 1 }] },
      'invalid product ID',
    ],
    [
      {
        items: [
          {
            productId: 1,
            size: 'M',
            qty: 1,
            toppings: ['Invalid topping'],
          },
        ],
      },
      'invalid topping',
    ],
  ])('rejects %s: %s (400)', async (body, _description) => {
    await request(app.getHttpServer())
      .post('/orders')
      .send(body)
      .expect(400);

    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('rejects unknown products (400)', async () => {
    tx.product.findMany.mockResolvedValue([]);

    await request(app.getHttpServer())
      .post('/orders')
      .send({
        items: [
          { productId: 999, size: 'S', qty: 1 },
        ],
      })
      .expect(400);

    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('rejects insufficient stock (400)', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({
        items: [
          { productId: 1, size: 'S', qty: 13 },
        ],
      })
      .expect(400);

    expect(tx.order.create).not.toHaveBeenCalled();
  });
});
