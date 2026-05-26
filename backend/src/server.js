import { createApp } from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './lib/prisma.js';

const app = createApp();

const server = app.listen(config.server.port, () => {
  logger.info(`readmesh API listening on :${config.server.port} [${config.env}]`);
});

const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Closed out remaining connections. Bye.');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Could not close connections in time, forcing shutdown.');
    process.exit(1);
  }, 10_000).unref();
};

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception — exiting');
  process.exit(1);
});
