import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyRequestOrigin } from '../src/middleware/csrf.js';

// CORS_ORIGIN in tests/setup.js is
// "http://localhost:3000,https://app.readmesh.test".
const call = (method, headers = {}) => {
  const req = {
    method,
    get: (name) => headers[name.toLowerCase()],
  };
  let captured = 'not-called';
  verifyRequestOrigin(req, {}, (err) => {
    captured = err ?? null;
  });
  return captured;
};

test('safe methods are never blocked', () => {
  for (const method of ['GET', 'HEAD', 'OPTIONS']) {
    assert.equal(call(method, { origin: 'https://evil.example' }), null, method);
  }
});

test('accepts every configured origin', () => {
  assert.equal(call('POST', { origin: 'http://localhost:3000' }), null);
  assert.equal(call('POST', { origin: 'https://app.readmesh.test' }), null);
});

test('rejects a cross-site origin on a state-changing request', () => {
  const err = call('POST', { origin: 'https://evil.example' });
  assert.ok(err, 'expected the request to be refused');
  assert.equal(err.statusCode, 403);
});

test('rejects the bodyless cross-site POST that CORS alone would let through', () => {
  // The original hole: `fetch('/auth/logout', {method:'POST', credentials:'include'})`
  // from any page is a simple request, so no preflight ever ran.
  const err = call('POST', { origin: 'https://attacker.test' });
  assert.equal(err.statusCode, 403);
});

test('falls back to Referer when Origin is absent', () => {
  assert.equal(call('DELETE', { referer: 'http://localhost:3000/settings' }), null);
  assert.ok(call('DELETE', { referer: 'https://evil.example/page' }));
});

test('allows non-browser callers, which cannot be tricked into replaying cookies', () => {
  for (const method of ['POST', 'PATCH', 'DELETE']) {
    assert.equal(call(method), null, method);
  }
});

test('a look-alike origin is not accepted', () => {
  for (const origin of [
    'http://localhost:3001',
    'https://localhost:3000',
    'https://app.readmesh.test.evil.tld',
    'null',
    'not a url',
  ]) {
    assert.ok(call('POST', { origin }), origin);
  }
});
