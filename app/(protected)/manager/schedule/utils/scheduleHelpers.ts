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
    // WorkPart format (v3)
    name?: string;
    description?: string;
    shifts?: Array<{ date: string; date_end?: string; start?: string; end?: string }>;
    // Legacy flat format
    date?: string;
    start_time?: string;
    end_time?: string;
    start?: string;
    end?: string;
    tax_withholding?: boolean;
    // Common
    location?: string;
    pay_type?: 'hourly' | 'daily' | 'weekly' | 'monthly';
    pay_amount?: number;
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
  const rawSlots = supabasePost.work_slots;
  const isWorkPartFormat =
    Array.isArray(rawSlots) && rawSlots.length > 0 && Array.isArray(rawSlots[0]?.shifts);

  let allDates: string[] = [];
  let firstStart = '', firstEnd = '', firstLocation = '';
  let firstPayAmount = 0;

  if (isWorkPartFormat) {
    for (const part of rawSlots!) {
      if (!Array.isArray(part.shifts)) continue;
      for (const shift of part.shifts) {
        if (shift.date) allDates.push(shift.date);
        if (shift.date_end) allDates.push(shift.date_end);
      }
    }
    const firstPart = rawSlots![0];
    const firstShift = firstPart?.shifts?.[0];
    firstStart     = firstShift?.start || '';
    firstEnd       = firstShift?.end   || '';
    firstLocation  = firstPart?.location   || '';
    firstPayAmount = firstPart?.pay_amount || 0;
  } else if (Array.isArray(rawSlots) && rawSlots.length > 0) {
    allDates = rawSlots.map((s) => s.date).filter(Boolean) as string[];
    const first = rawSlots[0];
    firstStart     = first?.start_time || first?.start || '';
    firstEnd       = first?.end_time   || first?.end   || '';
    firstLocation  = first?.location   || '';
    firstPayAmount = first?.pay_amount || 0;
  }

  allDates.sort();
  const dateStr =
    allDates.length === 0 ? (supabasePost.work_date || '')
    : allDates.length === 1 ? allDates[0]
    : `${allDates[0]} ~ ${allDates[allDates.length - 1]}`;

  let timeStr = '';
  if (firstStart && firstEnd) {
    timeStr = `${firstStart} - ${firstEnd}`;
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
    location: firstLocation || supabasePost.location || '',
    time: timeStr,
    salary: firstPayAmount || Number(supabasePost.pay_amount) || 0,
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
