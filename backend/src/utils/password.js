import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPassword = (plaintext) => bcrypt.hash(plaintext, SALT_ROUNDS);
export const verifyPassword = (plaintext, hash) => bcrypt.compare(plaintext, hash);
