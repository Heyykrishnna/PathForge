import path from 'path';
import { fileURLToPath } from 'url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, closeDatabaseConnection } from './index.js';
import { logger } from '../utils/logger.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(currentDir, 'migrations');

export async function runMigrations() {
  logger.info({ migrationsFolder }, 'Running database migrations');
  try {
    await migrate(db, { migrationsFolder });
    logger.info('Database migrations applied successfully');
  } catch (error) {
    logger.error({ error: error.message }, 'Database migration failed');
    throw error;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(async () => {
      await closeDatabaseConnection();
      process.exit(0);
    })
    .catch(async () => {
      await closeDatabaseConnection();
      process.exit(1);
    });
}

