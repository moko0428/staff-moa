import type { Post } from '@/types/mockData';

export type ScheduleStatus = 'upcoming' | 'ongoing' | 'completed';
export type DateMode = 'single' | 'range' | 'multi';

export type SupabasePost = {
  post_id: number | string;
  author_id: string;
  title: string;
  description: string;
  work_date: string;
  work_time_start: string;
  work_time_end: string;
  location: string;
  pay_amount: number | string;
  pay_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  recruit_count: number;
  manager_name: string;
  manager_contact_type?: string | null;
  manager_phone: string;
  equipments?: string | null;
  qualifications?: string | null;
  preferences?: string | null;
  notes?: string | null;
  external_link?: string | null;
  keywords?: string[] | null;
  status: 'recruiting' | 'completed' | 'urgent';
  form_type?: string | null;
  created_at: string;
  updated_at: string;
  work_slots?: Array<{
    // v3 WorkPart format fields
    name?: string;
    description?: string;
    shifts?: Array<{
      date: string;
      date_end?: string;
      start?: string;
      end?: string;
    }>;
    // Legacy flat format fields
    date?: string;
    start_time?: string;
    end_time?: string;
    start?: string;
    end?: string;
    tax_withholding?: boolean;
    // Common fields
    location?: string;
    pay_type?: 'hourly' | 'daily' | 'weekly' | 'monthly';
    pay_amount?: number;
  }> | null;
  application_id?: string;
  applied_at?: string;
  application_status?: 'pending' | 'accepted' | 'rejected';
};

export type PostWithApplicationStatus = Post & {
  applicationStatus?: 'pending' | 'accepted' | 'rejected';
  applicationId?: string;
  payType?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  workSlots?: Array<{
    date: string;
    start_time?: string;
    end_time?: string;
    start?: string;
    end?: string;
    location?: string;
    pay_type?: 'hourly' | 'daily' | 'weekly' | 'monthly';
    pay_amount?: number;
  }>;
};

export interface ScheduleWithPost extends Omit<Post, 'status'> {
  scheduleId?: string;
  status: ScheduleStatus;
  applicationId?: string;
  appliedAt?: string;
  applicationStatus?: 'pending' | 'accepted' | 'rejected';
}

export interface ScheduleSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export interface CategorizedSchedules {
  upcoming: ScheduleWithPost[];
  ongoing: ScheduleWithPost[];
  completed: ScheduleWithPost[];
  applications: ScheduleWithPost[];
}

export interface EarningsData {
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  thisWeekCount: number;
  thisMonthCount: number;
  thisYearCount: number;
}
