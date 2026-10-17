// Run from apps/api: node prisma/seed.mjs
// Requires Node >= 22 and the existing @prisma/client + bcrypt dependencies.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  PRODUCTS,
  USERS,
  PROMOTIONS,
  ORDERS,
  LOYALTY_VND_PER_POINT,
  discountFor,
  unitPrice,
  validateFixtures,
} from './seed-data.mjs';

if (existsSync(resolve(process.cwd(), '.env'))) {
  process.loadEnvFile(resolve(process.cwd(), '.env'));
}

function preflight() {
  validateFixtures();
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo accounts in NODE_ENV=production.');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Check apps/api/.env.');
  }
  if (!process.env.SEED_DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD.length < 12) {
    throw new Error('Set SEED_DEMO_PASSWORD to a local-only password with >= 12 characters. Do not commit it.');
  }
}

const prisma = new PrismaClient();

async function seedProducts() {
  let created = 0;
  const found = new Map();
  for (const fixture of PRODUCTS) {
    // Product.name is not unique in the current schema; do not rewrite existing rows.
    let product = await prisma.product.findFirst({ where: { name: fixture.name }, orderBy: { id: 'asc' } });
    if (!product) {
      product = await prisma.product.create({ data: fixture });
      created++;
    }
    found.set(fixture.name, product);
  }
  return { created, found };
}

async function seedPromotions() {
  let created = 0;
  const found = new Map();
  for (const fixture of PROMOTIONS) {
    let promotion = await prisma.promotion.findUnique({ where: { code: fixture.code } });
    if (!promotion) {
      promotion = await prisma.promotion.create({
        data: {
          ...fixture,
          startsAt: fixture.startsAt ? new Date(fixture.startsAt) : null,
          expiresAt: fixture.expiresAt ? new Date(fixture.expiresAt) : null,
        },
      });
      created++;
    }
    found.set(fixture.code, promotion);
  }
  return { created, found };
}

async function seedUsers() {
  let created = 0;
  const found = new Map();
  // Hash only once. Existing accounts are never overwritten on reruns.
  const passwordHash = await bcrypt.hash(process.env.SEED_DEMO_PASSWORD, 12);
  for (const fixture of USERS) {
    let user = await prisma.user.findUnique({ where: { email: fixture.email } });
    if (!user) {
      user = await prisma.user.create({ data: { email: fixture.email, passwordHash, loyaltyPoints: 0 } });
      created++;
    }
    found.set(fixture.email, user);
  }
  return { created, found };
}

async function seedOrders(productByName, userByEmail, promotionByCode) {
  let created = 0;
  for (const fixture of ORDERS) {
    const user = userByEmail.get(fixture.email);
    const items = fixture.items.map((line) => {
      const product = productByName.get(line.name);
      const perUnit = unitPrice(product.price, line.size, line.toppings);
      return {
        productId: product.id,
        size: line.size,
        qty: line.qty,
        unitPrice: perUnit,
        toppings: line.toppings,
        lineTotal: perUnit * line.qty,
      };
    });
    const subtotal = items.reduce((sum, line) => sum + line.lineTotal, 0);
    const promotion = fixture.promotion ? promotionByCode.get(fixture.promotion) : null;
    const reduction = discountFor(subtotal, promotion);
    const total = subtotal - reduction;
    const paid = fixture.paymentStatus === 'SUCCESS';
    const points = paid ? Math.floor(total / LOYALTY_VND_PER_POINT) : 0;

    const didCreate = await prisma.$transaction(async (tx) => {
      // The unique payment key avoids duplicate orders and loyalty awards on reruns.
      const existingPayment = await tx.payment.findUnique({ where: { idempotencyKey: fixture.key } });
      if (existingPayment) return false;

      await tx.order.create({
        data: {
          userId: user.id,
          status: fixture.status,
          total,
          discountAmount: reduction,
          promotionId: promotion ? promotion.id : null,
          loyaltyAwardedAt: paid ? new Date() : null,
          items: { create: items },
          payments: { create: {
            idempotencyKey: fixture.key,
            amount: total,
            method: fixture.method,
            status: fixture.paymentStatus,
          } },
        },
      });
      if (points > 0) {
        await tx.user.update({ where: { id: user.id }, data: { loyaltyPoints: { increment: points } } });
      }
      return true;
    });
    if (didCreate) created++;
  }
  return created;
}

async function main() {
  preflight();
  if (typeof prisma.promotion?.findUnique !== 'function') {
    throw new Error('Promotion model unavailable. Apply the MVP v2 schema, migrate deploy, then prisma generate.');
  }
  await prisma.$connect();
  console.log('Seeding BrewLite local database (existing rows will not be replaced)...');
  const products = await seedProducts();
  const promotions = await seedPromotions();
  const users = await seedUsers();
  const ordersCreated = await seedOrders(products.found, users.found, promotions.found);
  console.log(`Products: ${PRODUCTS.length} fixtures, ${products.created} created`);
  console.log(`Promotions: ${PROMOTIONS.length} fixtures, ${promotions.created} created`);
  console.log(`Users: ${USERS.length} demo accounts, ${users.created} created`);
  console.log(`Orders/payments: ${ORDERS.length} fixture pairs, ${ordersCreated} pairs created`);
  console.log('Safe to rerun. Accounts use your SEED_DEMO_PASSWORD only when first created.');
}

main()
  .catch((error) => {
    console.error('BrewLite seed failed:', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
