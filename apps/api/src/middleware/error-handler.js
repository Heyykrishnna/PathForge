import { HTTP_STATUS, ERROR_CODES, createErrorEnvelope } from '@pathforge/shared';
import { ApiError } from '../utils/api-error.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(
      createErrorEnvelope(err.code, err.message, err.details)
    );
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      createErrorEnvelope(ERROR_CODES.BAD_REQUEST, 'Invalid JSON payload received in request body', [])
    );
  }

  logger.error(
    {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    },
    'Unhandled server exception'
  );

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
    createErrorEnvelope(ERROR_CODES.INTERNAL_ERROR, 'An internal server error occurred', [])
  );
}

