// db/schema.ts
import {
  pgTable,      
  uuid,         
  text,         
  timestamp,    
  date,         
  numeric,      
  integer,      
  boolean,      
  pgEnum,       
  jsonb,
  pgSchema,        
} from 'drizzle-orm/pg-core';

import { relations, sql } from 'drizzle-orm'; 


export const pay_type_enum = pgEnum('pay_type', ['hourly', 'daily', 'weekly', 'monthly']);
export const post_status_enum = pgEnum('post_status', ['recruiting', 'completed', 'urgent']);
export const gender_enum = pgEnum('gender', ['남성', '여성', '미정']); 
export const user_role_enum = pgEnum('user_role', ['member', 'manager', 'pending_manager', 'rejected_manager', 'admin']);
export const company_verify_status_enum = pgEnum('company_verify_status', ['pending', 'approved', 'rejected']);
export const report_status_enum = pgEnum('report_status', ['pending', 'reviewed', 'resolved_ban', 'resolved_no_action']);

 const users = pgSchema('auth').table('users', { 
  id: uuid('id').primaryKey(),
});


export const profiles = pgTable('profiles', {
  profile_id: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }), 

  avatar:text('avatar'),
  cover_image:text('cover_image'),
  recent_photos:jsonb('recent_photos').default(sql`'[]'::jsonb`).$type<Array<{
    url: string;
    uploaded_at: string;
    caption?: string;
  }>>(),

  name:text('name'),
  email:text('email'), // auth.users.email에서 가져오므로 optional 

  role:user_role_enum('role').notNull().default('member'),
  kakao_id:text('kakao_id'),
  phone:text('phone'),
  mbti:text('mbti'),

  gender:gender_enum('gender').default('미정'), 
  birth_date: date('birth_date'), 

  height:numeric('height'), 
  weight:numeric('weight', { precision: 5, scale: 2 }), 
  
  personality:text('personality'),
  features:text('features'),
  experiences:jsonb('experiences'),
  bio:text('bio'),
  documents:jsonb('documents'),
  company_name:text('company_name'), 
  business_number:text('business_number'), 
  company_certificate:text('company_certificate'), 
  company_verify_status:company_verify_status_enum('company_verify_status'), 

  is_banned:boolean('is_banned').notNull().default(false),
  banned_at:timestamp('banned_at',{withTimezone:true}),
  banned_until: timestamp('banned_until', { withTimezone: true }),
  banned_reason: text('banned_reason'),
  banned_by_admin_id: uuid('banned_by_admin_id').references(() => users.id, { onDelete: 'set null' }), 
  last_ban_update_at: timestamp('last_ban_update_at', { withTimezone: true }),
  stats:jsonb('stats').$type<{
    followers:number;
    following:number;
  }>(),
  views:jsonb(),
  attendance_score:integer('attendance_score').notNull().default(0),
  trust_activity_score:integer('trust_activity_score').notNull().default(0),
  favorites:jsonb('favorites'),
  profile_visibility:jsonb('profile_visibility').default(sql`'{"email":true,"phone":true,"kakaoId":true,"age":true,"gender":true,"experiences":true,"documents":true,"certificates":true,"languages":true}'::jsonb`).$type<{
    email?: boolean;
    phone?: boolean;
    kakaoId?: boolean;
    age?: boolean;
    gender?: boolean;
    experiences?: boolean;
    documents?: boolean;
    certificates?: boolean;
    languages?: boolean;
  }>(),
  created_at:timestamp('created_at').defaultNow().notNull(),
  updated_at:timestamp('updated_at').defaultNow().notNull(),
});

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  reporter_id: uuid('reporter_id')
    .notNull()
    .references(() => profiles.profile_id),
  
  reported_user_id: uuid('reported_user_id')
    .notNull()
    .references(() => profiles.profile_id),
  reason: text('reason').notNull(),
  status: report_status_enum('status').default('pending').notNull(),
  resolved_by_admin_id: uuid('resolved_by_admin_id')
    .references(() => profiles.profile_id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  resolved_at: timestamp('resolved_at'),
});

export const auth_user_relations = relations(users, ({ one }) => ({
  profile: one(profiles, { 
    fields: [users.id],
    references: [profiles.profile_id], 
  }),
}));

export const profile_relations = relations(profiles, ({ one }) => ({ 
  user: one(users, {
    fields: [profiles.profile_id], 
    references: [users.id],
  }),
  // jobPostings: many(jobPostings), 
}));

export const followers = pgTable('followers', {
  follower_id: uuid().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  following_id: uuid().references(() => profiles.profile_id, { onDelete: 'cascade' }),
  created_at:timestamp('created_at').defaultNow().notNull(),
});