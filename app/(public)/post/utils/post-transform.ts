import type { JobItem } from '@/app/components/JobCard';

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
  created_at: string;
  updated_at: string;
  currentApplicants?: number;
  authorCoverImage?: string | null;
  work_slots?: Array<{
    date: string;
    start_time: string;
    end_time: string;
    location?: string;
    pay_amount?: number;
  }> | null;
};

export type PostItem = {
  id: string;
  title: string;
  description: string;
  status: 'recruiting' | 'completed' | 'urgent';
  keywords: string[];
  date: string;
  location: string;
  time: string;
  salary: number;
  pay_type: string;
  equipments?: string;
  notes?: string;
  qualifications?: string;
  preferences?: string;
  external_link?: string;
  manager_name: string;
  manager_phone: string;
  recruit_count: number;
  currentApplicants: number;
  authorCoverImage?: string | null;
  created_at: string;
  work_slots?: Array<{
    date: string;
    start_time: string;
    end_time: string;
    location?: string;
    pay_amount?: number;
  }>;
};

export const supabasePostToPostItem = (raw: SupabasePost): PostItem => {
  const firstSlot = Array.isArray(raw.work_slots) ? raw.work_slots[0] : null;
  return {
    id: raw.post_id.toString(),
    title: raw.title,
    description: raw.description,
    status: raw.status,
    keywords: raw.keywords || [],
    date: firstSlot?.date || raw.work_date || '',
    location: firstSlot?.location || raw.location || '',
    time: firstSlot
      ? `${firstSlot.start_time} - ${firstSlot.end_time}`
      : `${raw.work_time_start} - ${raw.work_time_end}`,
    salary: firstSlot?.pay_amount ?? Number(raw.pay_amount) ?? 0,
    pay_type: raw.pay_type || '',
    equipments: raw.equipments || undefined,
    notes: raw.notes || undefined,
    qualifications: raw.qualifications || undefined,
    preferences: raw.preferences || undefined,
    external_link: raw.external_link || undefined,
    manager_name: raw.manager_name,
    manager_phone: raw.manager_phone,
    recruit_count: raw.recruit_count,
    currentApplicants: raw.currentApplicants || 0,
    authorCoverImage: raw.authorCoverImage ?? null,
    created_at: raw.created_at,
    work_slots: raw.work_slots || undefined,
  };
};

const PAY_TYPE_KO: Record<string, string> = {
  hourly: '시급',
  daily: '일급',
  weekly: '주급',
  monthly: '월급',
};

const STATUS_MAP: Record<PostItem['status'], JobItem['status']> = {
  urgent: '급구',
  recruiting: '모집',
  completed: '모집완료',
};

export const postItemToJobItem = (post: PostItem): JobItem => {
  const workSlotCount =
    Array.isArray(post.work_slots) && post.work_slots.length > 0
      ? post.work_slots.length
      : 1;
  const remaining = post.recruit_count - post.currentApplicants;

  return {
    id: post.id,
    title: post.title,
    content: post.description,
    date: post.date,
    workSlotCount,
    time: post.time,
    need: post.equipments || '',
    place: post.location,
    pay: post.salary.toString(),
    payType: PAY_TYPE_KO[post.pay_type] || undefined,
    TO: `${remaining}명`,
    manager: post.manager_name,
    managerPhone: post.manager_phone,
    etc: post.notes || '',
    externalLink: post.external_link || null,
    categories: post.keywords,
    qualifications: post.qualifications ? [post.qualifications] : [],
    status: STATUS_MAP[post.status],
    createdAt: post.created_at,
    coverImage: post.authorCoverImage ?? undefined,
  };
};
