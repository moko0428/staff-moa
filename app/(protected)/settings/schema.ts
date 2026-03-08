import {
  pgTable,
  uuid,
  timestamp,
  text,
  integer,
} from 'drizzle-orm/pg-core';
import { profiles } from '@/app/(protected)/profile/schema';

export const app_reviews = pgTable('app_reviews', {
  review_id: uuid('review_id').primaryKey().defaultRandom(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => profiles.profile_id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
