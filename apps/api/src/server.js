import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { closeDatabaseConnection } from './db/index.js';

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, environment: env.NODE_ENV, prefix: env.API_PREFIX }, 'API server started');
});

async function handleShutdown(signal) {
  logger.info({ signal }, 'Graceful shutdown initiated');

  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await closeDatabaseConnection();
      logger.info('Database pool drained');
      process.exit(0);
    } catch (error) {
      logger.error({ error: error.message }, 'Error closing database pool');
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Forceful shutdown triggered after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

