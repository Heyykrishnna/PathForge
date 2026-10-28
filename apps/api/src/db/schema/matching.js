import { pgTable, uuid, varchar, text, boolean, real, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { internships } from './internships.js';
import { candidateEvidence } from './candidate-evidence.js';

export const matchingConfigVersions = pgTable('matching_config_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  version: varchar('version', { length: 50 }).notNull().unique(),
  weights: jsonb('weights').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const matchResults = pgTable('match_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  internshipId: uuid('internship_id').references(() => internships.id, { onDelete: 'cascade' }).notNull(),
  engineVersion: varchar('engine_version', { length: 50 }).default('v1.0.0').notNull(),
  weightsConfig: jsonb('weights_config').notNull(),
  overallScore: real('overall_score').notNull(),
  deterministicScore: real('deterministic_score').notNull(),
  semanticScore: real('semantic_score').notNull(),
  eligibilityStatus: varchar('eligibility_status', { length: 50 }).default('eligible').notNull(),
  eligibilityWarnings: jsonb('eligibility_warnings').default([]).notNull(),
  scoreBreakdown: jsonb('score_breakdown').notNull(),
  summaryExplanation: text('summary_explanation').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const matchEvidence = pgTable('match_evidence', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchResultId: uuid('match_result_id').references(() => matchResults.id, { onDelete: 'cascade' }).notNull(),
  skillName: varchar('skill_name', { length: 100 }).notNull(),
  matchStatus: varchar('match_status', { length: 50 }).notNull(),
  isRequired: boolean('is_required').notNull(),
  evidenceId: uuid('evidence_id').references(() => candidateEvidence.id, { onDelete: 'set null' }),
  evidenceSnippet: text('evidence_snippet'),
  confidenceScore: real('confidence_score').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const skillGaps = pgTable('skill_gaps', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchResultId: uuid('match_result_id').references(() => matchResults.id, { onDelete: 'cascade' }).notNull(),
  skillName: varchar('skill_name', { length: 100 }).notNull(),
  importance: varchar('importance', { length: 50 }).default('critical').notNull(),
  recommendedAction: text('recommended_action').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

