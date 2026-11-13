import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRateLimiter } from '../src/middleware/rate-limiter.js';
import { errorHandler } from '../src/middleware/error-handler.js';

describe('Rate Limiter Middleware', () => {
  it('allows requests within limit and blocks requests exceeding limit with 429', async () => {
    const app = express();
    app.use(express.json());

    const testLimiter = createRateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 3,
      message: 'Rate limit exceeded for test'
    });

    app.get('/test-limit', testLimiter, (req, res) => {
      res.json({ success: true });
    });
    app.use(errorHandler);

    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .get('/test-limit')
        .set('x-test-rate-limit', 'true');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }

    const blockedRes = await request(app)
      .get('/test-limit')
      .set('x-test-rate-limit', 'true');

    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error.code).toBe('RATE_LIMITED');
    expect(blockedRes.headers['retry-after']).toBeDefined();
  });
});

