import { checkDatabaseConnection } from '../../db/index.js';
import { env } from '../../config/env.js';
import { SERVICE_STATUS, DATABASE_STATUS } from '@pathforge/shared';

export class HealthService {
  constructor(dbCheckFn = checkDatabaseConnection) {
    this.dbCheckFn = dbCheckFn;
    this.version = '1.0.0';
  }

  async getHealthStatus() {
    const isDbConnected = await this.dbCheckFn();
    const isHealthy = isDbConnected;

    const data = {
      status: isHealthy ? SERVICE_STATUS.HEALTHY : SERVICE_STATUS.DEGRADED,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime() * 100) / 100,
      services: {
        database: isDbConnected ? DATABASE_STATUS.CONNECTED : DATABASE_STATUS.DISCONNECTED
      }
    };

    const meta = {
      version: this.version,
      environment: env.NODE_ENV
    };

    return {
      isHealthy,
      data,
      meta
    };
  }
}

export const healthService = new HealthService();

