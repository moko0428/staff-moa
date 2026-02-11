'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import ScheduleCalendar from '@/app/components/ScheduleCalendar';
import { Post, AttendanceReview } from '@/types/mockData';
import { getMyPostsAction } from '@/app/(features)/(protected)/my-post/actions';
import { createClient } from '@/utils/supabase/client';
import {
  CheckCircle2,
  Clock,
  Users,
  Star,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
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
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { parseDateString } from '@/lib/dateUtils';
import { Separator } from '@/app/components/Separator';
import { ScheduleStatusLegend } from '@/app/components/ScheduleStatusLegend';
import { BottomSheet } from '@/app/components/mobile/BottomSheet';
import ScheduleDetailModal from '../components/ScheduleDetailModal';
import type { ScheduleWithPost } from '../types/scheduleTypes';

type ViewType = 'card' | 'calendar';

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
};

function supabasePostToPost(supabasePost: SupabasePost): Post {
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
      phone: supabasePost.manager_phone,
    },
    recruitCount: supabasePost.recruit_count,
    currentApplicants: 0, // TODO: applications 테이블이 생성되면 실제 데이터로 교체
    notes: supabasePost.notes || undefined,
    requirements: supabasePost.qualifications || undefined,
    preferences: supabasePost.preferences || undefined,
    createdAt: supabasePost.created_at,
    updatedAt: supabasePost.updated_at,
  };
}

