'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useUserStore } from '@/store/useUserStore';
import * as React from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import ScheduleCalendar from '@/app/components/ScheduleCalendar';
import { Calendar } from '@/app/components/ui/calendar';
import { Post } from '@/types/mockData';
import type { DateRange } from 'react-day-picker';
import {
  getMySchedulesAction,
  createPersonalScheduleAction,
  createPersonalSchedulesBulkAction,
  getPersonalSchedulesAction,
  updatePersonalScheduleAction,
  deletePersonalScheduleAction,
  cancelApplicationAction,
} from './actions';
import { createClient } from '@/utils/supabase/client';
import {
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  TrendingUp,
  Wallet,
  DollarSign,
  Plus,
  Trash2,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { parseDateString } from '@/lib/dateUtils';
import { BottomSheet } from '@/app/components/mobile/BottomSheet';

type ScheduleStatus = 'upcoming' | 'ongoing' | 'completed';

// 파일 상단에 시간 파싱 헬퍼 함수 추가
function parseEndTime(
  timeStr: string
): { hours: number; minutes: number } | null {
  // "09:00 - 18:00" 또는 "06:00 - 14:00" 형식에서 종료 시간 추출
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (match) {
    return {
      hours: parseInt(match[3], 10),
      minutes: parseInt(match[4], 10),
    };
  }
  return null;
}

// 근무 시간 계산 함수 (시간 단위)
function calculateWorkHours(timeStr: string): number {
  // "09:00 - 18:00" 형식에서 근무 시간 계산
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (match) {
    const startHours = parseInt(match[1], 10);
    const startMinutes = parseInt(match[2], 10);
    const endHours = parseInt(match[3], 10);
    const endMinutes = parseInt(match[4], 10);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    return (endTotalMinutes - startTotalMinutes) / 60;
  }
  return 0;
}

export interface ScheduleWithPost extends Omit<Post, 'status'> {
  scheduleId?: string;
  status: ScheduleStatus;
  applicationId?: string;
  appliedAt?: string;
  applicationStatus?: 'pending' | 'accepted' | 'rejected';
}

// Supabase Post를 Post 타입으로 변환
type SupabasePost = {
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
  application_id?: string;
  applied_at?: string;
  application_status?: 'pending' | 'accepted' | 'rejected';
};

// Post에 application_status와 pay_type 추가
type PostWithApplicationStatus = Post & {
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

function supabasePostToPost(
  supabasePost: SupabasePost
): PostWithApplicationStatus {
  const firstSlot =
    Array.isArray(supabasePost.work_slots) && supabasePost.work_slots.length > 0
      ? supabasePost.work_slots[0]
      : null;

  // work_slots에서 날짜들을 추출하여 date 문자열 생성
  let dateStr = '';
  if (
    Array.isArray(supabasePost.work_slots) &&
    supabasePost.work_slots.length > 0
  ) {
    const dates = supabasePost.work_slots
      .map((slot) => slot.date)
      .filter(Boolean);
    if (dates.length === 1) {
      dateStr = dates[0];
    } else if (dates.length > 1) {
      dateStr = `${dates[0]} ~ ${dates[dates.length - 1]}`;
    }
  }
  if (!dateStr) {
    dateStr = supabasePost.work_date || '';
  }

  // time 문자열 생성
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

export default function WorkerSchedulePage() {
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const effectiveRole = role ?? null;
  const isMember = effectiveRole === 'member';
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [addScheduleOpen, setAddScheduleOpen] = useState(false);
  const [bottomSheetHeightPx, setBottomSheetHeightPx] = useState<number>(
    typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.65) : 0
  );
  const [selectedSchedule, setSelectedSchedule] =
    useState<ScheduleWithPost | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [workerPosts, setWorkerPosts] = useState<PostWithApplicationStatus[]>(
    []
  );
  const [personalSchedules, setPersonalSchedules] = useState<
    PostWithApplicationStatus[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [monthCalendarOpen, setMonthCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // 현재 사용자 ID 가져오기
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          setCurrentUserId(data.user.id);
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // 데이터 가져오기 함수
  const fetchData = useCallback(async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      // 지원한 공고 가져오기
      const result = await getMySchedulesAction();
      if (result.ok && result.data) {
        // MemberScheduleWithPost에서 posts 필드를 추출하여 변환
        const convertedPosts = result.data
          .filter((schedule) => schedule.posts !== null)
          .map((schedule) => {
            const post = schedule.posts!;
            return supabasePostToPost({
              ...post,
              post_id: post.post_id,
              application_id: schedule.member_schedule_id,
              applied_at: schedule.created_at,
              application_status: schedule.status, // 지원 상태 추가
            } as unknown as SupabasePost);
          });
        setWorkerPosts(convertedPosts);
      }

      // 개인 스케줄 가져오기
      const personalResult = await getPersonalSchedulesAction();
      if (personalResult.ok && personalResult.data) {
        const convertedPersonalSchedules = personalResult.data.map(
          (schedule: Record<string, unknown>) => {
            const dateStr = schedule.date as string;
            const startTime = schedule.start_time as string;
            const endTime = schedule.end_time as string;

            return {
              id: `personal-${schedule.personal_schedule_id as string}`,
              authorId: schedule.user_id as string,
              authorName: (schedule.manager_name as string) || '개인 일정',
              status: 'recruiting' as const,
              title: schedule.title as string,
              keywords: [],
              date: dateStr,
              location: (schedule.location as string) || '',
              time: `${startTime} - ${endTime}`,
              salary: (schedule.pay_amount as number) || 0,
              paymentDate: '',
              preparation: '',
              description: (schedule.description as string) || '',
              managerInfo: {
                name: (schedule.manager_name as string) || '',
                contactType: (schedule.manager_contact_type as string) || 'phone',
                phone: (schedule.manager_phone as string) || '',
              },
              recruitCount: 0,
              currentApplicants: 0,
              createdAt: schedule.created_at as string,
              updatedAt: schedule.updated_at as string,
              applicationStatus: 'accepted' as const,
              payType:
                (schedule.pay_type as
                  | 'hourly'
                  | 'daily'
                  | 'weekly'
                  | 'monthly') || 'daily',
            } as PostWithApplicationStatus;
          }
        );
        setPersonalSchedules(convertedPersonalSchedules);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setWorkerPosts([]);
      setPersonalSchedules([]);
    } finally {
      setIsLoading(false);
      setIsMounted(true);
    }
  }, [currentUserId]);

  // worker가 지원한 공고 가져오기
  useEffect(() => {
    if (currentUserId) {
      fetchData();
    }
  }, [currentUserId, fetchData]);

  // 스케줄 상태 분류
  const categorizedSchedules = useMemo(() => {
    // 클라이언트에서 마운트되지 않았으면 빈 배열 반환
    if (!isMounted) {
      return { upcoming: [], ongoing: [], completed: [], applications: [] };
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: ScheduleWithPost[] = [];
    const ongoing: ScheduleWithPost[] = [];
    const completed: ScheduleWithPost[] = [];
    const applications: ScheduleWithPost[] = [];

    // 지원한 공고와 개인 스케줄을 합쳐서 처리
    const allPosts = [...workerPosts, ...personalSchedules];

    allPosts.forEach((post) => {
      // 모든 지원 내역을 applications에 추가 (승인 여부 무관)
      const applicationSchedule: ScheduleWithPost = {
        ...post,
        status: 'upcoming',
        applicationStatus: post.applicationStatus,
      };
      applications.push(applicationSchedule);

      // 예정 목록에는 승인된(accepted) 스케줄만 포함
      // 승인되지 않은 스케줄은 스킵
      if (post.applicationStatus !== 'accepted') {
        return;
      }

      // date 필드를 파싱하여 날짜 배열로 변환
      const dates = parseDateString(post.date);
      if (dates.length === 0) return; // 유효한 날짜가 없으면 스킵

      const scheduleWithPost: ScheduleWithPost = {
        ...post,
        status: 'upcoming',
        applicationStatus: post.applicationStatus,
      };

      // 종료 시간 파싱
      const endTime = parseEndTime(post.time);

      // 원본 날짜 형식 확인
      const isRangeSchedule = post.date.includes('~'); // 기간 스케줄

      if (isRangeSchedule) {
        // 기간 스케줄: 첫날과 마지막날만 고려
        const firstDate = parseISO(dates[0]);
        const lastDate = parseISO(dates[dates.length - 1]);
        firstDate.setHours(0, 0, 0, 0);
        lastDate.setHours(0, 0, 0, 0);

        // 마지막 날짜에 종료 시간 적용
        if (endTime) {
          lastDate.setHours(endTime.hours, endTime.minutes, 0, 0);
        } else {
          lastDate.setHours(23, 59, 59, 999);
        }

        // 현재 시간 기준으로 판단
        if (now <= lastDate && now >= firstDate) {
          scheduleWithPost.status = 'ongoing';
          ongoing.push(scheduleWithPost);
        } else if (firstDate > now) {
          scheduleWithPost.status = 'upcoming';
          upcoming.push(scheduleWithPost);
        } else {
          scheduleWithPost.status = 'completed';
          completed.push(scheduleWithPost);
        }
      } else {
        // 당일 스케줄 또는 불연속 날짜: 각 날짜를 개별적으로 평가
        const parsedDates = dates.map((dateStr) => {
          const d = parseISO(dateStr);
          d.setHours(0, 0, 0, 0);
          return d;
        });

        // 각 날짜에 종료 시간을 적용한 배열 생성
        const parsedDatesWithEndTime = parsedDates.map((date) => {
          const dateWithTime = new Date(date);
          if (endTime) {
            dateWithTime.setHours(endTime.hours, endTime.minutes, 0, 0);
          } else {
            dateWithTime.setHours(23, 59, 59, 999);
          }
          return dateWithTime;
        });

        // 미래 날짜가 있는지 확인 (종료 시간 기준)
        const futureDates = parsedDatesWithEndTime.filter((date) => date > now);

        // 과거 날짜가 있는지 확인 (종료 시간 기준)
        const pastDates = parsedDatesWithEndTime.filter((date) => date < now);

        // 오늘 날짜가 있는지 확인
        const todayDates = parsedDates.filter(
          (date) => date.getTime() === today.getTime()
        );

        // 오늘 날짜 중 아직 종료되지 않은 것이 있는지 확인
        const ongoingToday =
          todayDates.length > 0 &&
          parsedDatesWithEndTime.some(
            (date) =>
              date.getTime() >= today.getTime() &&
              date.getTime() < today.getTime() + 86400000 &&
              date > now
          );

        // 불연속 날짜 로직:
        // - 오늘 날짜가 진행중이면 → 진행중
        // - 과거와 미래 날짜가 섞여 있으면 → 진행중
        // - 미래 날짜만 있으면 → 예정
        // - 오늘 날짜가 있고 종료되었으면 → 진행중 (아직 미래 날짜 남음)
        // - 모든 날짜가 과거면 → 완료

        if (ongoingToday) {
          // 오늘 진행중이면 진행중
          scheduleWithPost.status = 'ongoing';
          ongoing.push(scheduleWithPost);
        } else if (pastDates.length > 0 && futureDates.length > 0) {
          // 과거와 미래가 섞여있으면 진행중
          scheduleWithPost.status = 'ongoing';
          ongoing.push(scheduleWithPost);
        } else if (futureDates.length > 0) {
          // 미래 날짜만 있으면 예정
          scheduleWithPost.status = 'upcoming';
          upcoming.push(scheduleWithPost);
        } else if (todayDates.length > 0) {
          // 오늘 날짜가 있지만 이미 종료됨 (미래 없음)
          scheduleWithPost.status = 'completed';
          completed.push(scheduleWithPost);
        } else {
          // 모든 날짜가 과거면 완료
          scheduleWithPost.status = 'completed';
          completed.push(scheduleWithPost);
        }
      }
    });

    return { upcoming, ongoing, completed, applications };
  }, [workerPosts, personalSchedules, isMounted]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // 개인 스케줄을 행사 단위로 그룹핑 (같은 title + payType + salary → 같은 행사)
  const groupedScheduleEvents = useMemo(() => {
    // 승인된 공고 스케줄 (각각 하나의 행사)
    const acceptedWorkerSchedules = workerPosts.filter(
      (post) => post.applicationStatus === 'accepted'
    );

    type ScheduleEvent = {
      id: string;
      dates: string[];
      salary: number;
      payType: 'hourly' | 'daily' | 'weekly' | 'monthly';
      time: string;
    };

    const events: ScheduleEvent[] = [];

    // 공고 스케줄: 각 공고가 하나의 행사
    acceptedWorkerSchedules.forEach((post) => {
      const dates = parseDateString(post.date);
      if (dates.length === 0) return;
      events.push({
        id: post.id,
        dates,
        salary: post.salary || 0,
        payType: (post.payType || 'daily') as ScheduleEvent['payType'],
        time: post.time,
      });
    });

    // 개인 스케줄: 같은 title + payType + salary + managerName을 하나의 행사로 그룹핑
    const personalGroups = new Map<string, { dates: string[]; salary: number; payType: ScheduleEvent['payType']; time: string; ids: string[] }>();
    personalSchedules.forEach((ps) => {
      const payType = (ps.payType || 'daily') as ScheduleEvent['payType'];
      const groupKey = `${ps.title}|${payType}|${ps.salary}|${ps.managerInfo?.name || ''}`;
      const existing = personalGroups.get(groupKey);
      const dates = parseDateString(ps.date);
      if (existing) {
        existing.dates.push(...dates);
        existing.ids.push(ps.id);
      } else {
        personalGroups.set(groupKey, {
          dates: [...dates],
          salary: ps.salary || 0,
          payType,
          time: ps.time,
          ids: [ps.id],
        });
      }
    });

    personalGroups.forEach((group, key) => {
      // 날짜 정렬 및 중복 제거
      const uniqueDates = Array.from(new Set(group.dates)).sort();
      events.push({
        id: `personal-group-${key}`,
        dates: uniqueDates,
        salary: group.salary,
        payType: group.payType,
        time: group.time,
      });
    });

    return events;
  }, [workerPosts, personalSchedules]);

  // 급여 계산 (선택된 날짜의 달 기준)
  const earningsData = useMemo(() => {
    if (!isMounted) {
      return {
        thisWeek: 0,
        thisMonth: 0,
        accumulated: 0,
        thisWeekCount: 0,
        thisMonthCount: 0,
        accumulatedCount: 0,
      };
    }

    const now = new Date();
    const baseDate = selectedDate ?? today;
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(baseDate, { weekStartsOn: 0 });
    const monthStart = startOfMonth(baseDate);
    const monthEnd = endOfMonth(baseDate);

    let thisWeekEarnings = 0;
    let thisMonthEarnings = 0;
    let accumulatedEarnings = 0;
    let thisWeekCount = 0;
    let thisMonthCount = 0;
    let accumulatedCount = 0;

    // 주급/월급 중복 방지를 위한 Set (행사 ID 기준)
    const weeklyEventsAdded = new Set<string>();
    const monthlyEventsAdded = new Set<string>();
    const accumulatedWeeklyEvents = new Set<string>();
    const accumulatedMonthlyEvents = new Set<string>();

    groupedScheduleEvents.forEach((event) => {
      const { dates, salary, payType, time, id: eventId } = event;
      if (dates.length === 0 || salary === 0) return;

      const workHours = calculateWorkHours(time);

      if (payType === 'hourly') {
        // 시급: 각 근무일의 근무 시간 × 시급
        dates.forEach((dateStr) => {
          try {
            const scheduleDate = parseISO(dateStr);
            const dailyPay = salary * workHours;

            if (isWithinInterval(scheduleDate, { start: weekStart, end: weekEnd })) {
              thisWeekEarnings += dailyPay;
              thisWeekCount++;
            }
            if (isWithinInterval(scheduleDate, { start: monthStart, end: monthEnd })) {
              thisMonthEarnings += dailyPay;
              thisMonthCount++;
            }
          } catch {
            // skip
          }
        });
      } else if (payType === 'daily') {
        // 일급: 각 근무일마다 일급
        dates.forEach((dateStr) => {
          try {
            const scheduleDate = parseISO(dateStr);

            if (isWithinInterval(scheduleDate, { start: weekStart, end: weekEnd })) {
              thisWeekEarnings += salary;
              thisWeekCount++;
            }
            if (isWithinInterval(scheduleDate, { start: monthStart, end: monthEnd })) {
              thisMonthEarnings += salary;
              thisMonthCount++;
            }
          } catch {
            // skip
          }
        });
      } else if (payType === 'weekly') {
        // 주급: 행사 단위로 한 번만 추가
        const hasWorkThisWeek = dates.some((dateStr) => {
          try {
            return isWithinInterval(parseISO(dateStr), { start: weekStart, end: weekEnd });
          } catch { return false; }
        });

        if (hasWorkThisWeek && !weeklyEventsAdded.has(eventId)) {
          thisWeekEarnings += salary;
          thisWeekCount++;
          weeklyEventsAdded.add(eventId);
        }

        const hasWorkThisMonth = dates.some((dateStr) => {
          try {
            return isWithinInterval(parseISO(dateStr), { start: monthStart, end: monthEnd });
          } catch { return false; }
        });

        if (hasWorkThisMonth && !monthlyEventsAdded.has(eventId)) {
          thisMonthEarnings += salary;
          thisMonthCount++;
          monthlyEventsAdded.add(eventId);
        }
      } else if (payType === 'monthly') {
        // 월급: 행사 단위로 한 번만 추가
        const hasWorkThisMonth = dates.some((dateStr) => {
          try {
            return isWithinInterval(parseISO(dateStr), { start: monthStart, end: monthEnd });
          } catch { return false; }
        });

        if (hasWorkThisMonth && !monthlyEventsAdded.has(eventId)) {
          thisMonthEarnings += salary;
          thisMonthCount++;
          monthlyEventsAdded.add(eventId);
        }
      }

      // 누적 급여: 마지막 근무일이 과거인 행사만 계산
      const endTimeObj = parseEndTime(time);
      const allDates = dates.map((dateStr) => {
        const d = parseISO(dateStr);
        if (endTimeObj) {
          d.setHours(endTimeObj.hours, endTimeObj.minutes, 0, 0);
        } else {
          d.setHours(23, 59, 59, 999);
        }
        return d;
      });

      const lastDate = allDates[allDates.length - 1];
      if (lastDate && lastDate < now) {
        if (payType === 'hourly') {
          accumulatedEarnings += salary * workHours * dates.length;
          accumulatedCount += dates.length;
        } else if (payType === 'daily') {
          accumulatedEarnings += salary * dates.length;
          accumulatedCount += dates.length;
        } else if (payType === 'weekly') {
          if (!accumulatedWeeklyEvents.has(eventId)) {
            accumulatedEarnings += salary;
            accumulatedCount++;
            accumulatedWeeklyEvents.add(eventId);
          }
        } else if (payType === 'monthly') {
          if (!accumulatedMonthlyEvents.has(eventId)) {
            accumulatedEarnings += salary;
            accumulatedCount++;
            accumulatedMonthlyEvents.add(eventId);
          }
        }
      }
    });

    return {
      thisWeek: thisWeekEarnings,
      thisMonth: thisMonthEarnings,
      accumulated: accumulatedEarnings,
      thisWeekCount,
      thisMonthCount,
      accumulatedCount,
    };
  }, [groupedScheduleEvents, isMounted, selectedDate, today]);

  const handleScheduleClick = (schedule: ScheduleWithPost) => {
    setSelectedSchedule(schedule);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSchedule(null);
  };

  const focusedDate = selectedDate ?? today;
  const weekStart = useMemo(
    () => startOfWeek(focusedDate, { weekStartsOn: 0 }),
    [focusedDate]
  );

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // 월(1달) 확장 시: 현재 주를 기준으로 위/아래 주를 펼쳐서 렌더링
  const monthWeeks = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [calendarMonth]);

  const currentWeekIndexInMonth = useMemo(() => {
    const idx = monthWeeks.findIndex((w) =>
      w.some((d) => isSameDay(d, focusedDate))
    );
    return idx >= 0 ? idx : 0;
  }, [monthWeeks, focusedDate]);

  const expandedAboveWeeks = useMemo(
    () => monthWeeks.slice(0, currentWeekIndexInMonth),
    [monthWeeks, currentWeekIndexInMonth]
  );
  const expandedBelowWeeks = useMemo(
    () => monthWeeks.slice(currentWeekIndexInMonth + 1),
    [monthWeeks, currentWeekIndexInMonth]
  );

  const currentRowDates = useMemo(() => {
    if (!monthCalendarOpen) return weekDates;
    return monthWeeks[currentWeekIndexInMonth] ?? weekDates;
  }, [monthCalendarOpen, monthWeeks, currentWeekIndexInMonth, weekDates]);

  useEffect(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setCalendarMonth(selectedDate);
    }
  }, [selectedDate]);

  const swipeStateRef = React.useRef<{
    startX: number;
    startY: number;
    isDown: boolean;
    isSwiping: boolean;
    hasPointerCapture: boolean;
    blockClickUntil: number;
  }>({
    startX: 0,
    startY: 0,
    isDown: false,
    isSwiping: false,
    hasPointerCapture: false,
    blockClickUntil: 0,
  });

  const navigateBySwipe = (direction: 'prev' | 'next') => {
    if (monthCalendarOpen) {
      const next = addMonths(focusedDate, direction === 'next' ? 1 : -1);
      handleDateSelect(next);
      setCalendarMonth(next);
      return;
    }
    handleDateSelect(addDays(focusedDate, direction === 'next' ? 7 : -7));
  };

  const headerMonthLabel = useMemo(() => {
    const base = monthCalendarOpen ? calendarMonth : focusedDate;
    return format(base, 'yyyy.MM');
  }, [monthCalendarOpen, calendarMonth, focusedDate]);

  const calendarAreaRef = React.useRef<HTMLDivElement | null>(null);
  const aboveWeeksRef = React.useRef<HTMLDivElement | null>(null);
  const belowWeeksRef = React.useRef<HTMLDivElement | null>(null);
  const monthCalendarOpenRef = React.useRef(monthCalendarOpen);

  React.useEffect(() => {
    monthCalendarOpenRef.current = monthCalendarOpen;
  }, [monthCalendarOpen]);

  const updateBottomSheetHeight = React.useCallback(() => {
    const el = calendarAreaRef.current;
    if (!el || typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;

    const next = Math.max(240, Math.floor(vh - rect.bottom));
    setBottomSheetHeightPx(next);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = calendarAreaRef.current;
    if (!el) return;

    updateBottomSheetHeight();

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updateBottomSheetHeight())
        : null;
    ro?.observe(el);

    window.addEventListener('resize', updateBottomSheetHeight);

    return () => {
      window.removeEventListener('resize', updateBottomSheetHeight);
      ro?.disconnect();
    };
  }, [updateBottomSheetHeight]);

  // 달력 토글 시 즉시 + 트랜지션 완료 후 높이 재계산
  useEffect(() => {
    updateBottomSheetHeight();
    // CSS 트랜지션(300ms) 완료 후 최종 높이 보정
    const t = window.setTimeout(updateBottomSheetHeight, 320);
    return () => window.clearTimeout(t);
  }, [monthCalendarOpen, updateBottomSheetHeight]);

  // 날짜별 스케줄 그룹화 (기간 스케줄 포함)
  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, ScheduleWithPost[]> = {};
    const allSchedules = [
      ...categorizedSchedules.upcoming,
      ...categorizedSchedules.ongoing,
      ...categorizedSchedules.completed,
    ];

    allSchedules.forEach((schedule) => {
      const dates = parseDateString(schedule.date);

      dates.forEach((formattedDate) => {
        if (!grouped[formattedDate]) {
          grouped[formattedDate] = [];
        }
        // 중복 방지
        if (!grouped[formattedDate].some((s) => s.id === schedule.id)) {
          grouped[formattedDate].push(schedule);
        }
      });
    });

    return grouped;
  }, [categorizedSchedules]);

  const getDateStatusClass = (date: Date): string => {
    const key = format(date, 'yyyy-MM-dd');
    const list = schedulesByDate[key] || [];
    if (list.length === 0) return '';

    const hasOngoing = list.some((s) => s.status === 'ongoing');
    const hasUpcoming = list.some((s) => s.status === 'upcoming');
    const hasCompleted = list.some((s) => s.status === 'completed');

    if (hasOngoing)
      return 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100';
    if (hasUpcoming)
      return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100';
    if (hasCompleted)
      return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100';
    return '';
  };

  // 선택된 날짜(없으면 오늘)에 해당하는 스케줄만 노출
  const filteredCategorizedSchedules = useMemo(() => {
    const dateForFilter = selectedDate ?? today;
    const selectedDateStr = format(dateForFilter, 'yyyy-MM-dd');
    const match = (s: ScheduleWithPost) =>
      parseDateString(s.date).includes(selectedDateStr);

    return {
      upcoming: categorizedSchedules.upcoming.filter(match),
      ongoing: categorizedSchedules.ongoing.filter(match),
      completed: categorizedSchedules.completed.filter(match),
      applications: categorizedSchedules.applications.filter(match),
    };
  }, [categorizedSchedules, selectedDate, today]);

  if (!roleHydrated) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            역할 정보를 불러오는 중입니다...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            스탭만 접근할 수 있는 페이지입니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  // 로딩 상태 표시
  if (!isMounted || isLoading) {
    return (
      <div>
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-100px)] overflow-hidden overscroll-none">
      {/* 급여 계산 섹션 */}
      <EarningsSection earnings={earningsData} />

      {/* 달력 영역 (풀-블리드) */}
      <div
        ref={calendarAreaRef}
        className="pb-2 relative left-1/2 w-[100vw] -translate-x-1/2 px-4 select-none touch-none overscroll-none"
        onClickCapture={(e) => {
          if (Date.now() < swipeStateRef.current.blockClickUntil) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onPointerDown={(e) => {
          swipeStateRef.current.isDown = true;
          swipeStateRef.current.isSwiping = false;
          swipeStateRef.current.hasPointerCapture = false;
          swipeStateRef.current.startX = e.clientX;
          swipeStateRef.current.startY = e.clientY;
        }}
        onPointerMove={(e) => {
          if (!swipeStateRef.current.isDown) return;
          const dx = e.clientX - swipeStateRef.current.startX;
          const dy = e.clientY - swipeStateRef.current.startY;
          if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
            swipeStateRef.current.isSwiping = true;
            if (!swipeStateRef.current.hasPointerCapture) {
              try {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                swipeStateRef.current.hasPointerCapture = true;
              } catch {
                // ignore
              }
            }
            e.preventDefault();
          }
        }}
        onPointerUp={(e) => {
          if (!swipeStateRef.current.isDown) return;
          swipeStateRef.current.isDown = false;
          const dx = e.clientX - swipeStateRef.current.startX;
          const dy = e.clientY - swipeStateRef.current.startY;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            swipeStateRef.current.blockClickUntil = Date.now() + 250;
            navigateBySwipe(dx < 0 ? 'next' : 'prev');
          }
          try {
            if (swipeStateRef.current.hasPointerCapture) {
              (e.currentTarget as HTMLElement).releasePointerCapture(
                e.pointerId
              );
            }
          } catch {
            // ignore
          }
          swipeStateRef.current.isSwiping = false;
          swipeStateRef.current.hasPointerCapture = false;
        }}
        onPointerCancel={() => {
          swipeStateRef.current.isDown = false;
          swipeStateRef.current.isSwiping = false;
          swipeStateRef.current.hasPointerCapture = false;
        }}
      >
        {/* 상단: 오늘 + 타이틀(월) + 월간 토글 + 추가 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDateSelect(today)}
            >
              오늘
            </Button>
            <div className="flex items-center">
              <Button
                type="button"
                size="sm"
                variant={'ghost'}
                onClick={() => setMonthCalendarOpen((v) => !v)}
                aria-expanded={monthCalendarOpen}
                aria-controls="month-calendar-panel"
                title="월간(1달) 달력 보기"
                className="px-2"
              >
                <span className="text-sm font-medium">
                  스케줄 관리 ({headerMonthLabel})
                </span>
                {monthCalendarOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddScheduleOpen(true)}
              title="스케줄 추가"
              className="text-muted-foreground rounded-full size-8"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        {/* 날짜 섹션: 7일 버튼 + 월간 확장 */}
        <div className="mb-4">
          <div>
            <div className="flex flex-col items-center justify-center gap-1 min-w-max px-1">
              <div className="flex items-center justify-center gap-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((label) => (
                  <span
                    key={label}
                    className="w-10 text-center text-xs text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* 확장: 현재 주 "위"에 이전 주들 표시 */}
              <div
                ref={aboveWeeksRef}
                id="month-calendar-panel"
                className={cn(
                  'overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out',
                  monthCalendarOpen
                    ? 'max-h-[600px] opacity-100'
                    : 'max-h-0 opacity-0'
                )}
              >
                <div className="flex flex-col items-center justify-center gap-2 pt-2">
                  {expandedAboveWeeks.map((week, wi) => (
                    <div
                      key={`above-${wi}`}
                      className="flex items-center justify-center gap-2"
                    >
                      {week.map((d) => {
                        const selected = selectedDate
                          ? isSameDay(d, selectedDate)
                          : isSameDay(d, today);
                        const inMonth =
                          d.getMonth() === calendarMonth.getMonth();
                        const statusClass =
                          inMonth && !selected ? getDateStatusClass(d) : '';
                        return (
                          <Button
                            key={d.toISOString()}
                            type="button"
                            size="sm"
                            variant={selected ? 'default' : 'outline'}
                            className={cn(
                              'w-10',
                              !selected && (statusClass || 'bg-background'),
                              !inMonth && 'opacity-40'
                            )}
                            onClick={() => handleDateSelect(d)}
                            disabled={!inMonth}
                          >
                            {d.getDate()}
                          </Button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* 항상 표시: 현재 주(중앙) */}
              <div className="flex items-center justify-center gap-2">
                {currentRowDates.map((d) => {
                  const selected = selectedDate
                    ? isSameDay(d, selectedDate)
                    : isSameDay(d, today);
                  const inMonth =
                    !monthCalendarOpen ||
                    d.getMonth() === calendarMonth.getMonth();
                  const statusClass =
                    !selected && (!monthCalendarOpen || inMonth)
                      ? getDateStatusClass(d)
                      : '';
                  return (
                    <Button
                      key={d.toISOString()}
                      type="button"
                      size="sm"
                      variant={selected ? 'default' : 'outline'}
                      className={cn(
                        'w-10',
                        !selected && (statusClass || 'bg-background'),
                        !inMonth && 'opacity-40'
                      )}
                      onClick={() => handleDateSelect(d)}
                      disabled={monthCalendarOpen && !inMonth}
                    >
                      {d.getDate()}
                    </Button>
                  );
                })}
              </div>

              {/* 확장: 현재 주 "아래"에 이후 주들 표시 */}
              <div
                ref={belowWeeksRef}
                className={cn(
                  'overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out',
                  monthCalendarOpen
                    ? 'max-h-[600px] opacity-100'
                    : 'max-h-0 opacity-0'
                )}
              >
                <div className="flex flex-col items-center justify-center gap-2 pt-2">
                  {expandedBelowWeeks.map((week, wi) => (
                    <div
                      key={`below-${wi}`}
                      className="flex items-center justify-center gap-2"
                    >
                      {week.map((d) => {
                        const selected = selectedDate
                          ? isSameDay(d, selectedDate)
                          : isSameDay(d, today);
                        const inMonth =
                          d.getMonth() === calendarMonth.getMonth();
                        const statusClass =
                          inMonth && !selected ? getDateStatusClass(d) : '';
                        return (
                          <Button
                            key={d.toISOString()}
                            type="button"
                            size="sm"
                            variant={selected ? 'default' : 'outline'}
                            className={cn(
                              'w-10',
                              !selected && (statusClass || 'bg-background'),
                              !inMonth && 'opacity-40'
                            )}
                            onClick={() => handleDateSelect(d)}
                            disabled={!inMonth}
                          >
                            {d.getDate()}
                          </Button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 바텀시트(카드뷰 목록) */}
      <BottomSheet heightPx={bottomSheetHeightPx}>
        <CardView
          categorizedSchedules={filteredCategorizedSchedules}
          onScheduleClick={handleScheduleClick}
        />
      </BottomSheet>

      {/* 스케줄 상세 모달 */}
      {selectedSchedule && (
        <ScheduleDetailModal
          schedule={selectedSchedule}
          onClose={() => {
            setSelectedSchedule(null);
          }}
          onRefresh={fetchData}
        />
      )}

      {/* 개인 스케줄 추가 모달(+ 버튼) */}
      {addScheduleOpen && (
        <AddPersonalScheduleModal
          selectedDate={selectedDate ?? today}
          onClose={() => setAddScheduleOpen(false)}
          onSuccess={() => {
            setAddScheduleOpen(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

interface CardViewProps {
  categorizedSchedules: {
    upcoming: ScheduleWithPost[];
    ongoing: ScheduleWithPost[];
    completed: ScheduleWithPost[];
    applications: ScheduleWithPost[];
  };
  onScheduleClick: (schedule: ScheduleWithPost) => void;
}

function CardView({ categorizedSchedules, onScheduleClick }: CardViewProps) {
  const approvedCount =
    categorizedSchedules.upcoming.length +
    categorizedSchedules.ongoing.length +
    categorizedSchedules.completed.length;

  return (
    <Accordion type="multiple" defaultValue={['applications', 'approved']} className="mt-3">
      {/* 전체 지원 목록 */}
      <AccordionItem value="applications">
        <AccordionTrigger className="py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">전체 지원 목록</span>
            <Badge variant="outline" className="text-xs">
              {categorizedSchedules.applications.length}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {categorizedSchedules.applications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              지원한 공고가 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {categorizedSchedules.applications.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onClick={() => onScheduleClick(schedule)}
                  showApplicationStatus
                  compact
                />
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* 승인된 스케줄 */}
      <AccordionItem value="approved">
        <AccordionTrigger className="py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">승인된 스케줄</span>
            <Badge variant="outline" className="text-xs">
              {approvedCount}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            {/* 예정 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-blue-500" />
                <span className="text-sm font-medium">예정</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {categorizedSchedules.upcoming.length}
                </Badge>
              </div>
              {categorizedSchedules.upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  예정된 스케줄이 없습니다
                </p>
              ) : (
                categorizedSchedules.upcoming.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onClick={() => onScheduleClick(schedule)}
                    compact
                  />
                ))
              )}
            </div>

            {/* 진행중 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-orange-500" />
                <span className="text-sm font-medium">진행중</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {categorizedSchedules.ongoing.length}
                </Badge>
              </div>
              {categorizedSchedules.ongoing.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  진행중인 스케줄이 없습니다
                </p>
              ) : (
                categorizedSchedules.ongoing.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onClick={() => onScheduleClick(schedule)}
                    compact
                  />
                ))
              )}
            </div>

            {/* 완료 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-500" />
                <span className="text-sm font-medium">완료</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {categorizedSchedules.completed.length}
                </Badge>
              </div>
              {categorizedSchedules.completed.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  완료된 스케줄이 없습니다
                </p>
              ) : (
                categorizedSchedules.completed.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onClick={() => onScheduleClick(schedule)}
                    compact
                  />
                ))
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

interface CalendarViewProps {
  schedulesByDate: Record<string, ScheduleWithPost[]>;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  onScheduleClick: (schedule: ScheduleWithPost) => void;
  onRefresh: () => void;
}

// NOTE: 이전 달력뷰 UI는 현재 미사용(카드뷰/바텀시트로 통일)
export function CalendarView({
  schedulesByDate,
  selectedDate,
  onDateSelect,
  onScheduleClick,
  onRefresh,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);

  // 선택된 날짜의 스케줄 필터링
  const selectedDateSchedules = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return schedulesByDate[dateStr] || [];
  }, [selectedDate, schedulesByDate]);

  const handleAddSchedule = () => {
    if (!selectedDate) {
      toast.error('날짜를 먼저 선택해주세요');
      return;
    }
    setIsAddScheduleOpen(true);
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 캘린더 */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <ScheduleCalendar
                schedulesByDate={schedulesByDate}
                selectedDate={selectedDate}
                onDateSelect={onDateSelect}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
            </CardContent>
          </Card>
        </div>

        {/* 선택된 날짜의 스케줄 목록 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="size-5" />
                  {selectedDate
                    ? format(selectedDate, 'yyyy년 MM월 dd일', { locale: ko })
                    : '날짜를 선택하세요'}
                </CardTitle>
                {selectedDate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddSchedule}
                    className="flex items-center gap-1"
                  >
                    <Plus className="size-4" />
                    행사추가
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedDateSchedules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {selectedDate
                    ? '해당 날짜에 스케줄이 없습니다'
                    : '캘린더에서 날짜를 선택하세요'}
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDateSchedules.map((schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      onClick={() => onScheduleClick(schedule)}
                      compact
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 개인 스케줄 추가 모달 */}
      {isAddScheduleOpen && selectedDate && (
        <AddPersonalScheduleModal
          selectedDate={selectedDate}
          onClose={() => setIsAddScheduleOpen(false)}
          onSuccess={() => {
            setIsAddScheduleOpen(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

interface ScheduleCardProps {
  schedule: ScheduleWithPost;
  onClick: () => void;
  compact?: boolean;
  showApplicationStatus?: boolean;
}

function ScheduleCard({
  schedule,
  onClick,
  compact = false,
  showApplicationStatus = false,
}: ScheduleCardProps) {
  const statusConfig = {
    upcoming: { label: '예정', className: 'bg-blue-100 text-blue-700' },
    ongoing: { label: '진행중', className: 'bg-orange-100 text-orange-700' },
    completed: { label: '완료', className: 'bg-green-100 text-green-700' },
  };

  const applicationStatusConfig = {
    pending: {
      label: '대기중',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    accepted: {
      label: '승인됨',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    rejected: {
      label: '거절됨',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
  };

  const payTypeConfig = {
    hourly: {
      label: '시급',
      className: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    daily: {
      label: '일급',
      className: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    },
    weekly: {
      label: '주급',
      className: 'bg-pink-100 text-pink-700 border-pink-200',
    },
    monthly: {
      label: '월급',
      className: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
  };

  const config = statusConfig[schedule.status];
  const applicationStatus = (schedule as PostWithApplicationStatus)
    .applicationStatus;
  const appStatusConfig = applicationStatus
    ? applicationStatusConfig[applicationStatus]
    : null;
  const payType = (schedule as PostWithApplicationStatus).payType || 'daily';
  const payTypeLabel = payTypeConfig[payType];

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        compact && 'mb-2'
      )}
      onClick={onClick}
    >
      <CardHeader className={cn('pb-3', compact && 'pb-2')}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className={cn('font-semibold truncate', compact && 'text-sm')}
              title={schedule.title}
            >
              {schedule.title}
            </h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {!showApplicationStatus && (
                <Badge className={cn('text-xs', config.className)}>
                  {config.label}
                </Badge>
              )}
              {showApplicationStatus && appStatusConfig && (
                <Badge
                  variant="outline"
                  className={cn('text-xs', appStatusConfig.className)}
                >
                  {appStatusConfig.label}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn('text-xs', payTypeLabel.className)}
              >
                {payTypeLabel.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn('pt-0', compact && 'pt-0')}>
        <div
          className={cn('space-y-2 text-sm', compact && 'space-y-1 text-xs')}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarIcon className="size-4" />
            <span>{schedule.date}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4" />
            <span>{schedule.time}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>📍</span>
            <span className="truncate">{schedule.location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>💰</span>
            <span>
              {payType === 'hourly'
                ? `${(schedule.salary * calculateWorkHours(schedule.time)).toLocaleString()}원 (시급 ${schedule.salary.toLocaleString()}원)`
                : payType === 'weekly'
                  ? `${schedule.salary.toLocaleString()}원 (주급)`
                  : payType === 'monthly'
                    ? `${schedule.salary.toLocaleString()}원 (월급)`
                    : `${schedule.salary.toLocaleString()}원 (일급)`
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ScheduleDetailModalProps {
  schedule: ScheduleWithPost;
  onClose: () => void;
  onRefresh: () => void;
}

interface EarningsSectionProps {
  earnings: {
    thisWeek: number;
    thisMonth: number;
    accumulated: number;
    thisWeekCount: number;
    thisMonthCount: number;
    accumulatedCount: number;
  };
}

function EarningsSection({ earnings }: EarningsSectionProps) {
  const formatWon = (value: number) =>
    new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(
      Math.round(value || 0)
    );

  return (
    <div className="flex items-center gap-3 px-1 mb-2 py-2 overflow-x-auto scroll-none bg-background w-full justify-around">
      <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
        <Wallet className="size-4 text-blue-600" />
        <span className="text-muted-foreground">주</span>
        <span className="font-semibold">{formatWon(earnings.thisWeek)}원</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
        <TrendingUp className="size-4 text-green-600" />
        <span className="text-muted-foreground">월</span>
        <span className="font-semibold">{formatWon(earnings.thisMonth)}원</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
        <DollarSign className="size-4 text-purple-600" />
        <span className="text-muted-foreground">누적</span>
        <span className="font-semibold">
          {formatWon(earnings.accumulated)}원
        </span>
      </div>
    </div>
  );
}

function ScheduleDetailModal({
  schedule,
  onClose,
  onRefresh,
}: ScheduleDetailModalProps) {
  const isPersonalSchedule = schedule.id.startsWith('personal-');
  const personalScheduleId = isPersonalSchedule
    ? schedule.id.replace('personal-', '')
    : null;

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // time에서 시작/종료 시간 분리
  const parseTime = (timeStr: string) => {
    const match = timeStr.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (match) {
      return { startTime: match[1], endTime: match[2] };
    }
    return { startTime: '', endTime: '' };
  };

  const { startTime, endTime } = parseTime(schedule.time);

  const [formData, setFormData] = useState({
    title: schedule.title,
    date: schedule.date,
    startTime: startTime,
    endTime: endTime,
    location: schedule.location || '',
    payType: ((schedule as PostWithApplicationStatus).payType || 'daily') as
      | 'hourly'
      | 'daily'
      | 'weekly'
      | 'monthly',
    payAmount: schedule.salary?.toString() || '',
    description: schedule.description || '',
    managerName: schedule.managerInfo?.name || '',
    managerContactType: (schedule.managerInfo?.contactType || 'phone') as 'phone' | 'kakao' | 'email' | 'other',
    managerPhone: schedule.managerInfo?.phone || '',
  });

  const statusConfig = {
    upcoming: { label: '예정', className: 'bg-blue-100 text-blue-700' },
    ongoing: { label: '진행중', className: 'bg-orange-100 text-orange-700' },
    completed: { label: '완료', className: 'bg-green-100 text-green-700' },
  };

  const config = statusConfig[schedule.status];

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setIsDeleting(true);
    try {
      if (isPersonalSchedule && personalScheduleId) {
        const result = await deletePersonalScheduleAction(personalScheduleId);
        if (result.ok) {
          toast.success(result.message);
          onRefresh();
          onClose();
        } else {
          toast.error(result.message);
        }
      } else if (schedule.applicationId) {
        const result = await cancelApplicationAction(schedule.applicationId);
        if (result.ok) {
          toast.success(result.message);
          onRefresh();
          onClose();
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      toast.error('삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async () => {
    if (!personalScheduleId) return;

    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast.error('제목, 시작 시간, 종료 시간은 필수 입력 항목입니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updatePersonalScheduleAction(personalScheduleId, {
        title: formData.title,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        payType: formData.payType,
        payAmount: formData.payAmount,
        description: formData.description,
        managerName: formData.managerName,
        managerContactType: formData.managerContactType,
        managerPhone: formData.managerPhone,
      });

      if (result.ok) {
        toast.success(result.message);
        onRefresh();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Failed to update schedule:', error);
      toast.error('수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              {isEditMode ? (
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="text-xl font-semibold"
                  placeholder="제목"
                />
              ) : (
                <DialogTitle className="text-xl">{schedule.title}</DialogTitle>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isPersonalSchedule && !isEditMode && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center gap-1"
                >
                  <Pencil className="size-4" />
                  수정
                </Button>
              )}
              {isPersonalSchedule && isEditMode && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditMode(false)}
                  className="flex items-center gap-1"
                >
                  <X className="size-4" />
                  취소
                </Button>
              )}
            </div>
          </div>
          {!isEditMode && (
            <div className="flex items-center gap-2 mt-2">
              <Badge className={cn('text-xs', config.className)}>
                {config.label}
              </Badge>
              {isPersonalSchedule && (
                <Badge
                  variant="outline"
                  className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                >
                  개인 일정
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 업무 정보 */}
          <div>
            <h3 className="font-semibold mb-2">업무 정보</h3>
            {isEditMode ? (
              <div className="space-y-3">
                {/* 날짜 */}
                <div>
                  <Label htmlFor="edit-date">날짜</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
                {/* 시간 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-startTime">시작 시간</Label>
                    <Input
                      id="edit-startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-endTime">종료 시간</Label>
                    <Input
                      id="edit-endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                    />
                  </div>
                </div>
                {/* 장소 */}
                <div>
                  <Label htmlFor="edit-location">장소</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="장소"
                  />
                </div>
                {/* 급여 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-payType">급여 타입</Label>
                    <Select
                      value={formData.payType}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          payType: value as
                            | 'hourly'
                            | 'daily'
                            | 'weekly'
                            | 'monthly',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">시급</SelectItem>
                        <SelectItem value="daily">일급</SelectItem>
                        <SelectItem value="weekly">주급</SelectItem>
                        <SelectItem value="monthly">월급</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-payAmount">급여 (원)</Label>
                    <Input
                      id="edit-payAmount"
                      type="number"
                      value={formData.payAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, payAmount: e.target.value })
                      }
                      placeholder="급여"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="size-4" />
                  <span>{schedule.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4" />
                  <span>{schedule.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{schedule.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💰</span>
                  <span>
                    {(() => {
                      const pt = (schedule as PostWithApplicationStatus).payType || 'daily';
                      if (pt === 'hourly') {
                        const hours = calculateWorkHours(schedule.time);
                        return `${(schedule.salary * hours).toLocaleString()}원 (시급 ${schedule.salary.toLocaleString()}원 × ${hours}h)`;
                      }
                      const label = pt === 'weekly' ? '주급' : pt === 'monthly' ? '월급' : '일급';
                      return `${schedule.salary.toLocaleString()}원 (${label})`;
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 업무 내용 */}
          <div>
            <h3 className="font-semibold mb-2">업무 내용</h3>
            {isEditMode ? (
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="업무 내용"
                className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {schedule.description || '없음'}
              </p>
            )}
          </div>

          {/* 담당자 정보 */}
          <div>
            <h3 className="font-semibold mb-2">담당자 정보</h3>
            {isEditMode ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-managerName">이름</Label>
                  <Input
                    id="edit-managerName"
                    value={formData.managerName}
                    onChange={(e) =>
                      setFormData({ ...formData, managerName: e.target.value })
                    }
                    placeholder="담당자 이름"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contactType">연락처 유형</Label>
                  <Select
                    value={formData.managerContactType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        managerContactType: value as 'phone' | 'kakao' | 'email' | 'other',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">전화번호</SelectItem>
                      <SelectItem value="kakao">카카오톡 ID</SelectItem>
                      <SelectItem value="email">이메일</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-managerPhone">연락처</Label>
                  <Input
                    id="edit-managerPhone"
                    type={formData.managerContactType === 'email' ? 'email' : formData.managerContactType === 'phone' ? 'tel' : 'text'}
                    value={formData.managerPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, managerPhone: e.target.value })
                    }
                    placeholder={
                      formData.managerContactType === 'phone' ? '010-1234-5678'
                      : formData.managerContactType === 'kakao' ? '카카오톡 ID'
                      : formData.managerContactType === 'email' ? 'example@email.com'
                      : '연락처 정보'
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <div>이름: {schedule.managerInfo?.name || '없음'}</div>
                <div>
                  {schedule.managerInfo?.contactType === 'kakao' ? '카카오톡' : schedule.managerInfo?.contactType === 'email' ? '이메일' : schedule.managerInfo?.contactType === 'other' ? '연락처' : '전화번호'}
                  : {schedule.managerInfo?.phone || '없음'}
                </div>
              </div>
            )}
          </div>

          {/* 참고사항 (수정 모드가 아닐 때만 표시) */}
          {!isEditMode && schedule.notes && (
            <div>
              <h3 className="font-semibold mb-2">참고사항</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {schedule.notes}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {isEditMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditMode(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? '저장 중...' : '저장'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1"
              >
                <Trash2 className="size-4" />
                {isDeleting ? '삭제 중...' : '스케줄 삭제'}
              </Button>
              <Button variant="outline" onClick={onClose}>
                닫기
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 개인 스케줄 추가 모달
type DateMode = 'single' | 'range' | 'multi';

interface ScheduleSlot {
  date: string;
  startTime: string;
  endTime: string;
}

interface AddPersonalScheduleModalProps {
  selectedDate: Date;
  onClose: () => void;
  onSuccess: () => void;
}

function AddPersonalScheduleModal({
  selectedDate,
  onClose,
  onSuccess,
}: AddPersonalScheduleModalProps) {
  const [dateMode, setDateMode] = useState<DateMode>('single');
  const [selectedSingleDate, setSelectedSingleDate] = useState<Date | undefined>(selectedDate);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(undefined);
  const [multiDraftDate, setMultiDraftDate] = useState<Date | undefined>(undefined);
  const [multiDraftStart, setMultiDraftStart] = useState('09:00');
  const [multiDraftEnd, setMultiDraftEnd] = useState('18:00');
  const [multiSlots, setMultiSlots] = useState<ScheduleSlot[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    location: '',
    payType: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    payAmount: '',
    description: '',
    managerName: '',
    managerContactType: 'phone' as 'phone' | 'kakao' | 'email' | 'other',
    managerPhone: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 현재 선택된 날짜들 계산
  const selectedDates = useMemo(() => {
    if (dateMode === 'single') {
      return selectedSingleDate ? [format(selectedSingleDate, 'yyyy-MM-dd')] : [];
    }
    if (dateMode === 'range') {
      const from = selectedRange?.from;
      const to = selectedRange?.to ?? selectedRange?.from;
      if (!from || !to) return from ? [format(from, 'yyyy-MM-dd')] : [];
      return eachDayOfInterval({ start: from, end: to }).map((d) => format(d, 'yyyy-MM-dd'));
    }
    // multi
    return multiSlots.map((s) => s.date).sort();
  }, [dateMode, selectedSingleDate, selectedRange, multiSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error('제목은 필수 입력 항목입니다.');
      return;
    }

    if (dateMode === 'multi') {
      if (multiSlots.length === 0) {
        toast.error('최소 하나의 날짜를 추가해주세요.');
        return;
      }
      const invalid = multiSlots.find((s) => !s.startTime || !s.endTime);
      if (invalid) {
        toast.error('모든 날짜의 시작/종료 시간을 입력해주세요.');
        return;
      }
    } else {
      if (selectedDates.length === 0) {
        toast.error('날짜를 선택해주세요.');
        return;
      }
      if (!formData.startTime || !formData.endTime) {
        toast.error('시작 시간과 종료 시간은 필수 입력 항목입니다.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (dateMode === 'multi') {
        // multi: 날짜별 개별 시간
        const schedules = multiSlots.map((slot) => ({
          title: formData.title,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          location: formData.location,
          payType: formData.payType,
          payAmount: formData.payAmount,
          description: formData.description,
          managerName: formData.managerName,
          managerContactType: formData.managerContactType,
          managerPhone: formData.managerPhone,
        }));
        const result = await createPersonalSchedulesBulkAction(schedules);
        if (result.ok) {
          toast.success(result.message);
          onSuccess();
        } else {
          toast.error(result.message);
        }
      } else if (selectedDates.length === 1) {
        // single date
        const result = await createPersonalScheduleAction({
          title: formData.title,
          date: selectedDates[0],
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          payType: formData.payType,
          payAmount: formData.payAmount,
          description: formData.description,
          managerName: formData.managerName,
          managerContactType: formData.managerContactType,
          managerPhone: formData.managerPhone,
        });
        if (result.ok) {
          toast.success(result.message);
          onSuccess();
        } else {
          toast.error(result.message);
        }
      } else {
        // range: 같은 시간으로 여러 날짜
        const schedules = selectedDates.map((date) => ({
          title: formData.title,
          date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          payType: formData.payType,
          payAmount: formData.payAmount,
          description: formData.description,
          managerName: formData.managerName,
          managerContactType: formData.managerContactType,
          managerPhone: formData.managerPhone,
        }));
        const result = await createPersonalSchedulesBulkAction(schedules);
        if (result.ok) {
          toast.success(result.message);
          onSuccess();
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error('Failed to create personal schedule:', error);
      toast.error('스케줄 추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>개인 스케줄 추가</DialogTitle>
          <DialogDescription>
            날짜와 시간을 선택하여 스케줄을 추가합니다
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 제목 */}
          <div>
            <Label htmlFor="ps-title">
              제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ps-title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="예: 카페 아르바이트"
              required
            />
          </div>

          {/* 기간 타입 선택 */}
          <div>
            <Label>날짜 선택</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button
                type="button"
                size="sm"
                variant={dateMode === 'single' ? 'default' : 'outline'}
                onClick={() => {
                  setDateMode('single');
                  setSelectedRange(undefined);
                  setMultiSlots([]);
                }}
              >
                하루
              </Button>
              <Button
                type="button"
                size="sm"
                variant={dateMode === 'range' ? 'default' : 'outline'}
                onClick={() => {
                  setDateMode('range');
                  setSelectedSingleDate(undefined);
                  setMultiSlots([]);
                }}
              >
                기간
              </Button>
              <Button
                type="button"
                size="sm"
                variant={dateMode === 'multi' ? 'default' : 'outline'}
                onClick={() => {
                  setDateMode('multi');
                  setSelectedSingleDate(undefined);
                  setSelectedRange(undefined);
                }}
              >
                여러 날짜
              </Button>
              <span className="text-xs text-muted-foreground ml-1">
                {dateMode === 'single'
                  ? '하루만 선택'
                  : dateMode === 'range'
                    ? '시작일~종료일 선택'
                    : '날짜별 시간 지정'}
              </span>
            </div>
          </div>

          {/* 날짜 선택 UI */}
          <div className="rounded-lg border p-3">
            {dateMode === 'single' && (
              <Calendar
                mode="single"
                selected={selectedSingleDate}
                onSelect={(d) => setSelectedSingleDate(d)}
              />
            )}
            {dateMode === 'range' && (
              <Calendar
                mode="range"
                selected={selectedRange}
                onSelect={(range) => setSelectedRange(range)}
              />
            )}
            {dateMode === 'multi' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">날짜 선택</Label>
                    <Calendar
                      mode="single"
                      selected={multiDraftDate}
                      onSelect={(d) => setMultiDraftDate(d)}
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">시간 선택</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">시작</Label>
                          <Input
                            type="time"
                            value={multiDraftStart}
                            onChange={(e) => setMultiDraftStart(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">종료</Label>
                          <Input
                            type="time"
                            value={multiDraftEnd}
                            onChange={(e) => setMultiDraftEnd(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => {
                        if (!multiDraftDate) return;
                        if (!multiDraftStart || !multiDraftEnd) return;
                        const ds = format(multiDraftDate, 'yyyy-MM-dd');
                        setMultiSlots((prev) => {
                          const exists = prev.some((s) => s.date === ds);
                          const next = exists
                            ? prev.map((s) =>
                                s.date === ds
                                  ? { ...s, startTime: multiDraftStart, endTime: multiDraftEnd }
                                  : s
                              )
                            : [...prev, { date: ds, startTime: multiDraftStart, endTime: multiDraftEnd }];
                          return next.sort((a, b) => a.date.localeCompare(b.date));
                        });
                      }}
                      disabled={!multiDraftDate || !multiDraftStart || !multiDraftEnd}
                    >
                      <Plus className="size-4 mr-2" />
                      추가
                    </Button>

                    <div className="rounded-md border p-3">
                      <p className="text-sm font-medium mb-2">추가된 날짜/시간</p>
                      {multiSlots.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          아직 추가된 날짜가 없습니다.
                        </p>
                      ) : (
                        <div className={cn(
                          'space-y-2',
                          multiSlots.length >= 2 && 'max-h-48 overflow-y-auto pr-1'
                        )}>
                          {multiSlots.map((s) => (
                            <div
                              key={s.date}
                              className="flex flex-col md:flex-row md:items-center gap-2 rounded-md border p-2 bg-primary/5 border-primary/20"
                            >
                              <Badge variant="secondary" className="w-fit">
                                {s.date}
                              </Badge>
                              <div className="grid grid-cols-2 gap-2 flex-1">
                                <Input
                                  type="time"
                                  value={s.startTime}
                                  onChange={(e) =>
                                    setMultiSlots((prev) =>
                                      prev.map((sl) =>
                                        sl.date === s.date
                                          ? { ...sl, startTime: e.target.value }
                                          : sl
                                      )
                                    )
                                  }
                                />
                                <Input
                                  type="time"
                                  value={s.endTime}
                                  onChange={(e) =>
                                    setMultiSlots((prev) =>
                                      prev.map((sl) =>
                                        sl.date === s.date
                                          ? { ...sl, endTime: e.target.value }
                                          : sl
                                      )
                                    )
                                  }
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setMultiSlots((prev) => prev.filter((sl) => sl.date !== s.date))
                                }
                                title="삭제"
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 선택된 날짜 요약 */}
          {selectedDates.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                선택 {selectedDates.length}일
              </Badge>
              {selectedDates.slice(0, 10).map((d) => (
                <Badge key={d} variant="secondary" className="text-xs">
                  {d}
                </Badge>
              ))}
              {selectedDates.length > 10 && (
                <span className="text-xs text-muted-foreground">
                  외 {selectedDates.length - 10}일
                </span>
              )}
            </div>
          )}

          {/* 시간 (single/range 모드에서만) */}
          {dateMode !== 'multi' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ps-startTime">
                  시작 시간 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ps-startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="ps-endTime">
                  종료 시간 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ps-endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          )}

          {/* 장소 */}
          <div>
            <Label htmlFor="ps-location">장소</Label>
            <Input
              id="ps-location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="예: 강남역 스타벅스"
            />
          </div>

          {/* 급여 타입 & 급여 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ps-payType">급여 타입</Label>
              <Select
                value={formData.payType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    payType: value as 'hourly' | 'daily' | 'weekly' | 'monthly',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">시급</SelectItem>
                  <SelectItem value="daily">일급</SelectItem>
                  <SelectItem value="weekly">주급</SelectItem>
                  <SelectItem value="monthly">월급</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ps-payAmount">급여 (원)</Label>
              <Input
                id="ps-payAmount"
                type="number"
                value={formData.payAmount}
                onChange={(e) =>
                  setFormData({ ...formData, payAmount: e.target.value })
                }
                placeholder="예: 10000"
              />
            </div>
          </div>

          {/* 업무 내용 */}
          <div>
            <Label htmlFor="ps-description">업무 내용</Label>
            <textarea
              id="ps-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="업무 내용을 입력하세요"
              className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* 담당자 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ps-managerName">담당자 이름</Label>
              <Input
                id="ps-managerName"
                value={formData.managerName}
                onChange={(e) =>
                  setFormData({ ...formData, managerName: e.target.value })
                }
                placeholder="예: 김매니저"
              />
            </div>
            <div>
              <Label htmlFor="ps-contactType">연락처 유형</Label>
              <Select
                value={formData.managerContactType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    managerContactType: value as 'phone' | 'kakao' | 'email' | 'other',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">전화번호</SelectItem>
                  <SelectItem value="kakao">카카오톡 ID</SelectItem>
                  <SelectItem value="email">이메일</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="ps-managerPhone">담당자 연락처</Label>
            <Input
              id="ps-managerPhone"
              type={formData.managerContactType === 'email' ? 'email' : formData.managerContactType === 'phone' ? 'tel' : 'text'}
              value={formData.managerPhone}
              onChange={(e) =>
                setFormData({ ...formData, managerPhone: e.target.value })
              }
              placeholder={
                formData.managerContactType === 'phone' ? '010-1234-5678'
                : formData.managerContactType === 'kakao' ? '카카오톡 ID'
                : formData.managerContactType === 'email' ? 'example@email.com'
                : '연락처 정보'
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
