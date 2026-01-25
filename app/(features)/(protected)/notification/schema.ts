import {
  pgTable,
  uuid,
  timestamp,
  text,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { profiles } from '@/app/(features)/(protected)/profile/schema';

export const notification_type_enum = pgEnum('notification_type', [
  'application_accepted',
  'application_rejected',
  'new_application',
  'schedule_reminder',
  'system',
]);

export const notifications = pgTable('notifications', {
  notification_id: uuid('notification_id').primaryKey().defaultRandom(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => profiles.profile_id, { onDelete: 'cascade' }),
  type: notification_type_enum('type').notNull().default('system'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  is_read: boolean('is_read').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
