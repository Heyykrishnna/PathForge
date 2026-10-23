import { pgTable, uuid, varchar, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const githubAccounts = pgTable('github_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  githubUserId: varchar('github_user_id', { length: 100 }),
  username: varchar('username', { length: 100 }).notNull(),
  profileUrl: varchar('profile_url', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 255 }),
  encryptedAccessToken: text('encrypted_access_token').notNull(),
  scope: varchar('scope', { length: 255 }),
  syncStatus: varchar('sync_status', { length: 50 }).default('idle').notNull(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const repositories = pgTable('repositories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  githubAccountId: uuid('github_account_id').references(() => githubAccounts.id, { onDelete: 'cascade' }).notNull(),
  githubRepoId: varchar('github_repo_id', { length: 100 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  description: text('description'),
  isPrivate: boolean('is_private').default(false).notNull(),
  primaryLanguage: varchar('primary_language', { length: 100 }),
  languages: jsonb('languages').default([]).notNull(),
  stargazersCount: integer('stargazers_count').default(0).notNull(),
  forksCount: integer('forks_count').default(0).notNull(),
  defaultBranch: varchar('default_branch', { length: 100 }).default('main').notNull(),
  pushedAt: timestamp('pushed_at', { withTimezone: true }),
  readmeSnippet: text('readme_snippet'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const githubOauthStates = pgTable('github_oauth_states', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  state: varchar('state', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

