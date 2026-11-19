import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('API environment file loading', () => {
  let fixture;
  let modulePath;

  beforeEach(() => {
    fixture = mkdtempSync(path.join(tmpdir(), 'pathforge-env-'));
    modulePath = path.join(fixture, 'apps/api/src/config/env.js');
    mkdirSync(path.dirname(modulePath), { recursive: true });
    writeFileSync(
      path.join(fixture, 'package.json'),
      JSON.stringify({ type: 'module' })
    );
    writeFileSync(
      path.join(fixture, '.env'),
      'SMTP_HOST=smtp.example.invalid\nSMTP_PORT=587\nSMTP_SECURE=false\n'
    );
    copyFileSync(new URL('../src/config/env.js', import.meta.url), modulePath);
    symlinkSync(
      fileURLToPath(new URL('../node_modules', import.meta.url)),
      path.join(fixture, 'node_modules'),
      'dir'
    );
  });

  afterEach(() => {
    rmSync(fixture, { recursive: true, force: true });
  });

  function loadSettings(overrides = {}) {
    const script = `import { env } from ${JSON.stringify(pathToFileURL(modulePath).href)}; console.log(JSON.stringify({host:env.SMTP_HOST,port:env.SMTP_PORT,secure:env.SMTP_SECURE}));`;
    return JSON.parse(
      execFileSync(process.execPath, ['--input-type=module', '-e', script], {
        cwd: tmpdir(),
        env: { NODE_ENV: 'test', ...overrides },
        encoding: 'utf8'
      }).trim()
    );
  }

  it('loads the root environment when launched outside the repository root', () => {
    expect(loadSettings()).toEqual({
      host: 'smtp.example.invalid',
      port: 587,
      secure: false
    });
  });

  it('allows the API environment file to override root defaults', () => {
    writeFileSync(
      path.join(fixture, 'apps/api/.env'),
      'SMTP_PORT=465\nSMTP_SECURE=true\n'
    );
    expect(loadSettings()).toEqual({
      host: 'smtp.example.invalid',
      port: 465,
      secure: true
    });
  });

  it('preserves explicitly supplied process environment variables', () => {
    expect(loadSettings({ SMTP_HOST: 'process.example.invalid' }).host).toBe(
      'process.example.invalid'
    );
  });
});
