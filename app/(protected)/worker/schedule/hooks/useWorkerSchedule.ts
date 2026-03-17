'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { parseDateString } from '@/lib/dateUtils';
import { getMySchedulesAction, getPersonalSchedulesAction } from '../actions';
import {
  getPerDatePayItems,
  parseEndTime,
  supabasePostToPost,
} from '../utils/scheduleUtils';
import type {
  ScheduleWithPost,
  PostWithApplicationStatus,
  CategorizedSchedules,
  EarningsData,
  SupabasePost,
} from '../types';

interface WorkerScheduleData {
  workerPosts: PostWithApplicationStatus[];
  personalSchedules: PostWithApplicationStatus[];
  currentUserId: string | null;
}

async function fetchWorkerScheduleData(): Promise<WorkerScheduleData> {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  const currentUserId = authData.user?.id ?? null;

  if (!currentUserId) {
    return { workerPosts: [], personalSchedules: [], currentUserId: null };
  }

  const [schedulesResult, personalResult] = await Promise.all([
    getMySchedulesAction(),
    getPersonalSchedulesAction(),
  ]);

  const workerPosts =
    schedulesResult.ok && schedulesResult.data
      ? schedulesResult.data
          .filter((schedule) => schedule.posts !== null)
          .map((schedule) => {
            const post = schedule.posts!;
            return supabasePostToPost({
              ...post,
              post_id: post.post_id,
              application_id: schedule.member_schedule_id,
              applied_at: schedule.created_at,
              application_status: schedule.status,
            } as unknown as SupabasePost);
          })
      : [];

  const personalSchedules =
    personalResult.ok && personalResult.data
      ? personalResult.data.map((schedule: Record<string, unknown>) => {
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
              (schedule.pay_type as 'hourly' | 'daily' | 'weekly' | 'monthly') || 'daily',
          } as PostWithApplicationStatus;
        })
      : [];

  return { workerPosts, personalSchedules, currentUserId };
}

