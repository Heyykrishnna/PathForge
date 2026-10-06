import { z } from 'zod';
import { ERROR_CODES } from '../constants/api.js';

export const apiErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string()
});

export const apiErrorSchema = z.object({
  code: z.nativeEnum(ERROR_CODES).or(z.string()),
  message: z.string(),
  details: z.array(apiErrorDetailSchema).default([])
});

export const apiErrorResponseSchema = z.object({
  error: apiErrorSchema
});

export const apiMetaSchema = z.record(z.unknown()).default({});

export function createSuccessEnvelope(data = {}, meta = {}) {
  return {
    data,
    meta
  };
}

export function createErrorEnvelope(code, message, details = []) {
  return {
    error: {
      code,
      message,
      details
    }
  };
}

