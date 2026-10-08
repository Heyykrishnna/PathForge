import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { env } from '../config/env.js';
import * as schema from './schema/index.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL
});

pool.on('error', (error) => {
  logger.error({ error: error.message }, 'Unexpected PostgreSQL client error');
});

export const db = drizzle(pool, { schema });

export async function checkDatabaseConnection() {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    logger.warn({ error: error.message }, 'Database health check failed');
    return false;
  }
}

export async function closeDatabaseConnection() {
  await pool.end();
}

