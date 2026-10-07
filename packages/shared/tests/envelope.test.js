import { describe, it, expect } from 'vitest';
import { createSuccessEnvelope, createErrorEnvelope, healthResponseSchema } from '../src/index.js';

describe('API Envelopes', () => {
  it('creates success envelope with default values', () => {
    const envelope = createSuccessEnvelope({ message: 'ok' }, { page: 1 });
    expect(envelope).toEqual({
      data: { message: 'ok' },
      meta: { page: 1 }
    });
  });

  it('creates error envelope matching conventions', () => {
    const envelope = createErrorEnvelope('VALIDATION_ERROR', 'Invalid data', [
      { field: 'email', message: 'Required' }
    ]);
    expect(envelope).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid data',
        details: [{ field: 'email', message: 'Required' }]
      }
    });
  });

  it('validates health response schema', () => {
    const payload = {
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 10.5,
        services: {
          database: 'connected'
        }
      },
      meta: {
        version: '1.0.0',
        environment: 'test'
      }
    };
    const parsed = healthResponseSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });
});

