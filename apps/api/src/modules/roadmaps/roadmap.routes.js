import { Router } from 'express';
import { roadmapController } from './roadmap.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export const roadmapRouter = Router();

roadmapRouter.use(authenticate);

roadmapRouter.post('/generate', roadmapController.generate);
roadmapRouter.get('/', roadmapController.list);
roadmapRouter.get('/bridge-projects', roadmapController.listBridgeProjects);
roadmapRouter.get('/:id', roadmapController.getById);
roadmapRouter.patch('/:id', roadmapController.update);
roadmapRouter.patch('/:id/tasks/:taskId', roadmapController.updateTask);

