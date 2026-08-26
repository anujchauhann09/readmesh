import test from 'node:test';
import assert from 'node:assert/strict';
import { createTtlCache } from '../src/utils/ttlCache.js';

test('stores and returns a value', () => {
  const cache = createTtlCache({ ttlMs: 1000 });
  cache.set('k', 42);
  assert.equal(cache.get('k'), 42);
});

test('misses on an unknown key', () => {
  assert.equal(createTtlCache({ ttlMs: 1000 }).get('nope'), undefined);
});

test('expires entries past their ttl', async () => {
  const cache = createTtlCache({ ttlMs: 10 });
  cache.set('k', 'v');
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(cache.get('k'), undefined);
});

test('evicts the least recently used entry at capacity', () => {
  const cache = createTtlCache({ ttlMs: 10_000, max: 2 });
  cache.set('a', 1);
  cache.set('b', 2);
  cache.get('a'); // 'a' becomes most-recent, so 'b' is next out
  cache.set('c', 3);

  assert.equal(cache.get('b'), undefined);
  assert.equal(cache.get('a'), 1);
  assert.equal(cache.get('c'), 3);
});
