import { describe, it, expect } from 'vitest';
import { validateEnv } from '../src/config/env.js';

describe('Environment Validation', () => {
  it('validates a valid environment configuration', () => {
    const validConfig = {
      NODE_ENV: 'test',
      PORT: '5000',
      API_PREFIX: '/api/v1',
      CORS_ORIGIN: 'http://localhost:3000',
      DATABASE_URL:
        'postgres://postgres:postgres@localhost:5432/pathforge_test',
      LOG_LEVEL: 'warn'
    };

    const parsed = validateEnv(validConfig);
    expect(parsed.PORT).toBe(5000);
    expect(parsed.NODE_ENV).toBe('test');
    expect(parsed.DATABASE_URL).toBe(
      'postgres://postgres:postgres@localhost:5432/pathforge_test'
    );
  });

  it('fails fast when DATABASE_URL is missing', () => {
    const invalidConfig = {
      NODE_ENV: 'test',
      PORT: '5000',
      DATABASE_URL: ''
    };

    expect(() => validateEnv(invalidConfig)).toThrow(
      /DATABASE_URL is required/
    );
  });

  it('fails fast when PORT is not a valid number', () => {
    const invalidConfig = {
      PORT: 'not-a-number'
    };

    expect(() => validateEnv(invalidConfig)).toThrow(/PORT/);
  });

  it('parses SMTP_SECURE=false as false', () => {
    expect(validateEnv({ SMTP_SECURE: 'false' }).SMTP_SECURE).toBe(false);
  });

  it('rejects invalid SMTP secure flags', () => {
    expect(() => validateEnv({ SMTP_SECURE: 'invalid' })).toThrow(
      /SMTP_SECURE/
    );
  });
});
