import type { Post } from '@/types/mockData';

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
    date: string;
    start_time?: string;
    end_time?: string;
    start?: string;
    end?: string;
    location?: string;
    pay_type?: 'hourly' | 'daily' | 'weekly' | 'monthly';
    pay_amount?: number;
    tax_withholding?: boolean;
  }> | null;
};

export const parseEndTime = (
  timeStr: string
): { hours: number; minutes: number } | null => {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (match) {
    return {
      hours: parseInt(match[3], 10),
      minutes: parseInt(match[4], 10),
    };
  }
  return null;
};

export const supabasePostToPost = (supabasePost: SupabasePost): Post => {
  const firstSlot =
    Array.isArray(supabasePost.work_slots) && supabasePost.work_slots.length > 0
      ? supabasePost.work_slots[0]
      : null;

  let dateStr = '';
  if (Array.isArray(supabasePost.work_slots) && supabasePost.work_slots.length > 0) {
    const dates = supabasePost.work_slots.map((slot) => slot.date).filter(Boolean);
    if (dates.length === 1) {
      dateStr = dates[0];
    } else if (dates.length > 1) {
      dateStr = `${dates[0]} ~ ${dates[dates.length - 1]}`;
    }
  }
  if (!dateStr) {
    dateStr = supabasePost.work_date || '';
  }

  let timeStr = '';
  if (firstSlot) {
    const start = firstSlot.start_time || firstSlot.start || '';
    const end = firstSlot.end_time || firstSlot.end || '';
    if (start && end) {
      timeStr = `${start} - ${end}`;
    }
  }
  if (!timeStr) {
    timeStr = `${supabasePost.work_time_start} - ${supabasePost.work_time_end}`;
  }

  return {
    id: supabasePost.post_id.toString(),
    authorId: supabasePost.author_id,
    authorName: supabasePost.manager_name,
    status: supabasePost.status,
    title: supabasePost.title,
    keywords: supabasePost.keywords || [],
    date: dateStr,
    location: firstSlot?.location || supabasePost.location || '',
    time: timeStr,
    salary: firstSlot?.pay_amount || Number(supabasePost.pay_amount) || 0,
    paymentDate: '',
    preparation: supabasePost.equipments || '',
    description: supabasePost.description,
    managerInfo: {
      name: supabasePost.manager_name,
      contactType: supabasePost.manager_contact_type || 'phone',
      phone: supabasePost.manager_phone,
    },
    recruitCount: supabasePost.recruit_count,
    currentApplicants: 0,
    notes: supabasePost.notes || undefined,
    requirements: supabasePost.qualifications || undefined,
    preferences: supabasePost.preferences || undefined,
    createdAt: supabasePost.created_at,
    updatedAt: supabasePost.updated_at,
  };
};
