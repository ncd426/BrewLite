import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTS,
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

test('products have VN dong integer prices, images, and stock', () => {
  for (const product of PRODUCTS) {
    assert.ok(Number.isInteger(product.price) && product.price > 0);
    assert.ok(Number.isInteger(product.stock) && product.stock >= 0);
    assert.ok(product.imageUrl.startsWith('https://'));
  }
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
