import { pgTable, uuid, varchar, text, boolean, real, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { internships } from './internships.js';
import { matchResults } from './matching.js';

export const bridgeProjects = pgTable('bridge_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  targetSkill: varchar('target_skill', { length: 100 }).notNull(),
  difficulty: varchar('difficulty', { length: 50 }).default('intermediate').notNull(),
  estimatedHours: real('estimated_hours').default(6.0).notNull(),
  suggestedStack: jsonb('suggested_stack').default([]).notNull(),
  deliverables: jsonb('deliverables').default([]).notNull(),
  completionCriteria: text('completion_criteria').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const roadmaps = pgTable('roadmaps', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  internshipId: uuid('internship_id').references(() => internships.id, { onDelete: 'cascade' }).notNull(),
  matchResultId: uuid('match_result_id').references(() => matchResults.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  targetRole: varchar('target_role', { length: 255 }).notNull(),
  targetCompany: varchar('target_company', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  progressPercentage: real('progress_percentage').default(0).notNull(),
  generationInputs: jsonb('generation_inputs').notNull(),
  version: varchar('version', { length: 50 }).default('v1.0.0').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const roadmapTasks = pgTable('roadmap_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  roadmapId: uuid('roadmap_id').references(() => roadmaps.id, { onDelete: 'cascade' }).notNull(),
  dayNumber: integer('day_number').notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  estimatedHours: real('estimated_hours').default(2.0).notNull(),
  expectedOutput: text('expected_output').notNull(),
  skillGap: varchar('skill_gap', { length: 100 }),
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  userNotes: text('user_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

