import { Router } from 'express';
import { profileController } from './profile.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate.js';
import { updateProfileSchema, educationSchema, syncSkillsSchema } from '@pathforge/shared';

export const profileRouter = Router();

profileRouter.use(authenticate);

profileRouter.get('/', profileController.getProfile);
profileRouter.patch('/', validateRequest({ body: updateProfileSchema }), profileController.updateProfile);

profileRouter.post('/educations', validateRequest({ body: educationSchema }), profileController.addEducation);
profileRouter.patch('/educations/:id', profileController.updateEducation);
profileRouter.delete('/educations/:id', profileController.deleteEducation);

profileRouter.post('/skills', validateRequest({ body: syncSkillsSchema }), profileController.syncSkills);

