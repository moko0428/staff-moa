'use client';

import { useState, useMemo, useEffect } from 'react';
import * as React from 'react';
import Hero from '@/components/Hero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import {
  mockPosts,
  mockApplications,
  mockAttendanceReviews,
} from '@/lib/mockData';
import { Post, AttendanceReview } from '@/types/mockData';
import {
  CheckCircle2,
  Clock,
  Users,
  Star,
  LayoutGrid,
  CalendarDays,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { parseDateString } from '@/lib/dateUtils';
import { Separator } from '@/components/Separator';

type ViewType = 'card' | 'calendar';

type ScheduleStatus = 'upcoming' | 'ongoing' | 'completed';

// 날짜 문자열을 날짜 배열로 변환하는 헬퍼 함수
// function parseDateString(dateStr: string): string[] {
//   const trimmed = dateStr.trim();

//   // 기간 스케줄 (시작일~종료일)
//   if (trimmed.includes('~')) {
//     const [startStr, endStr] = trimmed.split('~').map((d) => d.trim());
//     try {
//       const startDate = parseISO(startStr);
//       const endDate = parseISO(endStr);
//       if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
//         const dates = eachDayOfInterval({
//           start: startDate,
//           end: endDate,
//         });
//         return dates.map((date) => format(date, 'yyyy-MM-dd'));
//       }
//     } catch {
//       // 파싱 실패 시 빈 배열 반환
//     }
//     return [];
//   }

//   // 여러 날짜 스케줄 (쉼표로 구분)
//   if (trimmed.includes(',')) {
//     return trimmed
//       .split(',')
//       .map((d) => d.trim())
//       .filter((d) => {
//         try {
//           const date = parseISO(d);
//           return !isNaN(date.getTime());
//         } catch {
//           return false;
//         }
//       });
//   }

//   // 당일 스케줄
//   try {
//     const date = parseISO(trimmed);
//     if (!isNaN(date.getTime())) {
//       return [format(date, 'yyyy-MM-dd')];
//     }
//   } catch {
//     // 파싱 실패 시 빈 배열 반환
//   }

//   return [];
// }

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

export interface ScheduleWithPost extends Omit<Post, 'status'> {
  scheduleId?: string;
  status: ScheduleStatus;
  participants: Array<{
    userId: string;
    userName: string;
    applicationId: string;
    review?: AttendanceReview;
  }>;
}

export default function SchedulePage() {
  const [viewType, setViewType] = useState<ViewType>('card');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSchedule, setSelectedSchedule] =
    useState<ScheduleWithPost | null>(null);
  const [selectedDetailSchedule, setSelectedDetailSchedule] =
    useState<ScheduleWithPost | null>(null); // 추가
  const [reviews, setReviews] = useState<AttendanceReview[]>(
    mockAttendanceReviews
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false); // 추가

  useEffect(() => {
    try {
      const userId =
        typeof window !== 'undefined'
          ? localStorage.getItem('userId') || 'manager-1'
          : 'manager-1';
      setCurrentUserId(userId);
    } catch {
      setCurrentUserId('manager-1');
    }
  }, []);

  // 클라이언트 마운트 확인
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 현재 매니저의 공고만 필터링
  const managerPosts = useMemo(() => {
    return mockPosts.filter(
      (post) => currentUserId && post.authorId === currentUserId
    );
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

      // 해당 공고에 accepted된 지원자들 찾기
      const acceptedApplications = mockApplications.filter(
        (app) => app.postId === post.id && app.status === 'accepted'
      );

      const participants = acceptedApplications.map((app) => {
        const review = reviews.find(
          (r) => r.postId === post.id && r.userId === app.applicantId
        );
        return {
          userId: app.applicantId,
          userName: app.applicantName,
          applicationId: app.id,
          review,
        };
      });

      const scheduleWithPost: ScheduleWithPost = {
        ...post,
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
  }, [managerPosts, reviews, isMounted]);

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

  // 로딩 상태 표시 (옵션)
  if (!isMounted) {
    return (
      <div>
        <Hero
          title="스케줄 관리"
          description="스케줄 정보를 확인하고 근태를 평가하세요"
        />
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Hero
        title="스케줄 관리"
        description="스케줄 정보를 확인하고 근태를 평가하세요"
      />

      {/* 뷰 토글 버튼 */}
      <div className="flex justify-end gap-2 mb-4">
        <Button
          type="button"
          variant={viewType === 'card' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewType('card')}
        >
          <LayoutGrid className="size-4" />
          카드 뷰
        </Button>
        <Button
          type="button"
          variant={viewType === 'calendar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewType('calendar')}
        >
          <CalendarDays className="size-4" />
          달력 뷰
        </Button>
      </div>

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
        />
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
  // 날짜별로 그룹화하는 함수
  const groupByDate = (schedules: ScheduleWithPost[]) => {
    const grouped: Record<string, ScheduleWithPost[]> = {};
    schedules.forEach((schedule) => {
      const dates = parseDateString(schedule.date);

      // 당일 스케줄 또는 기간 스케줄을 적절한 날짜에만 추가
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

      if (targetDate) {
        if (!grouped[targetDate]) {
          grouped[targetDate] = [];
        }
        // 중복 방지
        if (!grouped[targetDate].some((s) => s.id === schedule.id)) {
          grouped[targetDate].push(schedule);
        }
      }
    });
    return grouped;
  };

  // 날짜별로 그룹화된 스케줄 렌더링
  const renderGroupedSchedules = (
    schedules: ScheduleWithPost[],
    clickable = false
  ) => {
    if (schedules.length === 0) {
      return (
        <p className="text-sm text-gray-500 text-center py-4">
          스케줄이 없습니다.
        </p>
      );
    }

    const grouped = groupByDate(schedules);
    const sortedDates = Object.keys(grouped).sort();

    return (
      <div className="space-y-4">
        {sortedDates.map((dateStr) => {
          const dateSchedules = grouped[dateStr];
          const date = parseISO(dateStr);

          return (
            <div key={dateStr} className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b">
                <h4 className="font-semibold text-sm">
                  {format(date, 'MM월 dd일 (E)', { locale: ko })}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {dateSchedules.length}개
                </Badge>
              </div>
              {dateSchedules.map((schedule) => (
                <ScheduleItem
                  key={schedule.id}
                  schedule={schedule}
                  onClick={() => onScheduleClick(schedule)}
                  clickable={clickable}
                />
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      {/* 예정 스케줄 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5 text-blue-500" />
            예정 스케줄
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
          {renderGroupedSchedules(categorizedSchedules.upcoming)}
        </CardContent>
      </Card>

      {/* 진행중 스케줄 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="size-5 text-orange-500" />
            진행중 스케줄
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
          {renderGroupedSchedules(categorizedSchedules.ongoing)}
        </CardContent>
      </Card>

      {/* 완료된 스케줄 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-500" />
            완료된 스케줄
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
          {renderGroupedSchedules(categorizedSchedules.completed, true)}
        </CardContent>
      </Card>
    </div>
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
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-200 border border-gray-300 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-700">1</span>
                  </div>
                  <span>예정 (파란색)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-orange-200 border border-gray-300 flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-700">1</span>
                  </div>
                  <span>진행중 (주황색)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-green-200 border border-gray-300 flex items-center justify-center">
                    <span className="text-sm font-bold text-green-700">1</span>
                  </div>
                  <span>완료 (초록색)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-white border border-gray-300 flex items-center justify-center">
                    <span className="text-sm text-gray-900">1</span>
                  </div>
                  <span>스케줄 없음 (검정색)</span>
                </div>
              </div>
            </CardContent>
            <div className="px-4">
              <Separator />
            </div>
            <CardContent className="min-h-[40vh]">
              <div className="h-full">
                <ScheduleCalendar
                  schedulesByDate={schedulesByDate}
                  selectedDate={selectedDate}
                  onDateSelect={onDateSelect}
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                />
              </div>
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
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
              {selectedDate ? (
                // 선택된 날짜의 스케줄
                selectedDateSchedules.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
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
                    <p className="text-sm text-gray-500 text-center py-4">
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
          ? 'cursor-pointer hover:bg-gray-50 hover:border-primary transition-colors'
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
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Clock className="size-3 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">
                {schedule.time}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarIcon className="size-3 text-gray-500" />
              <span className="text-xs text-gray-600">{schedule.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Users className="size-3 text-gray-400" />
            <span className="text-xs text-gray-600">
              참여자: {schedule.participants.length}명
            </span>
          </div>
        </div>
        {schedule.status === 'completed' && (
          <Badge variant="outline" className="shrink-0">
            평가하기
          </Badge>
        )}
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
              <p className="text-center text-gray-500 py-8">
                참여한 지원자가 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {schedule.participants.map((participant) => {
                  const isReviewed = participant.review !== undefined;

                  return (
                    <Card
                      key={participant.userId}
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
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
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
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
                          <ChevronRight className="size-5 text-gray-400" />
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
                              : 'text-gray-300'
                          } hover:text-yellow-400 transition-colors`}
                        >
                          <Star className="size-8 fill-current" />
                        </button>
                      ))}
                      <span className="ml-2 text-lg font-semibold text-gray-700">
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

// 새로운 스케줄 상세 모달 컴포넌트
interface ScheduleDetailModalProps {
  schedule: ScheduleWithPost;
  onClose: () => void;
}

function ScheduleDetailModal({ schedule, onClose }: ScheduleDetailModalProps) {
  // schedule.date를 파싱하여 표시할 날짜 문자열 생성
  const getScheduleDateDisplay = () => {
    const dates = parseDateString(schedule.date);
    if (dates.length === 0) return '';

    if (dates.length === 1) {
      return format(parseISO(dates[0]), 'yyyy년 MM월 dd일 (E)', { locale: ko });
    } else if (schedule.date.includes('~')) {
      const firstDate = format(parseISO(dates[0]), 'yyyy년 MM월 dd일 (E)', {
        locale: ko,
      });
      const lastDate = format(
        parseISO(dates[dates.length - 1]),
        'MM월 dd일 (E)',
        {
          locale: ko,
        }
      );
      return `${firstDate} ~ ${lastDate}`;
    } else {
      return dates
        .map((d) => format(parseISO(d), 'MM월 dd일 (E)', { locale: ko }))
        .join(', ');
    }
  };

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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-sm', statusBadge.className)}
            >
              {statusBadge.label}
            </Badge>
            <DialogTitle>{schedule.title}</DialogTitle>
          </div>
          <DialogDescription>{getScheduleDateDisplay()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">근무 시간</Label>
                  <p className="font-semibold">{schedule.time}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">근무 장소</Label>
                  <p className="font-semibold">{schedule.location}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">급여</Label>
                  <p className="font-semibold text-primary">
                    {schedule.salary.toLocaleString()}원
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">지급일</Label>
                  <p className="font-semibold">{schedule.paymentDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 모집 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">모집 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-500">모집 인원</Label>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">
                    {schedule.currentApplicants}
                  </span>
                  <span className="text-gray-500">/</span>
                  <span className="text-gray-500">
                    {schedule.recruitCount}명
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      (schedule.currentApplicants / schedule.recruitCount) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* 상세 설명 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">상세 설명</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm text-gray-500">업무 설명</Label>
                <p className="mt-1 text-sm leading-relaxed">
                  {schedule.description}
                </p>
              </div>
              {schedule.preparation && (
                <div>
                  <Label className="text-sm text-gray-500">준비사항</Label>
                  <p className="mt-1 text-sm leading-relaxed">
                    {schedule.preparation}
                  </p>
                </div>
              )}
              {schedule.requirements && (
                <div>
                  <Label className="text-sm text-gray-500">자격 요건</Label>
                  <p className="mt-1 text-sm leading-relaxed">
                    {schedule.requirements}
                  </p>
                </div>
              )}
              {schedule.preferences && (
                <div>
                  <Label className="text-sm text-gray-500">우대 사항</Label>
                  <p className="mt-1 text-sm leading-relaxed">
                    {schedule.preferences}
                  </p>
                </div>
              )}
              {schedule.notes && (
                <div>
                  <Label className="text-sm text-gray-500">기타 사항</Label>
                  <p className="mt-1 text-sm leading-relaxed">
                    {schedule.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 매니저 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">담당자 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-500">담당자</Label>
                <p className="font-semibold">{schedule.managerInfo.name}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-500">연락처</Label>
                <p className="font-semibold">{schedule.managerInfo.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* 키워드 */}
          {schedule.keywords && schedule.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {schedule.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary">
                  {keyword}
                </Badge>
              ))}
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
