import { Router } from 'express';
import { resumeController } from './resume.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { resumeUpload } from '../../middleware/upload.js';
import { uploadRateLimiter } from '../../middleware/rate-limiter.js';

export const resumeRouter = Router();

resumeRouter.use(authenticate);

resumeRouter.post('/upload', uploadRateLimiter, resumeUpload, resumeController.upload);
resumeRouter.get('/', resumeController.list);
resumeRouter.get('/:id', resumeController.getById);
resumeRouter.post('/:id/analyze', resumeController.analyze);
resumeRouter.post('/:id/confirm', resumeController.confirm);
resumeRouter.get('/:id/download', resumeController.download);

