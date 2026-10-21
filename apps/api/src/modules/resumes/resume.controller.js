import fs from 'fs';
import { HTTP_STATUS, createSuccessEnvelope } from '@pathforge/shared';
import { resumeService } from './resume.service.js';
import { ApiError } from '../../utils/api-error.js';

export class ResumeController {
  constructor(service = resumeService) {
    this.service = service;
  }

  upload = async (req, res, next) => {
    try {
      const result = await this.service.uploadResume({
        userId: req.user.id,
        file: req.file
      });
      return res.status(HTTP_STATUS.CREATED).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  list = async (req, res, next) => {
    try {
      const result = await this.service.listResumes(req.user.id);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const result = await this.service.getResume(req.user.id, req.params.id);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  analyze = async (req, res, next) => {
    try {
      const result = await this.service.analyzeResume(req.user.id, req.params.id);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  confirm = async (req, res, next) => {
    try {
      const result = await this.service.confirmResumeData(req.user.id, req.params.id, req.body);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  download = async (req, res, next) => {
    try {
      const resume = await this.service.getResume(req.user.id, req.params.id);
      if (!fs.existsSync(resume.fileKey)) {
        throw ApiError.notFound('Physical resume file not found on storage');
      }

      res.setHeader('Content-Type', resume.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${resume.fileName}"`);
      const stream = fs.createReadStream(resume.fileKey);
      return stream.pipe(res);
    } catch (error) {
      return next(error);
    }
  };
}

export const resumeController = new ResumeController();

