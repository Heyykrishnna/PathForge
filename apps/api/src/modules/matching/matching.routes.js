import { Router } from 'express';
import { matchingController } from './matching.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { analysisRateLimiter } from '../../middleware/rate-limiter.js';

export const matchingRouter = Router();

matchingRouter.use(authenticate);

matchingRouter.post('/analyze', analysisRateLimiter, matchingController.analyze);
matchingRouter.get('/results/:id', matchingController.getResult);
matchingRouter.get('/history', matchingController.getHistory);

