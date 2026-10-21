import { pgTable, uuid, varchar, integer, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const resumes = pgTable('resumes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileKey: varchar('file_key', { length: 500 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).default('application/pdf').notNull(),
  status: varchar('status', { length: 50 }).default('uploaded').notNull(),
  rawText: text('raw_text'),
  extractedData: jsonb('extracted_data'),
  errorMessage: text('error_message'),
  isConfirmed: boolean('is_confirmed').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

