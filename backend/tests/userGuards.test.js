import test from 'node:test';
import assert from 'node:assert/strict';
import { assertAccountUsable, isAccountUsable } from '../src/modules/user/user.guards.js';

const active = { status: 'ACTIVE', deletedAt: null };

test('lets an active account through', () => {
  assert.equal(assertAccountUsable(active), active);
  assert.equal(isAccountUsable(active), true);
});

const caught = (fn) => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return null;
};

test('refuses a suspended account with 403', () => {
  const err = caught(() => assertAccountUsable({ status: 'SUSPENDED', deletedAt: null }));
  assert.equal(err?.statusCode, 403);
  assert.match(err.message, /suspended/i);
});

test('refuses a soft-deleted account even when the status still reads ACTIVE', () => {
  const err = caught(() => assertAccountUsable({ status: 'ACTIVE', deletedAt: new Date() }));
  assert.equal(err?.statusCode, 401);
});

test('refuses a DELETED account', () => {
  assert.throws(() => assertAccountUsable({ status: 'DELETED', deletedAt: new Date() }));
  assert.equal(isAccountUsable({ status: 'DELETED', deletedAt: new Date() }), false);
});

test('refuses a missing account', () => {
  assert.throws(() => assertAccountUsable(null));
  assert.throws(() => assertAccountUsable(undefined));
  assert.equal(isAccountUsable(null), false);
});

test('isAccountUsable never throws, so enumeration-safe callers can branch on it', () => {
  for (const input of [null, undefined, {}, { status: 'SUSPENDED' }]) {
    assert.equal(isAccountUsable(input), false);
  }
});
