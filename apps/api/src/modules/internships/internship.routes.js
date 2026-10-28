import { Router } from 'express';
import { internshipController } from './internship.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate.js';

export const internshipRouter = Router();

internshipRouter.get('/', optionalAuthenticate, internshipController.list);
internshipRouter.get('/saved', authenticate, internshipController.listSaved);
internshipRouter.get('/:id', optionalAuthenticate, internshipController.getById);
internshipRouter.post('/:id/save', authenticate, internshipController.save);
internshipRouter.delete('/:id/save', authenticate, internshipController.unsave);
internshipRouter.post('/', authenticate, internshipController.create);

