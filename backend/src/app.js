import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { API_PREFIX, DOCUMENT_LIMITS } from '@readmesh/shared';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';


export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    pinoHttp({
      logger,
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );

  app.use(helmet());
  app.use(cors({ origin: config.server.corsOrigin, credentials: true }));
  // Keep the JSON body limit above the document content cap (+ headroom for JSON
  // escaping and multibyte) so oversize documents are rejected by validation with
  // a friendly message, not by the body parser with a raw 413.
  app.use(express.json({ limit: `${Math.ceil((DOCUMENT_LIMITS.CONTENT_MAX * 3) / 1_000_000)}mb` }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use('/api', apiRateLimiter);

  app.use(API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
