  // app/(features)/(protected)/worker/schedule/schema.ts
  import {
    pgTable,
    uuid,
    bigint,
    timestamp,
    text,
    pgEnum,
  } from 'drizzle-orm/pg-core';
  import { profiles } from '@/app/(features)/(protected)/profile/schema';
  import { posts } from '@/app/(features)/(public)/post/schema';

  export const member_schedule_status_enum = pgEnum('member_schedule_status', ['pending', 'accepted', 'rejected']);

  export const member_schedules = pgTable('member_schedules', {
    member_schedule_id: uuid('member_schedule_id').primaryKey().defaultRandom(),
    post_id: bigint('post_id', { mode: 'number' })
      .notNull()
      .references(() => posts.post_id, { onDelete: 'cascade' }),
    member_id: uuid('member_id')
      .notNull()
      .references(() => profiles.profile_id, { onDelete: 'cascade' }),
    status: member_schedule_status_enum('status').notNull().default('pending'),
    message: text('message'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  });