export default function SchedulePage() {
  const router = useRouter();
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const effectiveRole = role ?? null;
  const isManager = effectiveRole === 'manager';
  const isPendingManager = effectiveRole === 'pending_manager';
  const viewType: ViewType = 'card';
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bottomSheetHeightPx, setBottomSheetHeightPx] = useState<number>(
    typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.75) : 0
  );
  const [selectedSchedule, setSelectedSchedule] =
    useState<ScheduleWithPost | null>(null);
  const [selectedDetailSchedule, setSelectedDetailSchedule] =
    useState<ScheduleWithPost | null>(null); // 추가
  const [addScheduleOpen, setAddScheduleOpen] = useState(false);
  const [monthCalendarOpen, setMonthCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [reviews, setReviews] = useState<AttendanceReview[]>([]); // TODO: attendance_reviews 테이블이 생성되면 실제 데이터로 교체
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [managerPosts, setManagerPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applicantsData, setApplicantsData] = useState<
    Record<
      string,
      Array<{
        userId: string;
        userName: string;
        applicationId: string;
        avatar?: string;
        phone?: string;
        kakaoId?: string;
        gender?: string;
      }>
    >
  >({});

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

  // 매니저의 공고 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      if (!currentUserId) return;

      setIsLoading(true);
      try {
        const result = await getMyPostsAction();
        if (result.ok && result.data) {
          const convertedPosts = result.data.map((post) =>
            supabasePostToPost(post as SupabasePost)
          );
          setManagerPosts(convertedPosts);

          // 각 포스트별 승인된 지원자 가져오기
          const supabase = createClient();
          const applicantsMap: Record<
            string,
            Array<{
              userId: string;
              userName: string;
              applicationId: string;
              avatar?: string;
              phone?: string;
              kakaoId?: string;
              gender?: string;
            }>
          > = {};

          await Promise.all(
            convertedPosts.map(async (post) => {
              try {
                // 승인된 지원자 조회
                const postIdNum = Number(post.id);
                if (isNaN(postIdNum)) {
                  console.error(`Invalid post ID: ${post.id}`);
                  return;
                }
                const { data: schedules } = await supabase
                  .from('member_schedules')
                  .select('member_schedule_id, member_id')
                  .eq('post_id', postIdNum)
                  .eq('status', 'accepted');

                if (schedules && schedules.length > 0) {
                  const memberIds = schedules.map((s) => s.member_id);

                  // 프로필 정보 조회
                  const { data: profiles } = await supabase
                    .from('profiles')
                    .select('user_id, name, avatar, phone, kakao_id, gender')
                    .in('user_id', memberIds);

                  if (profiles) {
                    applicantsMap[post.id] = schedules.map((schedule) => {
                      const profile = profiles.find(
                        (p) => p.user_id === schedule.member_id
                      );
                      return {
                        userId: schedule.member_id,
                        userName: profile?.name || '알 수 없음',
                        applicationId: schedule.member_schedule_id.toString(),
                        avatar: profile?.avatar || undefined,
                        phone: profile?.phone || undefined,
                        kakaoId: profile?.kakao_id || undefined,
                        gender: profile?.gender || undefined,
                      };
                    });
                  }
                }
              } catch (error) {
                console.error(
                  `Failed to fetch applicants for post ${post.id}:`,
                  error
                );
              }
            })
          );

          setApplicantsData(applicantsMap);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        setManagerPosts([]);
      } finally {
        setIsLoading(false);
        setIsMounted(true);
      }
    };

    if (currentUserId) {
      fetchPosts();
    }
  }, [currentUserId]);

  // 스케줄 상태 분류
  const categorizedSchedules = useMemo(() => {
    // 클라이언트에서 마운트되지 않았으면 빈 배열 반환
    if (!isMounted) {
      return { upcoming: [], ongoing: [], completed: [] };
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: ScheduleWithPost[] = [];
    const ongoing: ScheduleWithPost[] = [];
    const completed: ScheduleWithPost[] = [];

    managerPosts.forEach((post) => {
      // date 필드를 파싱하여 날짜 배열로 변환
      const dates = parseDateString(post.date);
      if (dates.length === 0) return; // 유효한 날짜가 없으면 스킵

      // 실제 승인된 지원자 데이터 가져오기
      const postApplicants = applicantsData[post.id] || [];

      const participants = postApplicants.map((app) => {
        const review = reviews.find(
          (r) => r.postId === post.id && r.userId === app.userId
        );
        return {
          ...app,
          review,
        };
      });

      const scheduleWithPost: ScheduleWithPost = {
        ...post,
        // 모집 인원 정보와 카드(참여자 수)를 동기화하기 위해
        // currentApplicants를 실제 참여자 수로 재설정
        currentApplicants: participants.length,
        status: 'upcoming',
        participants,
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

    return { upcoming, ongoing, completed };
  }, [managerPosts, reviews, isMounted, applicantsData]);

  const handleScheduleClick = (schedule: ScheduleWithPost) => {
    if (schedule.status === 'completed') {
      setSelectedSchedule(schedule);
    } else {
      // 예정/진행중 스케줄은 상세 모달 표시
      setSelectedDetailSchedule(schedule);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    // 날짜 클릭 시 모달을 열지 않고 목록에만 표시
    setSelectedSchedule(null);
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

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

  const goToday = () => {
    handleDateSelect(today);
  };

  const calendarAreaRef = React.useRef<HTMLDivElement | null>(null);
  const aboveWeeksRef = React.useRef<HTMLDivElement | null>(null);
  const belowWeeksRef = React.useRef<HTMLDivElement | null>(null);
  const monthCalendarOpenRef = React.useRef(monthCalendarOpen);

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

  React.useEffect(() => {
    monthCalendarOpenRef.current = monthCalendarOpen;
  }, [monthCalendarOpen]);

  const updateBottomSheetHeight = React.useCallback(() => {
    const el = calendarAreaRef.current;
    if (!el || typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;

    // 실제 달력 영역 하단 기준으로 바텀시트 높이 계산
    // 월간 달력: 달력이 크므로 바텀시트 높이가 작아짐
    // 주간 달력: 달력이 작으므로 바텀시트가 위로 올라감 (높이가 커짐)
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

  // 월간/주간 전환 시 CSS 트랜지션(300ms) 완료 후 바텀시트 높이 재계산
  useEffect(() => {
    const t = window.setTimeout(updateBottomSheetHeight, 320);
    return () => window.clearTimeout(t);
  }, [monthCalendarOpen, updateBottomSheetHeight]);

  useEffect(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setCalendarMonth(selectedDate);
    }
  }, [selectedDate]);

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

  // 카드뷰: 선택된 날짜(없으면 오늘)에 해당하는 스케줄만 노출
  const filteredCategorizedSchedules = useMemo(() => {
    const dateForFilter = selectedDate ?? today;
    const selectedDateStr = format(dateForFilter, 'yyyy-MM-dd');
    const match = (s: ScheduleWithPost) =>
      parseDateString(s.date).includes(selectedDateStr);

    return {
      upcoming: categorizedSchedules.upcoming.filter(match),
      ongoing: categorizedSchedules.ongoing.filter(match),
      completed: categorizedSchedules.completed.filter(match),
    };
  }, [categorizedSchedules, selectedDate, today]);

  const handleReviewSubmit = (
    postId: string,
    userId: string,
    score: number,
    comment: string
  ) => {
    const existingReview = reviews.find(
      (r) => r.postId === postId && r.userId === userId
    );

    if (existingReview) {
      // 기존 리뷰 업데이트
      setReviews(
        reviews.map((r) =>
          r.id === existingReview.id
            ? { ...r, score, comment, updatedAt: new Date().toISOString() }
            : r
        )
      );
    } else {
      // 새 리뷰 생성
      const newReview: AttendanceReview = {
        id: `rev-${Date.now()}`,
        postId,
        userId,
        score,
        comment,
        reviewedBy: currentUserId || 'manager-1',
        createdAt: new Date().toISOString(),
      };
      setReviews([...reviews, newReview]);
    }

    // 선택된 스케줄 업데이트
    if (selectedSchedule) {
      setSelectedSchedule({
        ...selectedSchedule,
        participants: selectedSchedule.participants.map((p) =>
          p.userId === userId
            ? {
                ...p,
                review: existingReview
                  ? { ...existingReview, score, comment }
                  : {
                      id: `rev-${Date.now()}`,
                      postId,
                      userId,
                      score,
                      comment,
                      reviewedBy: currentUserId || 'manager-1',
                      createdAt: new Date().toISOString(),
                    },
              }
            : p
        ),
      });
    }
  };

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

  if (!isManager) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {isPendingManager
              ? '관리자 승인 후에 접근할 수 있습니다. 프로필을 완성하고 재요청을 진행해주세요.'
              : '관리자 승인이 필요한 매니저 전용 페이지입니다.'}
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
    <div className="relative h-[calc(100vh-100px)] overflow-hidden">
      <div
        ref={calendarAreaRef}
        className="pb-2 relative left-1/2 w-[100vw] -translate-x-1/2 px-4 select-none touch-pan-y"
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
                (e.currentTarget as HTMLElement).setPointerCapture(
                  e.pointerId
                );
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
        {/* 상단: 이번주 + 오늘/추가 + 뷰 토글 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" onClick={goToday}>
              오늘
            </Button>
            <div className="flex items-center">
              <p className="text-sm font-medium">
                스케줄 관리 ({headerMonthLabel})
              </p>
              <Button
                type="button"
                size="sm"
                variant={'ghost'}
                onClick={() => setMonthCalendarOpen((v) => !v)}
                aria-expanded={monthCalendarOpen}
                aria-controls="month-calendar-panel"
                title="월간(1달) 달력 보기"
              >
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

        {/* 날짜 섹션: 7일 버튼 + 1주 이동 */}
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
                <div className="flex flex-col items-center justify-center gap-2">
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
                <div className="flex flex-col items-center justify-center gap-2">
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

      {viewType === 'card' ? (
        <BottomSheet heightPx={bottomSheetHeightPx}>
          <CardView
            categorizedSchedules={filteredCategorizedSchedules}
            onScheduleClick={handleScheduleClick}
          />
        </BottomSheet>
      ) : (
        <div className="h-full overflow-y-auto">
          <CalendarView
            schedulesByDate={schedulesByDate}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onScheduleClick={handleScheduleClick}
          />
        </div>
      )}

      {/* 근태 평가 모달 */}
      {selectedSchedule && (
        <AttendanceReviewModal
          schedule={selectedSchedule}
          onClose={() => {
            setSelectedSchedule(null);
            setSelectedDate(undefined);
          }}
          onSubmit={handleReviewSubmit}
        />
      )}

      {/* 스케줄 상세 모달 - 새로 추가 */}
      {selectedDetailSchedule && (
        <ScheduleDetailModal
          schedule={selectedDetailSchedule}
          onClose={() => setSelectedDetailSchedule(null)}
        />
      )}

      {/* 스케줄 추가 모달 */}
      <Dialog open={addScheduleOpen} onOpenChange={setAddScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>스케줄 추가</DialogTitle>
            <DialogDescription>
              선택한 날짜에 스케줄을 추가하려면 공고를 작성해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 text-sm">
            <p className="text-muted-foreground">선택 날짜</p>
            <p className="font-medium">
              {format(focusedDate, 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddScheduleOpen(false)}
            >
              닫기
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/my-post/create')}
            >
              공고 작성하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CardViewProps {
  categorizedSchedules: {
    upcoming: ScheduleWithPost[];
    ongoing: ScheduleWithPost[];
    completed: ScheduleWithPost[];
  };
  onScheduleClick: (schedule: ScheduleWithPost) => void;
}

function CardView({ categorizedSchedules, onScheduleClick }: CardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
      <ScheduleStatusColumn
        title="예정 스케줄"
        icon={<Clock className="size-5 text-blue-500" />}
        schedules={categorizedSchedules.upcoming}
        onScheduleClick={onScheduleClick}
        clickableCompleted={false}
      />
      <ScheduleStatusColumn
        title="진행중 스케줄"
        icon={<CalendarIcon className="size-5 text-orange-500" />}
        schedules={categorizedSchedules.ongoing}
        onScheduleClick={onScheduleClick}
        clickableCompleted={false}
      />
      <ScheduleStatusColumn
        title="완료된 스케줄"
        icon={<CheckCircle2 className="size-5 text-green-500" />}
        schedules={categorizedSchedules.completed}
        onScheduleClick={onScheduleClick}
        clickableCompleted={true}
      />
    </div>
  );
}

interface ScheduleStatusColumnProps {
  title: string;
  icon: React.ReactNode;
  schedules: ScheduleWithPost[];
  onScheduleClick: (schedule: ScheduleWithPost) => void;
  clickableCompleted: boolean;
}

function ScheduleStatusColumn({
  title,
  icon,
  schedules,
  onScheduleClick,
  clickableCompleted,
}: ScheduleStatusColumnProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-3 overflow-x-auto pb-2 md:block md:overflow-x-visible">
          {schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-0 w-full">
              스케줄이 없습니다.
            </p>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="min-w-[300px] md:min-w-0 md:mb-2"
              >
                <ScheduleItem
                  schedule={schedule}
                  onClick={() => onScheduleClick(schedule)}
                  clickable={clickableCompleted}
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CalendarViewProps {
  schedulesByDate: Record<string, ScheduleWithPost[]>;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  onScheduleClick: (schedule: ScheduleWithPost) => void;
}

function CalendarView({
  schedulesByDate,
  selectedDate,
  onDateSelect,
  onScheduleClick,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // 상단 네비게이션(-/+) 등으로 selectedDate가 바뀌면 달력 월도 함께 이동
  useEffect(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

  // 날짜의 스케줄 상태 확인
  const getDateStatus = (
    date: Date
  ): 'upcoming' | 'ongoing' | 'completed' | null => {
    // 유효한 Date 객체인지 확인
    if (!date || isNaN(date.getTime())) {
      return null;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const schedules = schedulesByDate[dateStr] || [];
    if (schedules.length === 0) return null;

    const hasUpcoming = schedules.some((s) => s.status === 'upcoming');
    const hasOngoing = schedules.some((s) => s.status === 'ongoing');
    const hasCompleted = schedules.some((s) => s.status === 'completed');

    if (hasOngoing) return 'ongoing';
    if (hasCompleted) return 'completed';
    if (hasUpcoming) return 'upcoming';
    return null;
  };

  // 현재 달의 모든 스케줄 가져오기
  const currentMonthSchedules = useMemo(() => {
    const scheduleSet = new Set<string>(); // 중복 방지를 위한 Set
    const allSchedules: ScheduleWithPost[] = [];
    const currentYear = currentMonth.getFullYear();
    const currentMonthNum = currentMonth.getMonth();

    Object.entries(schedulesByDate).forEach(([dateStr, schedules]) => {
      try {
        const scheduleDate = parseISO(dateStr);
        if (
          scheduleDate.getFullYear() === currentYear &&
          scheduleDate.getMonth() === currentMonthNum
        ) {
          // 현재 달에 속하는 날짜의 스케줄들 추가 (중복 제거)
          schedules.forEach((schedule) => {
            if (!scheduleSet.has(schedule.id)) {
              scheduleSet.add(schedule.id);
              allSchedules.push(schedule);
            }
          });
        }
      } catch {
        // 날짜 파싱 실패 시 무시
      }
    });

    // 날짜순으로 정렬
    return allSchedules.sort((a, b) => {
      const datesA = parseDateString(a.date);
      const datesB = parseDateString(b.date);
      if (datesA.length === 0 || datesB.length === 0) return 0;

      try {
        // 완료된 스케줄은 마지막 날짜 기준, 나머지는 첫 번째 날짜 기준
        const dateA = parseISO(
          a.status === 'completed' ? datesA[datesA.length - 1] : datesA[0]
        );
        const dateB = parseISO(
          b.status === 'completed' ? datesB[datesB.length - 1] : datesB[0]
        );
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    });
  }, [schedulesByDate, currentMonth]);

  const selectedDateStr = selectedDate
    ? format(selectedDate, 'yyyy-MM-dd')
    : null;
  const selectedDateSchedules = selectedDateStr
    ? schedulesByDate[selectedDateStr] || []
    : [];

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 달력 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>스케줄 달력</CardTitle>
            </CardHeader>
            {/* 달력 아래 설명(범례) 영역 */}
            <CardContent>
              <ScheduleStatusLegend />
            </CardContent>
            <div className="px-6">
              <Separator />
            </div>
            {/* 모바일에서 카드가 수축되지 않도록 h-full 제거, 고정 최소 높이만 사용 */}
            <CardContent className="pb-4 min-h-[360px] sm:min-h-[420px]">
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

        {/* 스케줄 목록 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate
                  ? format(selectedDate, 'yyyy년 MM월 dd일', { locale: ko })
                  : format(currentMonth, 'yyyy년 MM월', { locale: ko }) +
                    ' 스케줄'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[260px] md:max-h-[320px] overflow-y-auto">
              {selectedDate ? (
                // 선택된 날짜의 스케줄
                selectedDateSchedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    선택한 날짜에 스케줄이 없습니다.
                  </p>
                ) : (
                  selectedDateSchedules
                    .map((schedule) => {
                      // 선택된 날짜가 스케줄의 날짜 범위에 포함되는지 확인
                      const dates = parseDateString(schedule.date);
                      const isInRange = dates.includes(selectedDateStr || '');

                      if (!isInRange) return null;

                      // dates[0]이 유효한지 확인하고 parseISO
                      let statusDate: Date | null = null;
                      if (dates[0]) {
                        try {
                          statusDate = parseISO(dates[0]);
                          if (isNaN(statusDate.getTime())) {
                            statusDate = null;
                          }
                        } catch {
                          statusDate = null;
                        }
                      }

                      // selectedDateStr이 있으면 그것을 사용
                      if (!statusDate && selectedDateStr) {
                        try {
                          statusDate = parseISO(selectedDateStr);
                          if (isNaN(statusDate.getTime())) {
                            statusDate = null;
                          }
                        } catch {
                          statusDate = null;
                        }
                      }

                      const status = statusDate
                        ? getDateStatus(statusDate)
                        : null;
                      const isClickable = status === 'completed';

                      return (
                        <ScheduleItem
                          key={schedule.id}
                          schedule={schedule}
                          onClick={() => onScheduleClick(schedule)}
                          clickable={isClickable}
                        />
                      );
                    })
                    .filter(Boolean)
                )
              ) : (
                // 현재 달의 모든 스케줄을 날짜별로 그룹화
                (() => {
                  const groupedByDate: Record<string, ScheduleWithPost[]> = {};
                  const currentYear = currentMonth.getFullYear();
                  const currentMonthNum = currentMonth.getMonth();

                  currentMonthSchedules.forEach((schedule) => {
                    const dates = parseDateString(schedule.date);

                    // 날짜에 따라 표시 위치 결정
                    let targetDate: string | null = null;

                    if (dates.length === 1) {
                      // 당일 스케줄: 해당 날짜에 표시
                      targetDate = dates[0];
                    } else if (dates.length > 1) {
                      // 기간 스케줄: 상태에 따라 첫날 또는 마지막날
                      if (schedule.status === 'completed') {
                        targetDate = dates[dates.length - 1]; // 완료: 마지막날
                      } else {
                        targetDate = dates[0]; // 예정/진행중: 첫날
                      }
                    }

                    // targetDate가 현재 달에 속하는지 확인
                    if (targetDate) {
                      try {
                        const targetDateObj = parseISO(targetDate);
                        if (
                          targetDateObj.getFullYear() === currentYear &&
                          targetDateObj.getMonth() === currentMonthNum
                        ) {
                          if (!groupedByDate[targetDate]) {
                            groupedByDate[targetDate] = [];
                          }
                          // 중복 방지
                          if (
                            !groupedByDate[targetDate].some(
                              (s) => s.id === schedule.id
                            )
                          ) {
                            groupedByDate[targetDate].push(schedule);
                          }
                        }
                      } catch {
                        // 날짜 파싱 실패 시 무시
                      }
                    }
                  });

                  const sortedDates = Object.keys(groupedByDate).sort();

                  return sortedDates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      이번 달에 스케줄이 없습니다.
                    </p>
                  ) : (
                    sortedDates.map((dateStr) => {
                      const schedules = groupedByDate[dateStr];
                      const date = parseISO(dateStr);

                      return (
                        <div key={dateStr} className="space-y-2">
                          <div className="flex items-center justify-between pb-2 border-b">
                            <h4 className="font-semibold text-sm">
                              {format(date, 'MM월 dd일 (E)', { locale: ko })}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {schedules.length}개
                            </Badge>
                          </div>
                          {schedules.map((schedule) => {
                            // schedule.date를 직접 parseISO하지 말고 parseDateString 사용
                            const dates = parseDateString(schedule.date);
                            let statusDate: Date | null = null;

                            if (dates[0]) {
                              try {
                                statusDate = parseISO(dates[0]);
                                if (isNaN(statusDate.getTime())) {
                                  statusDate = null;
                                }
                              } catch {
                                statusDate = null;
                              }
                            }

                            const status = statusDate
                              ? getDateStatus(statusDate)
                              : null;
                            const isClickable = status === 'completed';

                            return (
                              <ScheduleItem
                                key={schedule.id}
                                schedule={schedule}
                                onClick={() => onScheduleClick(schedule)}
                                clickable={isClickable}
                              />
                            );
                          })}
                        </div>
                      );
                    })
                  );
                })()
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface ScheduleItemProps {
  schedule: ScheduleWithPost;
  onClick: () => void;
  clickable?: boolean;
}

function ScheduleItem({ schedule, onClick, clickable }: ScheduleItemProps) {
  const statusBadge = {
    upcoming: {
      label: '예정',
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    ongoing: {
      label: '진행중',
      className: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    completed: {
      label: '완료',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
  }[schedule.status];

  // 모든 스케줄 클릭 가능하도록 변경
  const isClickable = clickable || schedule.status !== 'completed';

  return (
    <div
      className={`p-3 border rounded-lg ${
        isClickable
          ? 'cursor-pointer hover:bg-muted hover:border-primary transition-colors'
          : ''
      }`}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className={cn('text-xs', statusBadge.className)}
            >
              {statusBadge.label}
            </Badge>
            <h3 className="font-semibold text-sm truncate">{schedule.title}</h3>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-1">
              <CalendarIcon className="size-3 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">
                {(() => {
                  const dates = parseDateString(schedule.date);
                  if (dates.length === 0) return schedule.date;

                  if (dates.length === 1) {
                    return format(parseISO(dates[0]), 'yyyy.MM.dd (E)', {
                      locale: ko,
                    });
                  } else if (schedule.date.includes('~')) {
                    const firstDate = format(parseISO(dates[0]), 'MM.dd', {
                      locale: ko,
                    });
                    const lastDate = format(
                      parseISO(dates[dates.length - 1]),
                      'MM.dd (E)',
                      { locale: ko }
                    );
                    return `${firstDate} ~ ${lastDate}`;
                  } else {
                    return `${format(parseISO(dates[0]), 'MM.dd', {
                      locale: ko,
                    })} 외 ${dates.length - 1}일`;
                  }
                })()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {schedule.time}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">📍</span>
              <span className="text-xs text-muted-foreground">
                {schedule.location}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Users className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              참여자: {schedule.participants.length}명
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AttendanceReviewModalProps {
  schedule: ScheduleWithPost;
  onClose: () => void;
  onSubmit: (
    postId: string,
    userId: string,
    score: number,
    comment: string
  ) => void;
}

function AttendanceReviewModal({
  schedule,
  onClose,
  onSubmit,
}: AttendanceReviewModalProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<
    ScheduleWithPost['participants'][0] | null
  >(null);
  const [reviewData, setReviewData] = useState<{
    score: number;
    comment: string;
  }>({ score: 0, comment: '' });

  const handleScoreChange = (score: number) => {
    setReviewData((prev) => ({ ...prev, score }));
  };

  const handleCommentChange = (comment: string) => {
    setReviewData((prev) => ({ ...prev, comment }));
  };

  const handleSubmit = () => {
    if (
      selectedParticipant &&
      reviewData.score > 0 &&
      reviewData.comment.trim()
    ) {
      onSubmit(
        schedule.id,
        selectedParticipant.userId,
        reviewData.score,
        reviewData.comment
      );
      // 평가 후 목록으로 돌아가기
      setSelectedParticipant(null);
      setReviewData({ score: 0, comment: '' });
    }
  };

  const handleSelectParticipant = (
    participant: ScheduleWithPost['participants'][0]
  ) => {
    setSelectedParticipant(participant);
    // 기존 평가가 있으면 불러오기
    setReviewData({
      score: participant.review?.score || 0,
      comment: participant.review?.comment || '',
    });
  };

  const handleBack = () => {
    setSelectedParticipant(null);
    setReviewData({ score: 0, comment: '' });
  };

  // schedule.date를 파싱하여 표시할 날짜 문자열 생성
  const getScheduleDateDisplay = () => {
    const dates = parseDateString(schedule.date);
    if (dates.length === 0) return '';

    if (dates.length === 1) {
      return format(parseISO(dates[0]), 'yyyy년 MM월 dd일', { locale: ko });
    } else {
      const firstDate = format(parseISO(dates[0]), 'yyyy년 MM월 dd일', {
        locale: ko,
      });
      const lastDate = format(parseISO(dates[dates.length - 1]), 'MM월 dd일', {
        locale: ko,
      });
      return `${firstDate} ~ ${lastDate}`;
    }
  };

  const canSubmit =
    reviewData.score > 0 && reviewData.comment.trim().length > 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            근태 평가 - {schedule.title}
            {selectedParticipant && ` > ${selectedParticipant.userName}`}
          </DialogTitle>
          <DialogDescription>
            {getScheduleDateDisplay()}{' '}
            {selectedParticipant
              ? '지원자의 근태를 평가해주세요.'
              : '평가할 참여자를 선택해주세요.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedParticipant ? (
            // 1단계: 지원자 목록
            schedule.participants.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                참여한 지원자가 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {schedule.participants.map((participant) => {
                  const isReviewed = participant.review !== undefined;

                  return (
                    <Card
                      key={participant.userId}
                      className="p-4 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handleSelectParticipant(participant)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold text-primary">
                              {participant.userName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold">
                              {participant.userName}
                            </h4>
                            {isReviewed && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <Star className="size-3 fill-yellow-400 text-yellow-400" />
                                <span>
                                  평가 완료: {participant.review?.score}점
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isReviewed ? (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                            >
                              평가 완료
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-orange-600 border-orange-600"
                            >
                              평가 대기
                            </Badge>
                          )}
                          <ChevronRight className="size-5 text-muted-foreground" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          ) : (
            // 2단계: 개별 평가 폼
            <div className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-2"
              >
                <ChevronLeft className="size-4 mr-1" />
                목록으로 돌아가기
              </Button>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-lg text-primary">
                      {selectedParticipant.userName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">
                      {selectedParticipant.userName}
                    </h4>
                    {selectedParticipant.review && (
                      <Badge variant="outline" className="mt-1">
                        <Star className="size-3 mr-1" />
                        기존 평가: {selectedParticipant.review.score}점
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="score">
                      점수 <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleScoreChange(star * 20)}
                          className={`p-1 ${
                            reviewData.score >= star * 20
                              ? 'text-yellow-400'
                              : 'text-muted-foreground/50'
                          } hover:text-yellow-400 transition-colors`}
                        >
                          <Star className="size-8 fill-current" />
                        </button>
                      ))}
                      <span className="ml-2 text-lg font-semibold text-foreground">
                        {reviewData.score}점
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="comment">
                      평가 내용 <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id="comment"
                      className="w-full min-h-[150px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mt-2"
                      value={reviewData.comment}
                      onChange={(e) => handleCommentChange(e.target.value)}
                      placeholder="근무 태도, 시간 준수, 책임감 등을 평가해주세요."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                    >
                      취소
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                    >
                      {selectedParticipant.review ? '평가 수정' : '평가 저장'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// (ScheduleDetailModal 컴포넌트는 ./components/ScheduleDetailModal 로 분리)
