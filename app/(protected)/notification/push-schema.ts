import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { profiles } from '@/app/(protected)/profile/schema';

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.profile_id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  auth: text('auth').notNull(),
  p256dh: text('p256dh').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
