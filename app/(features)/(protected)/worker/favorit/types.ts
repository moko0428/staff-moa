import type { Post } from '@/types/mockData';

export type SortOrder = 'newest' | 'oldest';

export type SupabasePost = {
  post_id: number;
  title: string;
  description: string;
  work_date: string;
  work_time_start: string;
  work_time_end: string;
  location: string;
  pay_amount: number;
  pay_type: string;
  recruit_count: number;
  manager_name: string;
  manager_phone: string;
  equipments?: string | null;
  qualifications?: string | null;
  preferences?: string | null;
  notes?: string | null;
  external_link?: string | null;
  keywords?: string[] | null;
  author_id: string;
  status: 'recruiting' | 'completed' | 'urgent';
  form_type?: string | null;
  created_at: string;
  updated_at: string;
  work_slots?: Array<{
    date: string;
    start_time: string;
    end_time: string;
    location?: string;
    pay_amount?: number;
  }> | null;
};

export type ConvertedPost = Post & {
  work_slots?: Array<{
    date: string;
    start_time?: string;
    end_time?: string;
    start?: string;
    end?: string;
    location?: string;
    pay_amount?: number;
  }>;
  equipments?: string;
  manager_name?: string;
  manager_phone?: string;
  recruit_count?: number;
  created_at?: string;
  qualifications?: string;
  external_link?: string;
};

export type ManagerInfo = {
  managerId: string;
  managerName: string;
  avatar: string | null;
  followerCount: number;
};

export type ProfileModalUser = {
  id: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  role: string;
  introduction: string | null;
  attendanceScore: number | null;
  followerCount: number;
};
