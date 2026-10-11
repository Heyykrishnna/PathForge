import { HTTP_STATUS, createSuccessEnvelope } from '@pathforge/shared';
import { healthService } from './health.service.js';

export class HealthController {
  constructor(service = healthService) {
    this.service = service;
  }

  getHealth = async (req, res, next) => {
    try {
      const result = await this.service.getHealthStatus();
      const statusCode = result.isHealthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;
      return res.status(statusCode).json(createSuccessEnvelope(result.data, result.meta));
    } catch (error) {
      return next(error);
    }
  };
}

export const healthController = new HealthController();

