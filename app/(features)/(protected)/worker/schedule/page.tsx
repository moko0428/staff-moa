'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useUserStore } from '@/store/useUserStore';
import * as React from 'react';
import Hero from '@/app/components/Hero';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
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
import { Post } from '@/types/mockData';
import {
  getMySchedulesAction,
  createPersonalScheduleAction,
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
} from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { parseDateString } from '@/lib/dateUtils';
import { ScheduleViewToggle } from '@/app/components/ScheduleViewToggle';
import { ScheduleStatusLegend } from '@/app/components/ScheduleStatusLegend';

type ViewType = 'card' | 'calendar';

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

function supabasePostToPost(supabasePost: SupabasePost): PostWithApplicationStatus {
  const firstSlot = Array.isArray(supabasePost.work_slots) && supabasePost.work_slots.length > 0
    ? supabasePost.work_slots[0]
    : null;

  // work_slots에서 날짜들을 추출하여 date 문자열 생성
  let dateStr = '';
  if (Array.isArray(supabasePost.work_slots) && supabasePost.work_slots.length > 0) {
    const dates = supabasePost.work_slots.map(slot => slot.date).filter(Boolean);
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
    workSlots: supabasePost.work_slots?.map(slot => ({
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
  const [viewType, setViewType] = useState<ViewType>('card');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSchedule, setSelectedSchedule] =
    useState<ScheduleWithPost | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [workerPosts, setWorkerPosts] = useState<PostWithApplicationStatus[]>([]);
  const [personalSchedules, setPersonalSchedules] = useState<PostWithApplicationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        const convertedPersonalSchedules = personalResult.data.map((schedule: Record<string, unknown>) => {
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
              phone: (schedule.manager_phone as string) || '',
            },
            recruitCount: 0,
            currentApplicants: 0,
            createdAt: schedule.created_at as string,
            updatedAt: schedule.updated_at as string,
            applicationStatus: 'accepted' as const,
            payType: (schedule.pay_type as 'hourly' | 'daily' | 'weekly' | 'monthly') || 'daily',
          } as PostWithApplicationStatus;
        });
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

  // 급여 계산
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
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // 일요일 시작
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    let thisWeekEarnings = 0;
    let thisMonthEarnings = 0;
    let accumulatedEarnings = 0;
    let thisWeekCount = 0;
    let thisMonthCount = 0;
    let accumulatedCount = 0;

    // 주급/월급 중복 방지를 위한 Set
    const weeklyPostsAdded = new Set<string>();
    const monthlyPostsAdded = new Set<string>();
    const accumulatedWeeklyPosts = new Set<string>();
    const accumulatedMonthlyPosts = new Set<string>();

    // 승인된 스케줄만 계산 (accepted) - 지원한 공고 + 개인 스케줄
    const acceptedWorkerSchedules = workerPosts.filter(
      (post) => post.applicationStatus === 'accepted'
    );
    const allAcceptedSchedules = [...acceptedWorkerSchedules, ...personalSchedules];

    allAcceptedSchedules.forEach((post) => {
      const dates = parseDateString(post.date);
      if (dates.length === 0) return;

      const payType = post.payType || 'daily';
      const salary = post.salary || 0;
      const workHours = calculateWorkHours(post.time);

      // 급여 타입별 계산
      if (payType === 'hourly') {
        // 시급: 근무 시간 × 시급
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
          } catch (error) {
            console.error('Error parsing schedule date:', error);
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
          } catch (error) {
            console.error('Error parsing schedule date:', error);
          }
        });
      } else if (payType === 'weekly') {
        // 주급: 해당 주에 근무가 있으면 한 번만 추가
        const hasWorkThisWeek = dates.some((dateStr) => {
          try {
            const scheduleDate = parseISO(dateStr);
            return isWithinInterval(scheduleDate, { start: weekStart, end: weekEnd });
          } catch {
            return false;
          }
        });

        if (hasWorkThisWeek && !weeklyPostsAdded.has(post.id)) {
          thisWeekEarnings += salary;
          thisWeekCount++;
          weeklyPostsAdded.add(post.id);
        }

        const hasWorkThisMonth = dates.some((dateStr) => {
          try {
            const scheduleDate = parseISO(dateStr);
            return isWithinInterval(scheduleDate, { start: monthStart, end: monthEnd });
          } catch {
            return false;
          }
        });

        if (hasWorkThisMonth && !monthlyPostsAdded.has(post.id)) {
          thisMonthEarnings += salary;
          thisMonthCount++;
          monthlyPostsAdded.add(post.id);
        }
      } else if (payType === 'monthly') {
        // 월급: 해당 월에 근무가 있으면 한 번만 추가
        const hasWorkThisMonth = dates.some((dateStr) => {
          try {
            const scheduleDate = parseISO(dateStr);
            return isWithinInterval(scheduleDate, { start: monthStart, end: monthEnd });
          } catch {
            return false;
          }
        });

        if (hasWorkThisMonth && !monthlyPostsAdded.has(post.id)) {
          thisMonthEarnings += salary;
          thisMonthCount++;
          monthlyPostsAdded.add(post.id);
        }
      }

      // 누적 급여는 완료된 스케줄만 계산
      const endTime = parseEndTime(post.time);
      const allDates = dates.map((dateStr) => {
        const d = parseISO(dateStr);
        if (endTime) {
          d.setHours(endTime.hours, endTime.minutes, 0, 0);
        } else {
          d.setHours(23, 59, 59, 999);
        }
        return d;
      });

      // 마지막 날짜가 과거인지 확인
      const lastDate = allDates[allDates.length - 1];
      if (lastDate && lastDate < now) {
        if (payType === 'hourly') {
          // 시급: 근무일 수 × 근무 시간 × 시급
          accumulatedEarnings += salary * workHours * dates.length;
          accumulatedCount += dates.length;
        } else if (payType === 'daily') {
          // 일급: 근무일 수 × 일급
          accumulatedEarnings += salary * dates.length;
          accumulatedCount += dates.length;
        } else if (payType === 'weekly') {
          // 주급: 한 번만 추가
          if (!accumulatedWeeklyPosts.has(post.id)) {
            accumulatedEarnings += salary;
            accumulatedCount++;
            accumulatedWeeklyPosts.add(post.id);
          }
        } else if (payType === 'monthly') {
          // 월급: 한 번만 추가
          if (!accumulatedMonthlyPosts.has(post.id)) {
            accumulatedEarnings += salary;
            accumulatedCount++;
            accumulatedMonthlyPosts.add(post.id);
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
  }, [workerPosts, personalSchedules, isMounted]);

  const handleScheduleClick = (schedule: ScheduleWithPost) => {
    setSelectedSchedule(schedule);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSchedule(null);
  };

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

  if (!roleHydrated) {
    return (
      <div className="space-y-4">
        <Hero title="내 스케줄" description="스탭 전용 페이지" />
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
        <Hero title="내 스케줄" description="스탭 전용 페이지" />
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
        <Hero
          title="내 스케줄"
          description="지원한 공고의 스케줄을 확인하세요"
        />
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Hero
        title="내 스케줄"
        description="지원한 공고의 스케줄을 확인하세요"
      />

      {/* 급여 계산 섹션 */}
      <EarningsSection earnings={earningsData} />

      {/* 뷰 토글 버튼 */}
      <ScheduleViewToggle viewType={viewType} onChange={setViewType} />

      {/* 상태 범례 */}
      <ScheduleStatusLegend />

      {viewType === 'card' ? (
        <CardView
          categorizedSchedules={categorizedSchedules}
          onScheduleClick={handleScheduleClick}
        />
      ) : (
        <CalendarView
          schedulesByDate={schedulesByDate}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onScheduleClick={handleScheduleClick}
          onRefresh={fetchData}
        />
      )}

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
  return (
    <div className="space-y-8 mt-6">
      {/* 승인된 스케줄 (예정/진행중/완료) */}
      <div>
        <h2 className="text-xl font-bold mb-4">승인된 스케줄</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 예정 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-blue-500" />
              <h3 className="text-lg font-semibold">예정</h3>
              <Badge variant="outline" className="ml-auto">
                {categorizedSchedules.upcoming.length}
              </Badge>
            </div>
            {categorizedSchedules.upcoming.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  예정된 스케줄이 없습니다
                </CardContent>
              </Card>
            ) : (
              categorizedSchedules.upcoming.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onClick={() => onScheduleClick(schedule)}
                />
              ))
            )}
          </div>

          {/* 진행중 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-orange-500" />
              <h3 className="text-lg font-semibold">진행중</h3>
              <Badge variant="outline" className="ml-auto">
                {categorizedSchedules.ongoing.length}
              </Badge>
            </div>
            {categorizedSchedules.ongoing.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  진행중인 스케줄이 없습니다
                </CardContent>
              </Card>
            ) : (
              categorizedSchedules.ongoing.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onClick={() => onScheduleClick(schedule)}
                />
              ))
            )}
          </div>

          {/* 완료 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-500" />
              <h3 className="text-lg font-semibold">완료</h3>
              <Badge variant="outline" className="ml-auto">
                {categorizedSchedules.completed.length}
              </Badge>
            </div>
            {categorizedSchedules.completed.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  완료된 스케줄이 없습니다
                </CardContent>
              </Card>
            ) : (
              categorizedSchedules.completed.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onClick={() => onScheduleClick(schedule)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 지원 목록 (모든 지원 내역) */}
      <div>
        <h2 className="text-xl font-bold mb-4">전체 지원 목록</h2>
        <div className="space-y-4">
          {categorizedSchedules.applications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                지원한 공고가 없습니다
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorizedSchedules.applications.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onClick={() => onScheduleClick(schedule)}
                  showApplicationStatus
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CalendarViewProps {
  schedulesByDate: Record<string, ScheduleWithPost[]>;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  onScheduleClick: (schedule: ScheduleWithPost) => void;
  onRefresh: () => void;
}

function CalendarView({
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
      alert('날짜를 먼저 선택해주세요');
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

function ScheduleCard({ schedule, onClick, compact = false, showApplicationStatus = false }: ScheduleCardProps) {
  const statusConfig = {
    upcoming: { label: '예정', className: 'bg-blue-100 text-blue-700' },
    ongoing: { label: '진행중', className: 'bg-orange-100 text-orange-700' },
    completed: { label: '완료', className: 'bg-green-100 text-green-700' },
  };

  const applicationStatusConfig = {
    pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    accepted: { label: '승인됨', className: 'bg-green-100 text-green-700 border-green-200' },
    rejected: { label: '거절됨', className: 'bg-red-100 text-red-700 border-red-200' },
  };

  const payTypeConfig = {
    hourly: { label: '시급', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    daily: { label: '일급', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    weekly: { label: '주급', className: 'bg-pink-100 text-pink-700 border-pink-200' },
    monthly: { label: '월급', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  };

  const config = statusConfig[schedule.status];
  const applicationStatus = (schedule as PostWithApplicationStatus).applicationStatus;
  const appStatusConfig = applicationStatus ? applicationStatusConfig[applicationStatus] : null;
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
            <h3 className={cn('font-semibold truncate', compact && 'text-sm')} title={schedule.title}>
              {schedule.title}
            </h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {!showApplicationStatus && (
                <Badge className={cn('text-xs', config.className)}>
                  {config.label}
                </Badge>
              )}
              {showApplicationStatus && appStatusConfig && (
                <Badge variant="outline" className={cn('text-xs', appStatusConfig.className)}>
                  {appStatusConfig.label}
                </Badge>
              )}
              <Badge variant="outline" className={cn('text-xs', payTypeLabel.className)}>
                {payTypeLabel.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn('pt-0', compact && 'pt-0')}>
        <div className={cn('space-y-2 text-sm', compact && 'space-y-1 text-xs')}>
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
            <span>{schedule.salary.toLocaleString()}원</span>
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
  return (
    <div className="mt-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" />
            급여 계산
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 이번 주 예상 급여 */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="size-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-700">이번 주 예상 급여</h3>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {earnings.thisWeek.toLocaleString()}원
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {earnings.thisWeekCount}개 스케줄
              </p>
            </div>

            {/* 이번 달 예상 급여 */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-4 text-green-600" />
                <h3 className="text-sm font-semibold text-green-700">이번 달 예상 급여</h3>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {earnings.thisMonth.toLocaleString()}원
              </p>
              <p className="text-xs text-green-600 mt-1">
                {earnings.thisMonthCount}개 스케줄
              </p>
            </div>

            {/* 누적 급여 */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="size-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-purple-700">누적 급여 (완료)</h3>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {earnings.accumulated.toLocaleString()}원
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {earnings.accumulatedCount}개 스케줄
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground leading-relaxed">
              💡 <strong>이번 주/달 예상 급여</strong>는 승인된 스케줄을 기준으로 계산됩니다.<br />
              <strong>누적 급여</strong>는 완료된 스케줄만 포함됩니다.<br />
              <strong>급여 타입별 계산:</strong> 시급(근무시간×시급), 일급(근무일수×일급), 주급/월급(해당 기간 1회)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScheduleDetailModal({ schedule, onClose, onRefresh }: ScheduleDetailModalProps) {
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
    payType: ((schedule as PostWithApplicationStatus).payType || 'daily') as 'hourly' | 'daily' | 'weekly' | 'monthly',
    payAmount: schedule.salary?.toString() || '',
    description: schedule.description || '',
    managerName: schedule.managerInfo?.name || '',
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
          alert(result.message);
          onRefresh();
          onClose();
        } else {
          alert(result.message);
        }
      } else if (schedule.applicationId) {
        const result = await cancelApplicationAction(schedule.applicationId);
        if (result.ok) {
          alert(result.message);
          onRefresh();
          onClose();
        } else {
          alert(result.message);
        }
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async () => {
    if (!personalScheduleId) return;

    if (!formData.title || !formData.startTime || !formData.endTime) {
      alert('제목, 시작 시간, 종료 시간은 필수 입력 항목입니다.');
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
        managerPhone: formData.managerPhone,
      });

      if (result.ok) {
        alert(result.message);
        onRefresh();
        onClose();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to update schedule:', error);
      alert('수정에 실패했습니다.');
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
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
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
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-endTime">종료 시간</Label>
                    <Input
                      id="edit-endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
                {/* 장소 */}
                <div>
                  <Label htmlFor="edit-location">장소</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                    <Label htmlFor="edit-payAmount">급여 (원)</Label>
                    <Input
                      id="edit-payAmount"
                      type="number"
                      value={formData.payAmount}
                      onChange={(e) => setFormData({ ...formData, payAmount: e.target.value })}
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
                  <span>{schedule.salary.toLocaleString()}원</span>
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
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    placeholder="담당자 이름"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-managerPhone">연락처</Label>
                  <Input
                    id="edit-managerPhone"
                    type="tel"
                    value={formData.managerPhone}
                    onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                    placeholder="연락처"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <div>이름: {schedule.managerInfo?.name || '없음'}</div>
                <div>연락처: {schedule.managerInfo?.phone || '없음'}</div>
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
  const [formData, setFormData] = useState({
    title: '',
    date: format(selectedDate, 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    location: '',
    payType: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    payAmount: '',
    description: '',
    managerName: '',
    managerPhone: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.title || !formData.startTime || !formData.endTime) {
      alert('제목, 시작 시간, 종료 시간은 필수 입력 항목입니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createPersonalScheduleAction({
        title: formData.title,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        payType: formData.payType,
        payAmount: formData.payAmount,
        description: formData.description,
        managerName: formData.managerName,
        managerPhone: formData.managerPhone,
      });

      if (result.ok) {
        alert(result.message);
        onSuccess();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to create personal schedule:', error);
      alert('스케줄 추가에 실패했습니다.');
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
            {format(selectedDate, 'yyyy년 MM월 dd일 (E)', { locale: ko })} 스케줄을 추가합니다
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 제목 */}
          <div>
            <Label htmlFor="title">
              제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 카페 아르바이트"
              required
            />
          </div>

          {/* 날짜 */}
          <div>
            <Label htmlFor="date">날짜</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">
                시작 시간 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">
                종료 시간 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          {/* 장소 */}
          <div>
            <Label htmlFor="location">장소</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="예: 강남역 스타벅스"
            />
          </div>

          {/* 급여 타입 & 급여 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payType">급여 타입</Label>
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
              <Label htmlFor="payAmount">급여 (원)</Label>
              <Input
                id="payAmount"
                type="number"
                value={formData.payAmount}
                onChange={(e) => setFormData({ ...formData, payAmount: e.target.value })}
                placeholder="예: 10000"
              />
            </div>
          </div>

          {/* 업무 내용 */}
          <div>
            <Label htmlFor="description">업무 내용</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="업무 내용을 입력하세요"
              className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* 담당자 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="managerName">담당자 이름</Label>
              <Input
                id="managerName"
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                placeholder="예: 김매니저"
              />
            </div>
            <div>
              <Label htmlFor="managerPhone">담당자 연락처</Label>
              <Input
                id="managerPhone"
                type="tel"
                value={formData.managerPhone}
                onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                placeholder="예: 010-1234-5678"
              />
            </div>
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
