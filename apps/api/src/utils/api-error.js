import { HTTP_STATUS, ERROR_CODES } from '@pathforge/shared';

export class ApiError extends Error {
  constructor(statusCode, code, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Bad request', details = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST, message, details);
  }

  static validation(message = 'The request could not be validated.', details = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, message);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT, message);
  }

  static internal(message = 'An internal server error occurred') {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR, message);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new ApiError(HTTP_STATUS.SERVICE_UNAVAILABLE, ERROR_CODES.SERVICE_UNAVAILABLE, message);
  }
}

