  // app/(protected)/worker/schedule/schema.ts
  import {
    pgTable,
    uuid,
    bigint,
    timestamp,
    text,
    pgEnum,
    date,
    time,
    integer,
  } from 'drizzle-orm/pg-core';
  import { profiles } from '@/app/(protected)/profile/schema';
  import { posts } from '@/app/(public)/post/schema';

  export const member_schedule_status_enum = pgEnum('member_schedule_status', ['pending', 'accepted', 'rejected']);
  export const pay_type_enum = pgEnum('pay_type', ['hourly', 'daily', 'weekly', 'monthly']);

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

  export const personal_schedules = pgTable('personal_schedules', {
    personal_schedule_id: uuid('personal_schedule_id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.profile_id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    date: date('date').notNull(),
    start_time: time('start_time').notNull(),
    end_time: time('end_time').notNull(),
    location: text('location'),
    pay_type: pay_type_enum('pay_type').default('daily'),
    pay_amount: integer('pay_amount'),
    description: text('description'),
    manager_name: text('manager_name'),
    manager_contact_type: text('manager_contact_type').default('phone'),
    manager_phone: text('manager_phone'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  });
