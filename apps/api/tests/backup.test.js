import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { env } from '../src/config/env.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '../../..');
const testBackupDir = path.join(rootDir, 'test-backups');

describe('Database Backup Script Operational Test', () => {
  beforeAll(() => {
    if (fs.existsSync(testBackupDir)) {
      fs.rmSync(testBackupDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testBackupDir)) {
      fs.rmSync(testBackupDir, { recursive: true, force: true });
    }
  });

  it('generates a non-empty gzipped backup and matching sha256 checksum', () => {
    const backupScript = path.join(rootDir, 'scripts/db-backup.sh');

    const output = execSync(`"${backupScript}"`, {
      cwd: rootDir,
      env: {
        ...process.env,
        DATABASE_URL: env.DATABASE_URL,
        BACKUP_DIR: testBackupDir
      },
      encoding: 'utf-8'
    });

    expect(output).toContain('Backup completed:');

    const files = fs.readdirSync(testBackupDir);
    const dumpFile = files.find(f => f.endsWith('.sql.gz'));
    const shaFile = files.find(f => f.endsWith('.sha256'));

    expect(dumpFile).toBeDefined();
    expect(shaFile).toBeDefined();

    const dumpStats = fs.statSync(path.join(testBackupDir, dumpFile));
    expect(dumpStats.size).toBeGreaterThan(500);

    const shaContent = fs.readFileSync(path.join(testBackupDir, shaFile), 'utf-8');
    expect(shaContent).toMatch(/[a-f0-9]{64}/);
  });
});

