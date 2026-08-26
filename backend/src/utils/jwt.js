import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const ALGORITHM = 'HS256';

/**
 * Claims pinned on both sign and verify. Fixing the algorithm stops a token from
 * being accepted under one we did not intend, and issuer/audience keep a token
 * minted for another readmesh deployment from being replayed against this one.
 */
const signOptions = (extra) => ({
  algorithm: ALGORITHM,
  issuer: config.jwt.issuer,
  audience: config.jwt.audience,
  ...extra,
});

const verifyOptions = () => ({
  algorithms: [ALGORITHM],
  issuer: config.jwt.issuer,
  audience: config.jwt.audience,
});

export const signAccessToken = ({ sub, role }) =>
  jwt.sign(
    { role },
    config.jwt.accessSecret,
    signOptions({ subject: sub, expiresIn: config.jwt.accessTtl }),
  );

export const verifyAccessToken = (token) =>
  jwt.verify(token, config.jwt.accessSecret, verifyOptions());

export const generateRefreshToken = ({ sub }) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { jti },
    config.jwt.refreshSecret,
    signOptions({ subject: sub, expiresIn: config.jwt.refreshTtl }),
  );
  return { token, tokenHash: hashToken(token) };
};

export const verifyRefreshToken = (token) =>
  jwt.verify(token, config.jwt.refreshSecret, verifyOptions());

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Constant-time comparison for opaque secrets (reset tokens, OAuth state) so a
 * caller cannot learn a prefix by timing repeated guesses.
 */
export const safeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};
