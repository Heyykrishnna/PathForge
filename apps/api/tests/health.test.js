import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { HealthService } from '../src/modules/health/health.service.js';
import { HealthController } from '../src/modules/health/health.controller.js';
import { errorHandler } from '../src/middleware/error-handler.js';

function createTestApp(isDbConnected) {
  const app = express();
  app.use(express.json());

  const service = new HealthService(async () => isDbConnected);
  const controller = new HealthController(service);

  app.get('/api/v1/health', controller.getHealth);
  app.use(errorHandler);

  return app;
}

describe('GET /api/v1/health', () => {
  it('returns 200 and healthy status when database is connected', async () => {
    const app = createTestApp(true);
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.data.services.database).toBe('connected');
    expect(response.body.data).toHaveProperty('uptime');
    expect(response.body.data).toHaveProperty('timestamp');
    expect(response.body.meta).toHaveProperty('version');
    expect(response.body.meta).toHaveProperty('environment');

    expect(JSON.stringify(response.body)).not.toMatch(/postgres:\/\/|password|secret|SELECT/i);
  });

  it('returns 503 and degraded status when database is disconnected', async () => {
    const app = createTestApp(false);
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(503);
    expect(response.body.data.status).toBe('degraded');
    expect(response.body.data.services.database).toBe('disconnected');
    expect(JSON.stringify(response.body)).not.toMatch(/postgres:\/\/|password|secret|SELECT/i);
  });
});

