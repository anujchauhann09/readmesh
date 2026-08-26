import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDurationMs } from '../src/utils/duration.js';

test('parses each supported unit', () => {
  assert.equal(parseDurationMs('500ms'), 500);
  assert.equal(parseDurationMs('30s'), 30_000);
  assert.equal(parseDurationMs('15m'), 900_000);
  assert.equal(parseDurationMs('2h'), 7_200_000);
  assert.equal(parseDurationMs('7d'), 604_800_000);
});

test('passes numbers straight through', () => {
  assert.equal(parseDurationMs(1234), 1234);
});

test('throws on an unparseable duration', () => {
  for (const bad of ['', '15', 'm15', '1w', '1.5h']) {
    assert.throws(() => parseDurationMs(bad), /Invalid duration/, bad);
  }
});
