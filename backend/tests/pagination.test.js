import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { PAGINATION } from '@readmesh/shared';
import { paginationQuery, toPrismaPage, toPage } from '../src/utils/pagination.js';

const schema = z.object(paginationQuery);

test('applies the default limit when none is given', () => {
  assert.deepEqual(schema.parse({}), { limit: PAGINATION.DEFAULT_LIMIT });
});

test('coerces a numeric string and rejects out-of-range limits', () => {
  assert.equal(schema.parse({ limit: '25' }).limit, 25);
  assert.throws(() => schema.parse({ limit: String(PAGINATION.MAX_LIMIT + 1) }));
  assert.throws(() => schema.parse({ limit: '0' }));
});

test('rejects a cursor that is not a uuid', () => {
  assert.throws(() => schema.parse({ cursor: 'not-a-uuid' }));
});

test('over-fetches one row so hasMore needs no COUNT', () => {
  assert.deepEqual(toPrismaPage({ limit: 10 }), { take: 11 });
  assert.deepEqual(toPrismaPage({ limit: 10, cursor: 'abc' }), {
    take: 11,
    cursor: { publicId: 'abc' },
    skip: 1,
  });
});

test('splits off the sentinel row and reports the next cursor', () => {
  const rows = Array.from({ length: 4 }, (_, i) => ({ publicId: `id-${i}` }));
  const { items, meta } = toPage(rows, { limit: 3 });

  assert.equal(items.length, 3);
  assert.equal(meta.hasMore, true);
  assert.equal(meta.nextCursor, 'id-2');
  assert.equal(meta.count, 3);
});

test('reports the end of the collection', () => {
  const { items, meta } = toPage([{ publicId: 'only' }], { limit: 3 });
  assert.equal(items.length, 1);
  assert.equal(meta.hasMore, false);
  assert.equal(meta.nextCursor, null);
});
