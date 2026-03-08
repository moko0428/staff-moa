// app/(protected)/manager/worker/schema.ts
import {
  pgTable,
  uuid,
  boolean,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { profiles } from '@/app/(protected)/profile/schema';

// 매니저-워커 관리 테이블
export const manager_worker_management = pgTable('manager_worker_management', {
  id: uuid('id').primaryKey().defaultRandom(),
  manager_id: uuid('manager_id')
    .notNull()
    .references(() => profiles.profile_id, { onDelete: 'cascade' }),
  worker_id: uuid('worker_id')
    .notNull()
    .references(() => profiles.profile_id, { onDelete: 'cascade' }),
  is_favorite: boolean('is_favorite').default(false).notNull(),
  is_blacklisted: boolean('is_blacklisted').default(false).notNull(),
  rating: integer('rating'), // 1-5 점수
  notes: text('notes'), // 매니저 메모
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
