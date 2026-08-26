import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  safeEqual,
} from '../src/utils/jwt.js';

const SUB = '11111111-1111-4111-8111-111111111111';

test('round-trips an access token with its claims', () => {
  const payload = verifyAccessToken(signAccessToken({ sub: SUB, role: 'developer' }));
  assert.equal(payload.sub, SUB);
  assert.equal(payload.role, 'developer');
  assert.equal(payload.iss, 'readmesh');
  assert.equal(payload.aud, 'readmesh-api');
});

test('pins the algorithm in the header', () => {
  const [header] = signAccessToken({ sub: SUB, role: 'developer' }).split('.');
  const decoded = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
  assert.equal(decoded.alg, 'HS256');
});

test('rejects an unsigned "alg: none" token', () => {
  const forged = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString(
    'base64url',
  )}.${Buffer.from(JSON.stringify({ sub: SUB, role: 'admin' })).toString('base64url')}.`;
  assert.throws(() => verifyAccessToken(forged));
});

test('rejects a token minted for a different issuer or audience', () => {
  const wrongIssuer = jwt.sign({ role: 'developer' }, process.env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    subject: SUB,
    expiresIn: '15m',
    issuer: 'somewhere-else',
    audience: 'readmesh-api',
  });
  assert.throws(() => verifyAccessToken(wrongIssuer), /issuer/i);

  const wrongAudience = jwt.sign({ role: 'developer' }, process.env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    subject: SUB,
    expiresIn: '15m',
    issuer: 'readmesh',
    audience: 'another-api',
  });
  assert.throws(() => verifyAccessToken(wrongAudience), /audience/i);
});

test('access and refresh secrets are not interchangeable', () => {
  const { token: refreshToken } = generateRefreshToken({ sub: SUB });
  assert.throws(() => verifyAccessToken(refreshToken));
  assert.throws(() => verifyRefreshToken(signAccessToken({ sub: SUB, role: 'developer' })));
});

test('refresh tokens are unique and hashed for storage', () => {
  const a = generateRefreshToken({ sub: SUB });
  const b = generateRefreshToken({ sub: SUB });

  assert.notEqual(a.token, b.token, 'each refresh token carries a fresh jti');
  assert.equal(a.tokenHash, hashToken(a.token));
  assert.match(a.tokenHash, /^[0-9a-f]{64}$/);
  assert.ok(!a.tokenHash.includes(a.token));
});

test('safeEqual compares without throwing on mismatched input', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('abc', 'abcd'), false);
  assert.equal(safeEqual('abc', undefined), false);
  assert.equal(safeEqual(null, null), false);
});