export function useWorkerSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [addScheduleOpen, setAddScheduleOpen] = useState(false);
  const [bottomSheetHeightPx, setBottomSheetHeightPx] = useState<number>(
    typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.65) : 0
  );
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithPost | null>(null);
  const [monthCalendarOpen, setMonthCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const calendarAreaRef = useRef<HTMLDivElement | null>(null);
  const aboveWeeksRef = useRef<HTMLDivElement | null>(null);
  const belowWeeksRef = useRef<HTMLDivElement | null>(null);
  const monthCalendarOpenRef = useRef(monthCalendarOpen);

  useEffect(() => {
    monthCalendarOpenRef.current = monthCalendarOpen;
  }, [monthCalendarOpen]);

  const { data, isLoading, isSuccess, refetch: fetchData } = useQuery({
    queryKey: ['worker', 'schedule'],
    queryFn: fetchWorkerScheduleData,
  });

  const isMounted = isSuccess;
  const workerPosts = data?.workerPosts ?? [];
  const personalSchedules = data?.personalSchedules ?? [];

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const categorizedSchedules = useMemo((): CategorizedSchedules => {
    if (!isMounted) {
      return { upcoming: [], ongoing: [], completed: [], applications: [] };
    }

    const now = new Date();
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const upcoming: ScheduleWithPost[] = [];
    const ongoing: ScheduleWithPost[] = [];
    const completed: ScheduleWithPost[] = [];
    const applications: ScheduleWithPost[] = [];

    const allPosts = [...workerPosts, ...personalSchedules];

    allPosts.forEach((post) => {
      const applicationSchedule: ScheduleWithPost = {
        ...post,
        status: 'upcoming',
        applicationStatus: post.applicationStatus,
      };
      applications.push(applicationSchedule);

      if (post.applicationStatus !== 'accepted') return;

      const dates = parseDateString(post.date);
      if (dates.length === 0) return;

      const scheduleWithPost: ScheduleWithPost = {
        ...post,
        status: 'upcoming',
        applicationStatus: post.applicationStatus,
      };

      const endTime = parseEndTime(post.time);
      const isRangeSchedule = post.date.includes('~');

      if (isRangeSchedule) {
        const firstDate = parseISO(dates[0]);
        const lastDate = parseISO(dates[dates.length - 1]);
        firstDate.setHours(0, 0, 0, 0);
        lastDate.setHours(0, 0, 0, 0);
        if (endTime) {
          lastDate.setHours(endTime.hours, endTime.minutes, 0, 0);
        } else {
          lastDate.setHours(23, 59, 59, 999);
        }

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
        const parsedDates = dates.map((dateStr) => {
          const d = parseISO(dateStr);
          d.setHours(0, 0, 0, 0);
          return d;
        });

        const parsedDatesWithEndTime = parsedDates.map((date) => {
          const dateWithTime = new Date(date);
          if (endTime) {
            dateWithTime.setHours(endTime.hours, endTime.minutes, 0, 0);
          } else {
            dateWithTime.setHours(23, 59, 59, 999);
          }
          return dateWithTime;
        });

        const futureDates = parsedDatesWithEndTime.filter((date) => date > now);
        const pastDates = parsedDatesWithEndTime.filter((date) => date < now);
        const todayDates = parsedDates.filter(
          (date) => date.getTime() === todayDate.getTime()
        );

        const ongoingToday =
          todayDates.length > 0 &&
          parsedDatesWithEndTime.some(
            (date) =>
              date.getTime() >= todayDate.getTime() &&
              date.getTime() < todayDate.getTime() + 86400000 &&
              date > now
          );

        if (ongoingToday) {
          scheduleWithPost.status = 'ongoing';
          ongoing.push(scheduleWithPost);
        } else if (pastDates.length > 0 && futureDates.length > 0) {
          scheduleWithPost.status = 'ongoing';
          ongoing.push(scheduleWithPost);
        } else if (futureDates.length > 0) {
          scheduleWithPost.status = 'upcoming';
          upcoming.push(scheduleWithPost);
        } else {
          scheduleWithPost.status = 'completed';
          completed.push(scheduleWithPost);
        }
      }
    });

    return { upcoming, ongoing, completed, applications };
  }, [workerPosts, personalSchedules, isMounted]);

  const groupedScheduleEvents = useMemo(() => {
    const acceptedWorkerSchedules = workerPosts.filter(
      (post) => post.applicationStatus === 'accepted'
    );

    type DailyItem = { dateStr: string; workHours: number; dailyPay: number };
    type ScheduleEvent = {
      id: string;
      dates: string[];
      salary: number;
      payType: 'hourly' | 'daily' | 'weekly' | 'monthly';
      time: string;
      dailyItems: DailyItem[];
    };

    const events: ScheduleEvent[] = [];

    acceptedWorkerSchedules.forEach((post) => {
      const dates = parseDateString(post.date);
      if (dates.length === 0) return;
      const items = getPerDatePayItems({
        date: post.date,
        time: post.time,
        salary: post.salary || 0,
        payType: post.payType,
        workSlots: post.workSlots,
      });
      events.push({
        id: post.id,
        dates,
        salary: post.salary || 0,
        payType: (post.payType || 'daily') as ScheduleEvent['payType'],
        time: post.time,
        dailyItems: items.map(({ dateStr, workHours, payAmount }) => ({
          dateStr,
          workHours,
          dailyPay: payAmount,
        })),
      });
    });

    const personalGroups = new Map<
      string,
      { dates: string[]; salary: number; payType: ScheduleEvent['payType']; time: string; ids: string[] }
    >();

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
      const uniqueDates = Array.from(new Set(group.dates)).sort();
      const dateStrForParse =
        uniqueDates.length === 1 ? uniqueDates[0] : uniqueDates.join(', ');
      const items = getPerDatePayItems({
        date: dateStrForParse,
        time: group.time,
        salary: group.salary,
        payType: group.payType,
      });
      events.push({
        id: `personal-group-${key}`,
        dates: uniqueDates,
        salary: group.salary,
        payType: group.payType,
        time: group.time,
        dailyItems: items.map(({ dateStr, workHours, payAmount }) => ({
          dateStr,
          workHours,
          dailyPay: payAmount,
        })),
      });
    });

    return events;
  }, [workerPosts, personalSchedules]);

  const earningsData = useMemo((): EarningsData => {
    if (!isMounted) {
      return {
        thisWeek: 0,
        thisMonth: 0,
        thisYear: 0,
        thisWeekCount: 0,
        thisMonthCount: 0,
        thisYearCount: 0,
      };
    }

    const baseDate = selectedDate ?? today;
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(baseDate, { weekStartsOn: 0 });
    const monthStart = startOfMonth(baseDate);
    const monthEnd = endOfMonth(baseDate);
    const yearStart = startOfYear(baseDate);
    const yearEnd = endOfYear(baseDate);

    let thisWeekEarnings = 0;
    let thisMonthEarnings = 0;
    let thisYearEarnings = 0;
    let thisWeekCount = 0;
    let thisMonthCount = 0;
    let thisYearCount = 0;

    groupedScheduleEvents.forEach((event) => {
      const { dailyItems } = event;
      if (dailyItems.length === 0) return;

      dailyItems.forEach((item) => {
        try {
          const scheduleDate = parseISO(item.dateStr);
          if (isWithinInterval(scheduleDate, { start: weekStart, end: weekEnd })) {
            thisWeekEarnings += item.dailyPay;
            thisWeekCount++;
          }
          if (isWithinInterval(scheduleDate, { start: monthStart, end: monthEnd })) {
            thisMonthEarnings += item.dailyPay;
            thisMonthCount++;
          }
          if (isWithinInterval(scheduleDate, { start: yearStart, end: yearEnd })) {
            thisYearEarnings += item.dailyPay;
            thisYearCount++;
          }
        } catch {
          // skip
        }
      });
    });

    return {
      thisWeek: thisWeekEarnings,
      thisMonth: thisMonthEarnings,
      thisYear: thisYearEarnings,
      thisWeekCount,
      thisMonthCount,
      thisYearCount,
    };
  }, [groupedScheduleEvents, isMounted, selectedDate, today]);

  const focusedDate = selectedDate ?? today;

  const weekStart = useMemo(
    () => startOfWeek(focusedDate, { weekStartsOn: 0 }),
    [focusedDate]
  );

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const monthWeeks = useMemo(() => {
    const mStart = startOfMonth(calendarMonth);
    const mEnd = endOfMonth(calendarMonth);
    const gridStart = startOfWeek(mStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(mEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [calendarMonth]);

  const currentWeekIndexInMonth = useMemo(() => {
    const idx = monthWeeks.findIndex((w) => w.some((d) => isSameDay(d, focusedDate)));
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

  const headerMonthLabel = useMemo(() => {
    const base = monthCalendarOpen ? calendarMonth : focusedDate;
    return format(base, 'yyyy.MM');
  }, [monthCalendarOpen, calendarMonth, focusedDate]);

  const updateBottomSheetHeight = useCallback(() => {
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

  useEffect(() => {
    updateBottomSheetHeight();
    const t = window.setTimeout(updateBottomSheetHeight, 320);
    return () => window.clearTimeout(t);
  }, [monthCalendarOpen, updateBottomSheetHeight]);

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
        if (!grouped[formattedDate].some((s) => s.id === schedule.id)) {
          grouped[formattedDate].push(schedule);
        }
      });
    });

    return grouped;
  }, [categorizedSchedules]);

  const getDateStatusClass = useCallback(
    (date: Date): string => {
      const key = format(date, 'yyyy-MM-dd');
      const list = schedulesByDate[key] || [];
      if (list.length === 0) return '';

      const hasOngoing = list.some((s) => s.status === 'ongoing');
      const hasUpcoming = list.some((s) => s.status === 'upcoming');
      const hasCompleted = list.some((s) => s.status === 'completed');

      if (hasOngoing) return 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100';
      if (hasUpcoming) return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100';
      if (hasCompleted) return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100';
      return '';
    },
    [schedulesByDate]
  );

  const filteredCategorizedSchedules = useMemo((): CategorizedSchedules => {
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

  const handleScheduleClick = useCallback((schedule: ScheduleWithPost) => {
    setSelectedSchedule(schedule);
  }, []);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSchedule(null);
  }, []);

  const navigateBySwipe = useCallback(
    (direction: 'prev' | 'next') => {
      if (monthCalendarOpenRef.current) {
        const next = addMonths(focusedDate, direction === 'next' ? 1 : -1);
        handleDateSelect(next);
        setCalendarMonth(next);
        return;
      }
      handleDateSelect(addDays(focusedDate, direction === 'next' ? 7 : -7));
    },
    [focusedDate, handleDateSelect]
  );

  return {
    selectedDate,
    addScheduleOpen,
    setAddScheduleOpen,
    bottomSheetHeightPx,
    selectedSchedule,
    setSelectedSchedule,
    isMounted,
    isLoading,
    monthCalendarOpen,
    setMonthCalendarOpen,
    today,
    calendarAreaRef,
    aboveWeeksRef,
    belowWeeksRef,
    earningsData,
    filteredCategorizedSchedules,
    currentRowDates,
    expandedAboveWeeks,
    expandedBelowWeeks,
    headerMonthLabel,
    calendarMonth,
    handleScheduleClick,
    handleDateSelect,
    navigateBySwipe,
    getDateStatusClass,
    fetchData,
  };
}
