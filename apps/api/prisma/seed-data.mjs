// BrewLite development fixtures (money is always integer VND).
// Products intentionally keep the prices of the 3 existing API mock products.
export const PRODUCTS = [
  { name: 'C\u00e0 ph\u00ea s\u1eefa', price: 35000, stock: 12, imageUrl: 'https://images.unsplash.com/photo-1497636577773-f2a944c4f6d9' },
  { name: 'Americano', price: 40000, stock: 8, imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93' },
  { name: 'Mocha', price: 45000, stock: 5, imageUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31' },
  { name: 'Espresso', price: 30000, stock: 25, imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348' },
  { name: 'B\u1ea1c x\u1ec9u', price: 39000, stock: 30, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735' },
  { name: 'Cappuccino', price: 45000, stock: 18, imageUrl: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f' },
  { name: 'Latte', price: 45000, stock: 22, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735' },
  { name: 'Cold Brew', price: 43000, stock: 28, imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c' },
  { name: 'Tr\u00e0 \u0111\u00e0o', price: 39000, stock: 40, imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc' },
  { name: 'Tr\u00e0 v\u1ea3i', price: 42000, stock: 26, imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574' },
  { name: 'Matcha Latte', price: 49000, stock: 15, imageUrl: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7' },
  { name: 'Chocolate \u0111\u00e1 xay', price: 55000, stock: 16, imageUrl: 'https://images.unsplash.com/photo-1542990253-0b8be0f0f0ed' },
];

// Only local .test accounts. Password is provided at runtime by the developer.
export const USERS = [
  { email: 'demo@brewlite.test' },
  { email: 'khach1@brewlite.test' },
  { email: 'khach2@brewlite.test' },
];

export const PROMOTIONS = [
  { code: 'WELCOME10', type: 'PERCENT', value: 10, minOrderTotal: 50000, isActive: true, startsAt: null, expiresAt: null },
  { code: 'GIAM20K', type: 'FIXED', value: 20000, minOrderTotal: 100000, isActive: true, startsAt: null, expiresAt: null },
  { code: 'HETHAN15', type: 'PERCENT', value: 15, minOrderTotal: 50000, isActive: true, startsAt: null, expiresAt: '2025-01-01T00:00:00.000Z' },
  { code: 'TAMNGUNG30', type: 'PERCENT', value: 30, minOrderTotal: 80000, isActive: false, startsAt: null, expiresAt: null },
  { code: 'CHUAHD5K', type: 'FIXED', value: 5000, minOrderTotal: 40000, isActive: true, startsAt: '2099-01-01T00:00:00.000Z', expiresAt: null },
];

// Demo only: these conventions have to be approved by the team before the
// real orders/payments services calculate charges and loyalty points.
export const SIZE_SURCHARGE = Object.freeze({ S: 0, M: 5000, L: 10000 });
export const TOPPING_PRICE = Object.freeze({
  'Tr\u00e2n ch\u00e2u': 7000,
  'Kem cheese': 9000,
  'Th\u1ea1ch c\u00e0 ph\u00ea': 5000,
});
export const LOYALTY_VND_PER_POINT = 10000;

// A stable payment key is the anchor for idempotent sample orders on re-runs.
// Every example order has a payment record (including pending/failed attempts).
export const ORDERS = [
  { key: 'brewlite-seed-v1-pending', email: 'demo@brewlite.test', status: 'PENDING', paymentStatus: 'PENDING', method: 'CARD', promotion: null, items: [
    { name: 'Americano', size: 'S', qty: 1, toppings: [] },
  ] },
  { key: 'brewlite-seed-v1-paid', email: 'demo@brewlite.test', status: 'PAID', paymentStatus: 'SUCCESS', method: 'MOMO', promotion: 'WELCOME10', items: [
    { name: 'C\u00e0 ph\u00ea s\u1eefa', size: 'M', qty: 2, toppings: ['Tr\u00e2n ch\u00e2u'] },
  ] },
  { key: 'brewlite-seed-v1-preparing', email: 'khach1@brewlite.test', status: 'PREPARING', paymentStatus: 'SUCCESS', method: 'CARD', promotion: 'GIAM20K', items: [
    { name: 'Mocha', size: 'L', qty: 1, toppings: ['Kem cheese'] },
    { name: 'Cappuccino', size: 'M', qty: 1, toppings: [] },
  ] },
  { key: 'brewlite-seed-v1-ready', email: 'khach2@brewlite.test', status: 'READY', paymentStatus: 'SUCCESS', method: 'MOMO', promotion: 'WELCOME10', items: [
    { name: 'Tr\u00e0 \u0111\u00e0o', size: 'M', qty: 2, toppings: ['Th\u1ea1ch c\u00e0 ph\u00ea'] },
  ] },
  { key: 'brewlite-seed-v1-completed', email: 'demo@brewlite.test', status: 'COMPLETED', paymentStatus: 'SUCCESS', method: 'CARD', promotion: 'GIAM20K', items: [
    { name: 'Latte', size: 'L', qty: 1, toppings: [] },
    { name: 'B\u1ea1c x\u1ec9u', size: 'M', qty: 2, toppings: [] },
  ] },
  { key: 'brewlite-seed-v1-failed', email: 'khach2@brewlite.test', status: 'PAYMENT_FAILED', paymentStatus: 'FAILED', method: 'MOMO', promotion: null, items: [
    { name: 'Matcha Latte', size: 'M', qty: 1, toppings: [] },
  ] },
  { key: 'brewlite-seed-v1-cancelled', email: 'khach1@brewlite.test', status: 'CANCELLED', paymentStatus: 'FAILED', method: 'CARD', promotion: null, items: [
    { name: 'Espresso', size: 'S', qty: 1, toppings: [] },
  ] },
];

export function unitPrice(basePrice, size, toppings) {
  if (!(size in SIZE_SURCHARGE)) throw new Error(`Unknown size: ${size}`);
  let price = basePrice + SIZE_SURCHARGE[size];
  for (const topping of toppings) {
    if (!(topping in TOPPING_PRICE)) throw new Error(`Unknown topping: ${topping}`);
    price += TOPPING_PRICE[topping];
  }
  return price;
}

export function discountFor(subtotal, promotion) {
  if (!promotion) return 0;
  if (subtotal < promotion.minOrderTotal) {
    throw new Error(`Promotion ${promotion.code} needs min order ${promotion.minOrderTotal}`);
  }
  if (promotion.type === 'PERCENT') {
    return Math.min(subtotal, Math.floor((subtotal * promotion.value) / 100));
  }
  if (promotion.type === 'FIXED') {
    return Math.min(subtotal, promotion.value);
  }
  throw new Error(`Unknown discount type: ${promotion.type}`);
}

export function validateFixtures() {
  if (PRODUCTS.length < 8) throw new Error('At least 8 products are required');
  const unique = (items, key, type) => {
    if (new Set(items.map((item) => item[key])).size !== items.length) {
      throw new Error(`Duplicate ${type} ${key}`);
    }
  };
  unique(PRODUCTS, 'name', 'product');
  unique(USERS, 'email', 'user');
  unique(PROMOTIONS, 'code', 'promotion');
  unique(ORDERS, 'key', 'order');
  const productNames = new Set(PRODUCTS.map((product) => product.name));
  const userEmails = new Set(USERS.map((user) => user.email));
  const activePromotions = new Map(PROMOTIONS.map((promotion) => [promotion.code, promotion]));
  for (const product of PRODUCTS) {
    if (!Number.isInteger(product.price) || product.price <= 0 || !Number.isInteger(product.stock) || product.stock < 0) {
      throw new Error(`Invalid price/stock: ${product.name}`);
    }
  }
  for (const promo of PROMOTIONS) {
    if (promo.type === 'PERCENT' && (promo.value <= 0 || promo.value > 100)) throw new Error(`Invalid percentage: ${promo.code}`);
    if (promo.type === 'FIXED' && promo.value <= 0) throw new Error(`Invalid fixed discount: ${promo.code}`);
  }
  for (const order of ORDERS) {
    if (!userEmails.has(order.email)) throw new Error(`Unknown order user: ${order.email}`);
    if (!order.items.length) throw new Error(`Order ${order.key} is empty`);
    let subtotal = 0;
    for (const item of order.items) {
      if (!productNames.has(item.name)) throw new Error(`Unknown product: ${item.name}`);
      if (!Number.isInteger(item.qty) || item.qty < 1) throw new Error(`Invalid qty: ${order.key}`);
      const product = PRODUCTS.find((p) => p.name === item.name);
      subtotal += unitPrice(product.price, item.size, item.toppings) * item.qty;
    }
    if (order.promotion) {
      const promo = activePromotions.get(order.promotion);
      if (!promo || !promo.isActive || promo.expiresAt || promo.startsAt) throw new Error(`Invalid order promotion: ${order.key}`);
      discountFor(subtotal, promo);
    }
    if (['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(order.status) !== (order.paymentStatus === 'SUCCESS')) {
      throw new Error(`Order/payment status mismatch: ${order.key}`);
    }
  }
  return true;
}
