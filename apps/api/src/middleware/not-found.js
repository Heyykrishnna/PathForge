import { ApiError } from '../utils/api-error.js';

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Resource not found: ${req.method} ${req.originalUrl}`));
}

