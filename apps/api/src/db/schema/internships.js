import { pgTable, uuid, varchar, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { skills } from './skills.js';

export const internships = pgTable('internships', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }).notNull(),
  location: varchar('location', { length: 150 }).notNull(),
  workMode: varchar('work_mode', { length: 50 }).default('hybrid').notNull(),
  description: text('description').notNull(),
  sourceUrl: varchar('source_url', { length: 500 }),
  sourceName: varchar('source_name', { length: 100 }).default('Curated / Direct').notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }).defaultNow().notNull(),
  minGpa: varchar('min_gpa', { length: 10 }),
  eligibleGraduationYears: jsonb('eligible_graduation_years').default([]).notNull(),
  requiresWorkAuth: boolean('requires_work_auth').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const internshipSkills = pgTable('internship_skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  internshipId: uuid('internship_id').references(() => internships.id, { onDelete: 'cascade' }).notNull(),
  skillId: uuid('skill_id').references(() => skills.id, { onDelete: 'cascade' }).notNull(),
  isRequired: boolean('is_required').default(true).notNull(),
  importance: integer('importance').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const savedInternships = pgTable('saved_internships', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  internshipId: uuid('internship_id').references(() => internships.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

