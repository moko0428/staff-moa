import { parseDateString } from '@/lib/dateUtils';
import type { SupabasePost, PostWithApplicationStatus } from '../types';

// "HH:MM:SS" → "HH:MM" 로 정규화 (초 포함 시 정규식 잘못 매칭 방지)
export function normalizeTimeRangeString(timeStr: string): string {
  if (!timeStr || typeof timeStr !== 'string') return '';
  return timeStr.trim().replace(/(\d{1,2}):(\d{2}):(\d{2})/g, '$1:$2');
}

export function parseEndTime(timeStr: string): { hours: number; minutes: number } | null {
  const normalized = normalizeTimeRangeString(timeStr);
  const match = normalized.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (match) {
    return {
      hours: parseInt(match[3], 10),
      minutes: parseInt(match[4], 10),
    };
  }
  return null;
}

// 근무 시간 계산 함수 (시간 단위)
export function calculateWorkHours(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const normalized = normalizeTimeRangeString(timeStr);
  const match = normalized.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (match) {
    const startHours = parseInt(match[1], 10);
    const startMinutes = parseInt(match[2], 10);
    const endHours = parseInt(match[3], 10);
    const endMinutes = parseInt(match[4], 10);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const hours = (endTotalMinutes - startTotalMinutes) / 60;
    return hours > 0 ? hours : 0;
  }
  return 0;
}

export function getWorkHoursFromSlot(slot: {
  start_time?: string;
  end_time?: string;
  start?: string;
  end?: string;
}): number {
  const start = slot.start_time || slot.start || '';
  const end = slot.end_time || slot.end || '';
  if (!start || !end) return 0;
  return calculateWorkHours(`${start} - ${end}`);
}

// 스케줄에 대해 날짜별 급여 항목 계산
export function getPerDatePayItems(schedule: {
  date: string;
  time: string;
  salary: number;
  payType?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  workSlots?: Array<{
    date: string;
    start_time?: string;
    end_time?: string;
    start?: string;
    end?: string;
    pay_amount?: number;
    pay_type?: string;
  }>;
}): { dateStr: string; workHours: number; payAmount: number }[] {
  const payType = schedule.payType || 'daily';
  const salary = schedule.salary || 0;
  const dates = parseDateString(schedule.date);
  if (dates.length === 0) return [];

  const fallbackHours = calculateWorkHours(schedule.time);
  const numDays = dates.length;
  const dailyRateForWeeklyMonthly = numDays > 1 ? salary / numDays : salary;

  return dates.map((dateStr) => {
    let workHours = fallbackHours;
    let slotSalary = salary;
    if (schedule.workSlots?.length) {
      const slot = schedule.workSlots.find((s) => s.date === dateStr);
      if (slot) {
        workHours = getWorkHoursFromSlot(slot);
        slotSalary = slot.pay_amount ?? salary;
      }
    }
    let payAmount: number;
    if (payType === 'hourly') {
      payAmount = workHours * slotSalary;
    } else if (payType === 'daily') {
      payAmount = slotSalary;
    } else if (payType === 'weekly' || payType === 'monthly') {
      payAmount = dailyRateForWeeklyMonthly;
    } else {
      payAmount = slotSalary;
    }
    return { dateStr, workHours, payAmount };
  });
}

export function supabasePostToPost(supabasePost: SupabasePost): PostWithApplicationStatus {
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
    applicationStatus: supabasePost.application_status,
    applicationId: supabasePost.application_id,
    payType: firstSlot?.pay_type || supabasePost.pay_type,
    workSlots: supabasePost.work_slots?.map((slot) => ({
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      start: slot.start_time || slot.start,
      end: slot.end_time || slot.end,
      location: slot.location,
      pay_type: slot.pay_type,
      pay_amount: slot.pay_amount,
    })),
  };
}
