import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { internships } from './internships.js';

export const applications = pgTable('applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  internshipId: uuid('internship_id').references(() => internships.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 50 }).default('saved').notNull(),
  appliedAt: timestamp('applied_at', { withTimezone: true }),
  deadline: timestamp('deadline', { withTimezone: true }),
  notes: text('notes'),
  nextAction: text('next_action'),
  nextActionDeadline: timestamp('next_action_deadline', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const applicationEvents = pgTable('application_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'cascade' }).notNull(),
  eventType: varchar('event_type', { length: 50 }).default('status_change').notNull(),
  fromStatus: varchar('from_status', { length: 50 }),
  toStatus: varchar('to_status', { length: 50 }),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

