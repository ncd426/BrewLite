import { jest } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OrdersController } from '../orders/orders.controller';
import { OrdersService } from '../orders/orders.service';
import { UsersController } from '../users/users.controller';
import { UsersService } from '../users/users.service';

describe('Authentication and order authorization (HTTP)', () => {
  const jwtSecret = 'auth-http-test-secret';
  const usersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findPublicById: jest.fn(),
  };
  let app: INestApplication<App>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: jwtSecret, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [AuthController, OrdersController, UsersController],
      providers: [
        AuthService,
        OrdersService,
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => jwtSecret },
        },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    jwtService = moduleFixture.get(JwtService);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers users with a bcrypt hash and returns a JWT', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockImplementation(async (user) => ({
      id: 12,
      ...user,
      loyaltyPoints: 0,
    }));

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Person Example',
        email: 'person@example.com',
        password: 'secret123',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: 12,
      name: 'Person Example',
      email: 'person@example.com',
    });
    expect(typeof response.body.accessToken).toBe('string');
    const [{ passwordHash }] = usersService.create.mock.calls[0];
    await expect(bcrypt.compare('secret123', passwordHash)).resolves.toBe(true);
  });

  it('returns 401 for a wrong password', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 12,
      email: 'person@example.com',
      passwordHash: await bcrypt.hash('correct-password', 10),
      loyaltyPoints: 0,
    });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'person@example.com', password: 'wrong-password' })
      .expect(401);
  });

  it('validates email format and minimum registration password length', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: '', email: 'not-an-email', password: '123' })
      .expect(400);
  });

  it('requires a bearer token to read the current user profile', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('returns the authenticated user profile without private fields', async () => {
    usersService.findPublicById.mockResolvedValue({
      id: 42,
      name: 'Person Example',
      email: 'person@example.com',
      loyaltyPoints: 5,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const token = jwtService.sign({ sub: 42, email: 'person@example.com' });

    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: 42,
      name: 'Person Example',
      email: 'person@example.com',
      loyaltyPoints: 5,
    });
    expect(usersService.findPublicById).toHaveBeenCalledWith(42);
  });

  it('rejects order creation without a bearer token', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({
        items: [{ productId: 1, size: 'M', qty: 1, price: 35000 }],
      })
      .expect(401);
  });

  it('uses the authenticated user from the JWT when creating an order', async () => {
    const token = jwtService.sign({ sub: 42, email: 'person@example.com' });

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: 1, size: 'M', qty: 1, price: 35000 }],
      })
      .expect(201);

    expect(response.body.userId).toBe(42);
  });

  afterAll(async () => {
    await app.close();
  });
});
