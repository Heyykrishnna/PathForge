import { HTTP_STATUS, createSuccessEnvelope } from '@pathforge/shared';
import { profileService } from './profile.service.js';

export class ProfileController {
  constructor(service = profileService) {
    this.service = service;
  }

  getProfile = async (req, res, next) => {
    try {
      const result = await this.service.getProfile(req.user.id);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  updateProfile = async (req, res, next) => {
    try {
      const result = await this.service.updateProfile(req.user.id, req.body);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  addEducation = async (req, res, next) => {
    try {
      const result = await this.service.addEducation(req.user.id, req.body);
      return res.status(HTTP_STATUS.CREATED).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  updateEducation = async (req, res, next) => {
    try {
      const result = await this.service.updateEducation(req.user.id, req.params.id, req.body);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  deleteEducation = async (req, res, next) => {
    try {
      await this.service.deleteEducation(req.user.id, req.params.id);
      return res.status(HTTP_STATUS.OK).json(
        createSuccessEnvelope({ message: 'Education entry deleted successfully' })
      );
    } catch (error) {
      return next(error);
    }
  };

  syncSkills = async (req, res, next) => {
    try {
      const result = await this.service.syncSkills(req.user.id, req.body.skills);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };
}

export const profileController = new ProfileController();

