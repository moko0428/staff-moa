// app/(features)/(protected)/manager/schedule/schema.ts
import { pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { profiles } from '@/app/(features)/(protected)/profile/schema';
import { posts } from '@/app/(features)/(public)/post/schema';
import { member_schedules } from '@/app/(features)/(protected)/worker/schedule/schema';

// 매니저 스케줄 상태 enum (동적으로 계산되지만 타입 정의용)
export const manager_schedule_status_enum = pgEnum('manager_schedule_status', [
  'upcoming',
  'ongoing',
  'completed',
]);

/**
 * 매니저 스케줄 스키마
 * 
 * 매니저의 스케줄은 본인이 작성한 공고(posts)를 기반으로 합니다.
 * 별도의 스케줄 테이블은 필요하지 않으며, posts 테이블과의 관계를 통해
 * 스케줄 정보를 관리합니다.
 * 
 * 스케줄 상태(upcoming/ongoing/completed)는 동적으로 계산됩니다:
 * - upcoming: 공고의 work_slots 중 미래 날짜가 있는 경우
 * - ongoing: 공고의 work_slots 중 현재 진행 중인 날짜가 있는 경우
 * - completed: 공고의 work_slots의 모든 날짜가 과거인 경우
 * 
 * 참여자 정보는 member_schedules 테이블을 통해 조회합니다.
 */

// 매니저 스케줄 관계 정의
export const manager_schedule_relations = relations(posts, ({ one, many }) => ({
  // 매니저(작성자) 정보
  author: one(profiles, {
    fields: [posts.author_id],
    references: [profiles.profile_id],
  }),
  // 해당 공고에 지원한 멤버 스케줄들
  memberSchedules: many(member_schedules, {
    relationName: 'post_member_schedules',
  }),
}));

// 매니저 프로필과 공고 관계
export const manager_profile_relations = relations(profiles, ({ many }) => ({
  // 매니저가 작성한 공고들 (스케줄 관리에 사용)
  managerPosts: many(posts, {
    relationName: 'manager_posts',
  }),
}));

/**
 * 매니저 스케줄 조회 시 사용할 타입 정의
 * 
 * 실제 데이터베이스 테이블은 없지만, 타입 정의를 통해
 * 매니저 스케줄 데이터 구조를 명확히 합니다.
 */
export type ManagerSchedule = {
  post_id: number;
  author_id: string;
  title: string;
  description: string;
  work_date: string;
  work_time_start: string;
  work_time_end: string;
  location: string;
  pay_amount: number;
  pay_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  recruit_count: number;
  manager_name: string;
  manager_phone: string;
  status: 'recruiting' | 'completed' | 'urgent';
  work_slots: Array<{
    date: string;
    start_time: string;
    end_time: string;
    location?: string;
    pay_amount?: number;
  }>;
  created_at: string;
  updated_at: string;
  // 동적으로 계산되는 필드
  schedule_status?: 'upcoming' | 'ongoing' | 'completed';
  participants?: Array<{
    member_schedule_id: string;
    member_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    message?: string;
    created_at: string;
  }>;
};
