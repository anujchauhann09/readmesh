import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const signAccessToken = ({ sub, role }) =>
  jwt.sign({ role }, config.jwt.accessSecret, { subject: sub, expiresIn: config.jwt.accessTtl });

export const verifyAccessToken = (token) => jwt.verify(token, config.jwt.accessSecret);

export const generateRefreshToken = ({ sub }) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ jti }, config.jwt.refreshSecret, {
    subject: sub,
    expiresIn: config.jwt.refreshTtl,
  });
  return { token, tokenHash: hashToken(token) };
};

export const verifyRefreshToken = (token) => jwt.verify(token, config.jwt.refreshSecret);

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
