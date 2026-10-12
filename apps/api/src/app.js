import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { requestLogger } from './middleware/request-logger.js';
import { notFoundHandler } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { profileRouter } from './modules/profile/profile.routes.js';
import { resumeRouter } from './modules/resumes/resume.routes.js';
import { githubRouter } from './modules/github/github.routes.js';
import { evidenceRouter } from './modules/evidence/evidence.routes.js';
import { internshipRouter } from './modules/internships/internship.routes.js';
import { matchingRouter } from './modules/matching/matching.routes.js';
import { roadmapRouter } from './modules/roadmaps/roadmap.routes.js';
import { applicationRouter } from './modules/applications/application.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    })
  );

  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(cookieParser());

  app.use(requestLogger);

  const apiRouter = express.Router();
  apiRouter.use('/health', healthRouter);
  apiRouter.use('/auth', authRouter);
  apiRouter.use('/profile', profileRouter);
  apiRouter.use('/resumes', resumeRouter);
  apiRouter.use('/github', githubRouter);
  apiRouter.use('/evidence', evidenceRouter);
  apiRouter.use('/internships', internshipRouter);
  apiRouter.use('/matching', matchingRouter);
  apiRouter.use('/roadmaps', roadmapRouter);
  apiRouter.use('/applications', applicationRouter);
  apiRouter.use('/dashboard', dashboardRouter);

  app.use(env.API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
