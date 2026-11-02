import test from 'node:test';
import assert from 'node:assert/strict';
import { seedIngredientRecipes } from './seed-recipes.mjs';
import {
  PRODUCTS,
  INGREDIENTS,
  RECIPES,
  USERS,
  PROMOTIONS,
  ORDERS,
  SIZE_SURCHARGE,
  TOPPING_PRICE,
  unitPrice,
  discountFor,
  validateFixtures,
} from './seed-data.mjs';

test('BrewLite fixtures are internally consistent', () => {
  assert.equal(validateFixtures(), true);
  assert.ok(PRODUCTS.length >= 8);
  assert.equal(new Set(ORDERS.map((order) => order.key)).size, ORDERS.length);
});

test('products have VN dong integer prices and images', () => {
  for (const product of PRODUCTS) {
    assert.ok(Number.isInteger(product.price) && product.price > 0);
    assert.ok(product.imageUrl.startsWith('/images/'));
  }
});

test('ingredient catalog and recipes match the documented drink formulas', () => {
  assert.equal(INGREDIENTS.length, 22);
  assert.equal(RECIPES.length, 43);
  assert.ok(RECIPES.some((recipe) => recipe.productName === 'Cappuccino' && recipe.ingredientCode === 'I002' && recipe.quantity === 30));
  assert.ok(RECIPES.filter((recipe) => recipe.ingredientCode === 'I006').every((recipe) => recipe.isOptional || recipe.productName === 'Matcha Latte'));
});

test('inventory initialization fills empty ingredients without overwriting existing stock', async () => {
  const updates = [];
  let nextId = 1;
  const prisma = {
    ingredient: {
      findUnique: async ({ where }) => ({
        id: Number(where.code.slice(1)),
        code: where.code,
        stockQuantity: where.code === 'I001' ? 125 : 0,
      }),
      update: async ({ where, data }) => {
        updates.push({ where, data });
        return { id: where.id, ...data };
      },
      create: async ({ data }) => ({ id: nextId++, ...data }),
    },
    productIngredient: {
      findUnique: async () => ({ id: 1 }),
      create: async () => ({ id: 1 }),
    },
  };
  const productsByName = new Map(
    PRODUCTS.map((product, index) => [product.name, { id: index + 1 }]),
  );

  await seedIngredientRecipes(prisma, productsByName, {
    initializeEmptyStock: true,
  });

  assert.equal(updates.length, INGREDIENTS.length - 1);
  assert.ok(updates.every(({ where }) => where.id !== 1));
  assert.ok(updates.every(({ data }) => data.stockQuantity === 10000));
});

test('demo users have unique .test addresses only', () => {
  assert.equal(new Set(USERS.map((user) => user.email)).size, USERS.length);
  assert.ok(USERS.every((user) => user.email.endsWith('@brewlite.test')));
});

test('price calculation accounts for size and toppings', () => {
  assert.equal(SIZE_SURCHARGE.M, 5000);
  assert.equal(TOPPING_PRICE['Kem cheese'], 9000);
  assert.equal(unitPrice(35000, 'M', ['Kem cheese']), 49000);
  assert.throws(() => unitPrice(35000, 'XL', []), /Unknown size/);
  assert.throws(() => unitPrice(35000, 'S', ['Unknown']), /Unknown topping/);
});

test('percentage and fixed promotions are capped by subtotal', () => {
  const welcome = PROMOTIONS.find((p) => p.code === 'WELCOME10');
  const fixed = PROMOTIONS.find((p) => p.code === 'GIAM20K');
  assert.equal(discountFor(100000, welcome), 10000);
  assert.equal(discountFor(110000, fixed), 20000);
  assert.throws(() => discountFor(40000, welcome), /min order/);
});

test('every paid order fixture has a successful payment', () => {
  for (const order of ORDERS) {
    const paid = ['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(order.status);
    assert.equal(order.paymentStatus === 'SUCCESS', paid);
  }
});
