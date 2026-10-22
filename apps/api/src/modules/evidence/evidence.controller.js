import { HTTP_STATUS, createSuccessEnvelope } from '@pathforge/shared';
import { evidenceService } from './evidence.service.js';

export class EvidenceController {
  constructor(service = evidenceService) {
    this.service = service;
  }

  list = async (req, res, next) => {
    try {
      const result = await this.service.listEvidence(req.user.id);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  confirm = async (req, res, next) => {
    try {
      const result = await this.service.confirmEvidence(req.user.id, req.params.id, req.body);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const result = await this.service.deleteEvidence(req.user.id, req.params.id);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };
}

export const evidenceController = new EvidenceController();

