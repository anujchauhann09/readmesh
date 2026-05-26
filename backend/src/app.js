import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { API_PREFIX } from '@readmesh/shared';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';


export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(pinoHttp({ logger }));

  app.use(helmet());
  app.use(cors({ origin: config.server.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use('/api', apiRateLimiter);

  app.use(API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
