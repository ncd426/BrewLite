// Development-only product seed for BrewLite. Run from apps/api:
//   node prisma/seed-products.mjs
// Requires the current menu fixtures from prisma/seed-data.mjs.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PRODUCTS } from './seed-data.mjs';

const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

function validateProductFixtures() {
  if (PRODUCTS.length < 8) {
    throw new Error(`At least 8 sample products required; found ${PRODUCTS.length}.`);
  }
  if (new Set(PRODUCTS.map((product) => product.name)).size !== PRODUCTS.length) {
    throw new Error('Product fixture names must be unique.');
  }
  for (const product of PRODUCTS) {
    if (!product.name?.trim() || !Number.isInteger(product.price) || product.price <= 0 ||
        !Number.isInteger(product.stock) || product.stock < 0 ||
        typeof product.imageUrl !== 'string' || !/^\/images\/[A-Za-z0-9._-]+$/.test(product.imageUrl)) {
      throw new Error(`Invalid menu fixture: ${JSON.stringify(product)}`);
    }
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo products in NODE_ENV=production.');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Configure apps/api/.env.');
  }
  validateProductFixtures();

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    let created = 0;
    let kept = 0;
    let imageUpdated = 0;

    for (const product of PRODUCTS) {
      // Product.name is not unique in schema.prisma. Seed sequentially by name;
      // do not run multiple seed processes concurrently.
      const existing = await prisma.product.findFirst({
        where: { name: product.name },
        orderBy: { id: 'asc' },
        select: { id: true, imageUrl: true },
      });

      if (!existing) {
        await prisma.product.create({ data: product });
        created++;
      } else if (existing.imageUrl !== product.imageUrl) {
        // Keep menu images in sync without changing prices, stock, or IDs.
        await prisma.product.update({
          where: { id: existing.id },
          data: { imageUrl: product.imageUrl },
        });
        imageUpdated++;
      } else {
        kept++;
      }
    }

    const total = await prisma.product.count();
    if (total < 8) throw new Error(`Only ${total} products in database; at least 8 required.`);
    console.log(`BrewLite products: ${PRODUCTS.length} menu fixtures, ${created} added, ${kept} kept, ${imageUpdated} images synchronized.`);
    console.log(`Product rows in PostgreSQL: ${total}. Re-running does not duplicate the fixture names.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('BrewLite product seed FAILED:', error.message || error);
  process.exitCode = 1;
});
