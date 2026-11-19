import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from '../src/app.js';
import { healthService } from '../src/modules/health/health.service.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '../../..');

describe('Production Smoke Test Script', () => {
  let server;
  let port;
  let originalDbCheck;

  beforeAll(async () => {
    originalDbCheck = healthService.dbCheckFn;
    const isDbConnected = await originalDbCheck().catch(() => false);
    if (!isDbConnected) {
      healthService.dbCheckFn = async () => true;
    }

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (originalDbCheck) {
      healthService.dbCheckFn = originalDbCheck;
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('runs production-smoke-test.js against running server and passes all checks', async () => {
    const smokeScript = path.join(rootDir, 'scripts/production-smoke-test.js');

    const result = await new Promise((resolve, reject) => {
      exec(
        `node "${smokeScript}"`,
        {
          env: {
            ...process.env,
            API_URL: `http://127.0.0.1:${port}/api/v1`
          }
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Script failed: ${stderr || stdout || error.message}`));
          } else {
            resolve(stdout);
          }
        }
      );
    });

    expect(result).toContain('Smoke Test Summary: 5 passed, 0 failed');
  });
});

