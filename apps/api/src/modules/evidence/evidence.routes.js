import { Router } from 'express';
import { evidenceController } from './evidence.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export const evidenceRouter = Router();

evidenceRouter.use(authenticate);

evidenceRouter.get('/', evidenceController.list);
evidenceRouter.patch('/:id/confirm', evidenceController.confirm);
evidenceRouter.delete('/:id', evidenceController.delete);

