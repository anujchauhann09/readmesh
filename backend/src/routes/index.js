import { Router } from 'express';
import { ROUTES } from '@readmesh/shared';
import { healthRouter } from '../modules/health/health.route.js';
import { authRouter } from '../modules/auth/auth.route.js';
import { userRouter } from '../modules/user/user.route.js';
import { githubRouter } from '../modules/github/github.route.js';
import { summaryRouter } from '../modules/summary/summary.route.js';
import { ragRouter } from '../modules/rag/rag.route.js';
import { annotationRouter } from '../modules/annotation/annotation.route.js';
import { documentRouter } from '../modules/document/document.route.js';
import { oauthRouter } from '../modules/oauth/oauth.route.js';

export const apiRouter = Router();

apiRouter.use(ROUTES.HEALTH, healthRouter);
apiRouter.use(ROUTES.AUTH.BASE, authRouter);
apiRouter.use(ROUTES.USERS.BASE, userRouter);
apiRouter.use(ROUTES.GITHUB.BASE, githubRouter);
apiRouter.use(ROUTES.SUMMARY.BASE, summaryRouter);
apiRouter.use(ROUTES.RAG.BASE, ragRouter);
apiRouter.use(ROUTES.ANNOTATIONS.BASE, annotationRouter);
apiRouter.use(ROUTES.DOCUMENTS.BASE, documentRouter);
apiRouter.use(ROUTES.OAUTH.BASE, oauthRouter);


