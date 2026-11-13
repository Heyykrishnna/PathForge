import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pg from 'pg';
import { env } from '../src/config/env.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(currentDir, '../src/db/migrations');

describe('Database Migrations against Clean Schema', () => {
  let client;
  const testSchema = `clean_migration_test_${Date.now()}`;

  beforeAll(async () => {
    client = new pg.Client({ connectionString: env.DATABASE_URL });
    await client.connect();
    await client.query(`CREATE SCHEMA "${testSchema}"`);
    await client.query(`SET search_path TO "${testSchema}", public`);
  });

  afterAll(async () => {
    if (client) {
      await client.query(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE`);
      await client.end();
    }
  });

  it('successfully applies all migration SQL files in sequence to a clean schema', async () => {
    const files = fs
      .readdirSync(migrationsFolder)
      .filter(f => f.endsWith('.sql'))
      .sort();

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const sqlContent = fs.readFileSync(path.join(migrationsFolder, file), 'utf-8');
      await client.query(sqlContent);
    }

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1
    `, [testSchema]);

    const tableNames = res.rows.map(r => r.table_name);

    const requiredTables = [
      'users',
      'profiles',
      'educations',
      'skills',
      'user_skills',
      'resumes',
      'candidate_evidence',
      'internships',
      'internship_skills',
      'saved_internships',
      'matching_config_versions',
      'match_results',
      'match_evidence',
      'skill_gaps',
      'bridge_projects',
      'roadmaps',
      'roadmap_tasks',
      'applications',
      'application_events',
      'activity_logs'
    ];

    for (const table of requiredTables) {
      expect(tableNames).toContain(table);
    }
  });
});

