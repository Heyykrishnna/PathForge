import { pgTable, uuid, varchar, text, real, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const candidateEvidence = pgTable('candidate_evidence', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  skillName: varchar('skill_name', { length: 100 }).notNull(),
  sourceType: varchar('source_type', { length: 50 }).notNull(),
  sourceId: varchar('source_id', { length: 255 }),
  confidenceScore: real('confidence_score').default(0.8).notNull(),
  evidenceContext: text('evidence_context'),
  isConfirmedByUser: boolean('is_confirmed_by_user').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

