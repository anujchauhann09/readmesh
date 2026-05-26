import { prisma } from '../../lib/prisma.js';


export const getHealthStatus = async () => {
  let database = 'up';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = 'down';
  }

  return {
    status: database === 'up' ? 'ok' : 'degraded',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    services: { database },
  };
};
