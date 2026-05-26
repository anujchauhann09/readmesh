import { PrismaClient } from '@prisma/client';
import { config } from '../config/env.js';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__readmeshPrisma ??
  new PrismaClient({
    log: config.isProd ? ['error'] : ['warn', 'error'],
  });

if (!config.isProd) {
  globalForPrisma.__readmeshPrisma = prisma;
}
