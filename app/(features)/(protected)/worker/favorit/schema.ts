// app/(features)/(protected)/worker/favorit/schema.ts
import {
  pgTable,
  uuid, 
  bigint,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { profiles } from '@/app/(features)/(protected)/profile/schema'; // profiles의 정식 스키마를 임포트
import { posts } from '@/app/(features)/(public)/post/schema';

export const favorites_posts = pgTable('favorites_posts',{
  user_id: uuid('user_id')
    .notNull()
    .references(() => profiles.profile_id, { onDelete: 'cascade' }), // profile_id는 실제로 user_id 컬럼을 가리킴
  post_id: bigint('post_id', { mode: 'number' })
    .notNull()
    .references(() => posts.post_id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.post_id] }),
}));