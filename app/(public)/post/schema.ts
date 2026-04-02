import {
  pgTable,      
  uuid,         
  text,         
  timestamp,    
  date,         
  time,         
  numeric,      
  integer,      
  boolean,      
  pgEnum,       
  jsonb,
  bigint,
  pgSchema,        
} from 'drizzle-orm/pg-core';

import { relations } from 'drizzle-orm'; 


export const pay_type_enum = pgEnum('pay_type', ['hourly', 'daily', 'weekly', 'monthly']);

export const post_status_enum = pgEnum('post_status', ['recruiting', 'completed', 'urgent']);



// profiles 테이블 참조 (외래키용)
const profiles = pgTable('profiles', {
  user_id: uuid('user_id').primaryKey(),
});


export const posts = pgTable('posts', {
  post_id: bigint({mode:'number'}).primaryKey().generatedAlwaysAsIdentity(), 

  title: text('title').notNull(),                                
  description: text('description').notNull(),

  work_date: date('work_date').notNull(),                         
  work_time_start: time('work_time_start', { withTimezone: false }).notNull(),
  work_time_end: time('work_time_end', { withTimezone: false }).notNull(),   

  location: text('location').notNull(),

  pay_amount: numeric('pay_amount').notNull(),                   
  pay_type: pay_type_enum('pay_type').notNull().default('hourly'), 

  recruit_count: integer('recruit_count').notNull(),
  recruit_male: integer('recruit_male'),
  recruit_female: integer('recruit_female'),

  manager_name: text('manager_name').notNull(),
  manager_contact_type: text('manager_contact_type').notNull().default('phone'),
  manager_phone: text('manager_phone').notNull(),                  

  equipments: text('equipments'),                              
  qualifications: text('qualifications'),                         
  preferences: text('preferences'),                               
  notes: text('notes'),                                           
  external_link: text('external_link'),                           

  keywords: text('keywords').array().default([]), 

  author_id: uuid('author_id')
    .notNull()
    .references(() => profiles.user_id,{onDelete:'cascade'}), 

  status: post_status_enum('status').notNull().default('recruiting'), 

  form_type: text('form_type').default('basic'),                  

  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),

  tax_withholding: boolean('tax_withholding').notNull().default(false), 

  work_slots: jsonb('work_slots').notNull().default([]).$type<Array<{
    date: string;
    location?: string;
    pay_type?: string;
    pay_amount: number;
    tax_withholding?: boolean;
    meal_included?: boolean;
    meal_amount?: number;
    // New: parts array
    parts?: Array<{
      label: 'A' | 'B' | 'C';
      name: string;
      start: string;
      end: string;
      recruit_count: number;
    }>;
    // Legacy backward compat
    start_time?: string;
    end_time?: string;
    start?: string;
    end?: string;
  }>>(),

  event_positions: text('event_positions').array().notNull().default([]),

  manual_staff: jsonb('manual_staff').notNull().default([]).$type<Array<{
    id: string;
    name: string;
    phone: string | null;
    position: string;
    status: string;
    checkedIn: boolean;
    checkedInAt: string | null;
    arrivedAt: string | null;
    memo: string;
  }>>(),
});

export const profile_relations = relations(profiles, ({ many }) => ({
  posts: many(posts),
}));

export const post_relations = relations(posts, ({ one }) => ({
  author: one(profiles, {
    fields: [posts.author_id],
    references: [profiles.user_id],
  }),
}));