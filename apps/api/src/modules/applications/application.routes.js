import { Router } from 'express';
import { applicationController } from './application.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export const applicationRouter = Router();

applicationRouter.use(authenticate);

applicationRouter.get('/', applicationController.list);
applicationRouter.post('/', applicationController.create);
applicationRouter.get('/:id', applicationController.getById);
applicationRouter.patch('/:id', applicationController.update);
applicationRouter.delete('/:id', applicationController.delete);

