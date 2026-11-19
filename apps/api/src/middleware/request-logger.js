import pinoHttp from 'pino-http';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const requestLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  autoLogging: {
    ignore: (req) => {
      const path = req.url.split('?')[0];
      return (
        path === `${env.API_PREFIX}/health` ||
        path === `${env.API_PREFIX}/github/callback`
      );
    }
  }
});
