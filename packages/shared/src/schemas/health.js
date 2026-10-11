import { z } from 'zod';
import { SERVICE_STATUS, DATABASE_STATUS } from '../constants/api.js';

export const healthServiceStatusSchema = z.object({
  database: z.enum([DATABASE_STATUS.CONNECTED, DATABASE_STATUS.DISCONNECTED])
});

export const healthDataSchema = z.object({
  status: z.enum([SERVICE_STATUS.HEALTHY, SERVICE_STATUS.DEGRADED, SERVICE_STATUS.UNHEALTHY]),
  timestamp: z.string(),
  uptime: z.number(),
  services: healthServiceStatusSchema
});

export const healthMetaSchema = z.object({
  version: z.string(),
  environment: z.string()
});

export const healthResponseSchema = z.object({
  data: healthDataSchema,
  meta: healthMetaSchema
});

