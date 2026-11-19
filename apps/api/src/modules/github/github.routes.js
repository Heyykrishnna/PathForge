import { Router } from 'express';
import { githubController } from './github.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export const githubRouter = Router();

githubRouter.get('/callback', githubController.redirectCallback);
githubRouter.use(authenticate);

githubRouter.get('/connect', githubController.connect);
githubRouter.get('/callback', githubController.callback);
githubRouter.post('/callback', githubController.callback);
githubRouter.post('/sync', githubController.sync);
githubRouter.get('/account', githubController.getAccount);
githubRouter.delete('/connection', githubController.disconnect);
