import type { AttendanceReview, Post } from '@/types/mockData';

export type ScheduleStatus = 'upcoming' | 'ongoing' | 'completed';

export interface ScheduleWithPost extends Omit<Post, 'status'> {
  scheduleId?: string;
  status: ScheduleStatus;
  participants: Array<{
    userId: string;
    userName: string;
    applicationId: string;
    avatar?: string;
    phone?: string;
    kakaoId?: string;
    gender?: string;
    review?: AttendanceReview;
  }>;
}

