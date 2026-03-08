import type { JobItem } from '@/app/components/JobCard';
import type { Post } from '@/types/mockData';
import type { SupabasePost, ConvertedPost } from '../types';

export function supabasePostToPost(supabasePost: SupabasePost): ConvertedPost {
  const firstSlot =
    Array.isArray(supabasePost.work_slots) && supabasePost.work_slots.length > 0
      ? supabasePost.work_slots[0]
      : null;

  return {
    id: supabasePost.post_id.toString(),
    authorId: supabasePost.author_id,
    authorName: supabasePost.manager_name,
    status: supabasePost.status,
    title: supabasePost.title,
    keywords: supabasePost.keywords || [],
    date: firstSlot?.date || supabasePost.work_date || '',
    location: firstSlot?.location || supabasePost.location || '',
    time: firstSlot
      ? `${firstSlot.start_time} - ${firstSlot.end_time}`
      : `${supabasePost.work_time_start} - ${supabasePost.work_time_end}`,
    salary: firstSlot?.pay_amount || Number(supabasePost.pay_amount) || 0,
    paymentDate: '',
    preparation: supabasePost.equipments || '',
    description: supabasePost.description,
    managerInfo: {
      name: supabasePost.manager_name,
      phone: supabasePost.manager_phone,
    },
    recruitCount: supabasePost.recruit_count,
    currentApplicants: 0,
    notes: supabasePost.notes || undefined,
    requirements: supabasePost.qualifications || undefined,
    preferences: supabasePost.preferences || undefined,
    createdAt: supabasePost.created_at,
    updatedAt: supabasePost.updated_at,
    work_slots: supabasePost.work_slots?.map((slot) => ({
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      start: slot.start_time,
      end: slot.end_time,
      location: slot.location,
      pay_amount: slot.pay_amount,
    })) || undefined,
    equipments: supabasePost.equipments || undefined,
    manager_name: supabasePost.manager_name,
    manager_phone: supabasePost.manager_phone,
    recruit_count: supabasePost.recruit_count,
    created_at: supabasePost.created_at,
    qualifications: supabasePost.qualifications || undefined,
    external_link: supabasePost.external_link || undefined,
  };
}

export function postToJobItem(post: ConvertedPost): JobItem {
  const statusMap: Record<Post['status'], JobItem['status']> = {
    urgent: '급구',
    recruiting: '모집',
    completed: '모집완료',
  };

  const firstSlot = post.work_slots?.[0];
  const date = firstSlot?.date || post.date || '';
  const time = firstSlot
    ? `${firstSlot.start_time || firstSlot.start || ''} - ${firstSlot.end_time || firstSlot.end || ''}`
    : post.time || '';
  const place = firstSlot?.location || post.location || '';
  const pay = firstSlot?.pay_amount || post.salary || 0;
  const need = post.equipments || post.preparation || '';
  const managerName = post.manager_name || post.managerInfo?.name || '';
  const managerPhone = post.manager_phone || post.managerInfo?.phone || '';
  const recruitCount = post.recruit_count || post.recruitCount || 0;
  const currentApplicants = post.currentApplicants || 0;
  const createdAt = post.created_at || post.createdAt || '';
  const workSlotCount =
    Array.isArray(post.work_slots) && post.work_slots.length > 0
      ? post.work_slots.length
      : 1;

  return {
    id: post.id,
    title: post.title,
    content: post.description,
    date,
    workSlotCount,
    time,
    need,
    place,
    pay: pay.toString(),
    TO: `${recruitCount - currentApplicants}명`,
    manager: managerName,
    managerPhone,
    etc: post.notes || '',
    externalLink: post.external_link || null,
    categories: post.keywords || [],
    qualifications: post.qualifications ? [post.qualifications] : [],
    status: statusMap[post.status],
    createdAt,
  };
}
