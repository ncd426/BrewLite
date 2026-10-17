// End-to-end smoke check on the LIVE NestJS API and PostgreSQL.
// Run from apps/api AFTER starting npm run start:dev in another terminal:
//   node scripts/check-products.mjs
// The 500ms target is checked on this machine, not guaranteed in every deployment.
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

const apiUrl = (process.env.PRODUCTS_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const budgetMs = Number(process.env.PRODUCTS_MAX_MS || 500);
const runs = Number(process.env.PRODUCTS_BENCH_RUNS || 20);

async function call(path) {
  const t0 = performance.now();
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { Accept: 'application/json' },
  });
  const duration = performance.now() - t0;
  let json;
  try { json = await response.json(); } catch { throw new Error(`${path} did not return JSON`); }
  return { status: response.status, json, duration };
}

function validProduct(p) {
  return p && Number.isInteger(p.id) && p.id > 0 &&
    typeof p.name === 'string' && p.name.trim().length > 0 &&
    Number.isInteger(p.price) && p.price > 0 &&
    typeof p.imageUrl === 'string' && p.imageUrl.startsWith('https://') &&
    Number.isInteger(p.stock) && p.stock >= 0;
}

function percentile(samples, p) {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.ceil(p * sorted.length) - 1];
}

async function main() {
  assert.ok(Number.isInteger(runs) && runs >= 5 && runs <= 200, 'PRODUCTS_BENCH_RUNS must be 5..200');
  assert.ok(Number.isFinite(budgetMs) && budgetMs > 0, 'PRODUCTS_MAX_MS must be > 0');

  const list = await call('/products');
  assert.equal(list.status, 200, 'GET /products must return HTTP 200');
  assert.ok(Array.isArray(list.json), 'GET /products must return a JSON array');
  assert.ok(list.json.length >= 8, 'Seed must provide at least 8 products');
  assert.ok(list.json.every(validProduct), 'All menu products must have id, name, price, imageUrl, stock');
  assert.ok(list.json.every((p, i) => i === 0 || list.json[i - 1].id <= p.id), 'Products must be ordered by id');

  const first = list.json[0];
  const detail = await call(`/products/${first.id}`);
  assert.equal(detail.status, 200, 'GET /products/:id must return HTTP 200');
  assert.deepEqual(detail.json, first, 'Detail must match the list entry');

  const unknown = await call('/products/2147483647');
  assert.equal(unknown.status, 404, 'Unknown product must return HTTP 404');
  const invalid = await call('/products/abc');
  assert.equal(invalid.status, 400, 'Invalid product ID must return HTTP 400');

  // Warm the server and Prisma connection before measuring requests.
  for (let i = 0; i < 5; i++) {
    await call('/products');
    await call(`/products/${first.id}`);
  }

  for (const path of ['/products', `/products/${first.id}`]) {
    const samples = [];
    for (let i = 0; i < runs; i++) {
      const result = await call(path);
      assert.equal(result.status, 200);
      samples.push(result.duration);
    }
    const p95 = percentile(samples, 0.95);
    const max = Math.max(...samples);
    console.log(`${path}: p95=${p95.toFixed(1)}ms, max=${max.toFixed(1)}ms, ${runs} samples (warm, localhost)`);
    assert.ok(p95 < budgetMs, `Performance target not met: p95=${p95.toFixed(1)}ms >= ${budgetMs}ms`);
  }

  console.log(`PASS: ${list.json.length} API products; GET list/detail JSON; 400/404; p95 < ${budgetMs}ms.`);
}

main().catch((error) => {
  console.error('BrewLite products HTTP test FAILED:', error.message || error);
  console.error(`Check that NestJS runs at ${apiUrl} and Postgres/Prisma are reachable.`);
  process.exitCode = 1;
});
