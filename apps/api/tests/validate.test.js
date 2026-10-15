import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { z } from 'zod';
import { validateRequest } from '../src/middleware/validate.js';
import { errorHandler } from '../src/middleware/error-handler.js';

describe('Validation Middleware', () => {
  it('passes valid request data and exposes parsed values', async () => {
    const app = express();
    app.use(express.json());

    const bodySchema = z.object({
      email: z.string().email(),
      age: z.number().min(18)
    });

    app.post('/test', validateRequest({ body: bodySchema }), (req, res) => {
      res.json({ received: req.body });
    });
    app.use(errorHandler);

    const response = await request(app)
      .post('/test')
      .send({ email: 'student@example.com', age: 21 });

    expect(response.status).toBe(200);
    expect(response.body.received).toEqual({ email: 'student@example.com', age: 21 });
  });

  it('rejects invalid request data with standardized validation error envelope', async () => {
    const app = express();
    app.use(express.json());

    const bodySchema = z.object({
      email: z.string().email()
    });

    app.post('/test', validateRequest({ body: bodySchema }), (req, res) => {
      res.json({ received: req.body });
    });
    app.use(errorHandler);

    const response = await request(app)
      .post('/test')
      .send({ email: 'invalid-email' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.length).toBeGreaterThan(0);
    expect(response.body.error.details[0].field).toBe('email');
  });
});

