import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const educations = pgTable('educations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  institution: varchar('institution', { length: 200 }).notNull(),
  degree: varchar('degree', { length: 150 }).notNull(),
  fieldOfStudy: varchar('field_of_study', { length: 150 }).notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  isCurrent: boolean('is_current').default(false).notNull(),
  gpa: varchar('gpa', { length: 10 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

