import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { API_PREFIX, DOCUMENT_LIMITS } from '@readmesh/shared';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import { verifyRequestOrigin } from './middleware/csrf.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

// Worst-case bytes for a document at the content cap: 4 bytes per character for
// UTF-8, plus a megabyte of headroom for JSON escaping and the rest of the body.
// Anything over this is turned into a friendly 413 by the error handler rather
// than surfacing as a raw body-parser failure.
const JSON_BODY_LIMIT = `${Math.ceil((DOCUMENT_LIMITS.CONTENT_MAX * 4) / 1_000_000) + 1}mb`;

export const createApp = () => {
  const app = express();

  app.set('trust proxy', config.server.trustProxy);
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
  app.use(cors({ origin: config.server.corsOrigins, credentials: true }));
  // JSON only. No urlencoded/multipart parser is mounted: nothing consumes form
  // bodies, and leaving one out keeps form-based CSRF off the table entirely.
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(cookieParser());

  app.use('/api', apiRateLimiter);
  app.use('/api', verifyRequestOrigin);

  app.use(API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
