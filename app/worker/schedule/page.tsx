'use client';

import { useState, useMemo, useEffect } from 'react';
import Hero from '@/components/Hero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockPosts, mockApplications, mockUsers } from '@/lib/mockData';
import { parseDateString } from '@/lib/dateUtils';
import type { AttendanceReview } from '@/types/mockData';
import {
  format,
  parseISO,
  isSameDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import {
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  CalendarDays,
} from 'lucide-react';

interface WorkerSchedule {
  id: string;
  postId: string;
  postTitle: string;
  date: string;
  time: string;
  location: string;
  salary: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  authorName: string;
  // ScheduleCalendar 호환을 위한 필드
  title: string;
  description: string;
  authorId: string;
  participants: Array<{
    userId: string;
    userName: string;
    applicationId: string;
    review?: AttendanceReview;
  }>;
  keywords: string[];
  preparation: string;
  notes?: string;
  paymentDate: string;
  managerInfo: {
    name: string;
    phone: string;
  };
  recruitCount: number;
  currentApplicants: number;
  createdAt: string;
  updatedAt: string;
}

export default function WorkerSchedulePage() {
  const [currentUserId, setCurrentUserId] = useState<string>('member-1');
  const [isMounted, setIsMounted] = useState(false);
  const [viewType, setViewType] = useState<'card' | 'calendar'>('card');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    setIsMounted(true);
    try {
      const userId =
        typeof window !== 'undefined'
          ? localStorage.getItem('userId') || 'member-1'
          : 'member-1';
      setCurrentUserId(userId);
    } catch {
      setCurrentUserId('member-1');
    }
  }, []);

  const today = useMemo(() => {
    if (!isMounted) return new Date();
    return new Date();
  }, [isMounted]);

  // 승인된 지원서를 기반으로 스케줄 생성
  const workerSchedules = useMemo(() => {
    if (!isMounted || !currentUserId) return [];

    const acceptedApplications = mockApplications.filter(
      (app) => app.applicantId === currentUserId && app.status === 'accepted'
    );

    const schedules: WorkerSchedule[] = [];

    acceptedApplications.forEach((app) => {
      const post = mockPosts.find((p) => p.id === app.postId);
      if (!post) return;

      const author = mockUsers.find((u) => u.id === post.authorId);
      const dates = parseDateString(post.date);

      dates.forEach((dateStr) => {
        const scheduleDate = parseISO(dateStr);
        const [startTime] = post.time.split('~');
        const scheduleDateTime = new Date(scheduleDate);
        const [hours, minutes] = startTime.trim().split(':');
        scheduleDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        let status: 'upcoming' | 'ongoing' | 'completed';
        if (scheduleDateTime > today) {
          status = 'upcoming';
        } else if (isSameDay(scheduleDateTime, today)) {
          const now = new Date();
          const [endTime] = post.time.split('~').slice(1);
          if (endTime) {
            const [endHours, endMinutes] = endTime.trim().split(':');
            const endDateTime = new Date(scheduleDate);
            endDateTime.setHours(
              parseInt(endHours),
              parseInt(endMinutes),
              0,
              0
            );
            status = now > endDateTime ? 'completed' : 'ongoing';
          } else {
            status = 'ongoing';
          }
        } else {
          status = 'completed';
        }

        schedules.push({
          id: `${app.id}-${dateStr}`,
          postId: post.id,
          postTitle: post.title,
          date: dateStr,
          time: post.time,
          location: post.location,
          salary: post.salary,
          status,
          authorName: author?.name || '알 수 없음',
          // ScheduleCalendar 호환 필드
          title: post.title,
          description: post.description || '',
          authorId: post.authorId,
          participants: [
            {
              userId: currentUserId,
              userName:
                mockUsers.find((u) => u.id === currentUserId)?.name || '사용자',
              applicationId: app.id,
            },
          ],
          keywords: post.keywords || [],
          preparation: post.preparation || '',
          notes: post.notes,
          paymentDate: post.paymentDate || '',
          managerInfo: {
            name: author?.name || '알 수 없음',
            phone: author?.phone || '',
          },
          recruitCount: 0,
          currentApplicants: 0,
          createdAt: post.createdAt || '',
          updatedAt: post.updatedAt || '',
        });
      });
    });

    return schedules.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [isMounted, currentUserId, today]);

  // 스케줄 상태별로 분류
  const categorizedSchedules = useMemo(() => {
    return {
      upcoming: workerSchedules.filter((s) => s.status === 'upcoming'),
      ongoing: workerSchedules.filter((s) => s.status === 'ongoing'),
      completed: workerSchedules.filter((s) => s.status === 'completed'),
    };
  }, [workerSchedules]);

  // 급여 계산
  const salaryStats = useMemo(() => {
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);

    const thisMonthSchedules = workerSchedules.filter((schedule) => {
      const scheduleDate = parseISO(schedule.date);
      return (
        scheduleDate >= currentMonthStart && scheduleDate <= currentMonthEnd
      );
    });

    const completedThisMonth = thisMonthSchedules.filter(
      (s) => s.status === 'completed'
    );
    const upcomingThisMonth = thisMonthSchedules.filter(
      (s) => s.status === 'upcoming' || s.status === 'ongoing'
    );

    const earnedThisMonth = completedThisMonth.reduce(
      (sum, s) => sum + s.salary,
      0
    );
    const expectedThisMonth = upcomingThisMonth.reduce(
      (sum, s) => sum + s.salary,
      0
    );

    // 주간 급여 (지난 7일)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSchedules = workerSchedules.filter((schedule) => {
      const scheduleDate = parseISO(schedule.date);
      return (
        scheduleDate >= weekAgo &&
        scheduleDate <= today &&
        schedule.status === 'completed'
      );
    });
    const earnedThisWeek = weekSchedules.reduce((sum, s) => sum + s.salary, 0);

    return {
      earnedThisMonth,
      expectedThisMonth,
      totalThisMonth: earnedThisMonth + expectedThisMonth,
      earnedThisWeek,
      totalCompleted: workerSchedules
        .filter((s) => s.status === 'completed')
        .reduce((sum, s) => sum + s.salary, 0),
    };
  }, [workerSchedules, today]);

  // 날짜별로 스케줄 그룹화
  const schedulesByDate = useMemo(() => {
    const grouped: { [date: string]: WorkerSchedule[] } = {};
    workerSchedules.forEach((schedule) => {
      const dates = parseDateString(schedule.date);
      dates.forEach((date) => {
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(schedule);
      });
    });
    return grouped;
  }, [workerSchedules]);

  // 현재 월의 스케줄
  const currentMonthSchedules = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    return workerSchedules.filter((schedule) => {
      const scheduleDate = parseISO(schedule.date);
      return scheduleDate >= monthStart && scheduleDate <= monthEnd;
    });
  }, [workerSchedules, currentMonth]);

  // 선택된 날짜의 스케줄
  const selectedDateSchedules = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return schedulesByDate[dateStr] || [];
  }, [selectedDate, schedulesByDate]);

  // 날짜를 클릭했을 때
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  // 날짜별로 그룹화하여 리스트 표시
  const groupedByDate = useMemo(() => {
    const grouped: { [date: string]: WorkerSchedule[] } = {};
    const schedulesToShow = selectedDate
      ? selectedDateSchedules
      : currentMonthSchedules;

    schedulesToShow.forEach((schedule) => {
      const dateStr = schedule.date;
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(schedule);
    });

    return Object.entries(grouped).sort(
      ([dateA], [dateB]) =>
        new Date(dateA).getTime() - new Date(dateB).getTime()
    );
  }, [selectedDate, selectedDateSchedules, currentMonthSchedules]);

  if (!isMounted) {
    return (
      <div>
        <Hero
          title="내 스케줄"
          description="나의 근무 일정과 급여를 관리하세요"
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
        title="내 스케줄"
        description="나의 근무 일정과 급여를 관리하세요"
      />

      {/* 급여 통계 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">이번 달 예상 급여</p>
                <p className="text-2xl font-bold text-blue-600">
                  {salaryStats.expectedThisMonth.toLocaleString()}원
                </p>
              </div>
              <TrendingUp className="size-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">이번 달 총 급여</p>
                <p className="text-2xl font-bold text-primary">
                  {salaryStats.totalThisMonth.toLocaleString()}원
                </p>
              </div>
              <DollarSign className="size-10 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 뷰 전환 버튼 */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={viewType === 'card' ? 'default' : 'outline'}
          onClick={() => {
            setViewType('card');
            setSelectedDate(undefined);
          }}
        >
          <LayoutGrid className="size-4 mr-2" />
          카드 보기
        </Button>
        <Button
          variant={viewType === 'calendar' ? 'default' : 'outline'}
          onClick={() => setViewType('calendar')}
        >
          <CalendarDays className="size-4 mr-2" />
          달력 보기
        </Button>
      </div>

      {viewType === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 예정된 스케줄 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700">예정</Badge>
                <span className="text-lg">
                  {categorizedSchedules.upcoming.length}건
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categorizedSchedules.upcoming.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  예정된 스케줄이 없습니다
                </p>
              ) : (
                categorizedSchedules.upcoming.map((schedule) => (
                  <ScheduleCard key={schedule.id} schedule={schedule} />
                ))
              )}
            </CardContent>
          </Card>

          {/* 진행중 스케줄 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-700">진행중</Badge>
                <span className="text-lg">
                  {categorizedSchedules.ongoing.length}건
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categorizedSchedules.ongoing.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  진행중인 스케줄이 없습니다
                </p>
              ) : (
                categorizedSchedules.ongoing.map((schedule) => (
                  <ScheduleCard key={schedule.id} schedule={schedule} />
                ))
              )}
            </CardContent>
          </Card>

          {/* 완료된 스케줄 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700">완료</Badge>
                <span className="text-lg">
                  {categorizedSchedules.completed.length}건
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {categorizedSchedules.completed.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  완료된 스케줄이 없습니다
                </p>
              ) : (
                categorizedSchedules.completed.map((schedule) => (
                  <ScheduleCard key={schedule.id} schedule={schedule} />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 달력 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="size-5" />
                    {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentMonth(subMonths(currentMonth, 1))
                      }
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentMonth(addMonths(currentMonth, 1))
                      }
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScheduleCalendar
                  currentMonth={currentMonth}
                  schedulesByDate={schedulesByDate}
                  onDateSelect={handleDateSelect}
                  selectedDate={selectedDate}
                  onMonthChange={setCurrentMonth}
                />
              </CardContent>
            </Card>
          </div>

          {/* 스케줄 목록 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedDate
                    ? format(selectedDate, 'M월 d일 (EEE)', { locale: ko })
                    : format(currentMonth, 'M월', { locale: ko })}{' '}
                  스케줄
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {groupedByDate.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    스케줄이 없습니다
                  </p>
                ) : (
                  groupedByDate.map(([date, schedules]) => (
                    <div key={date} className="space-y-2">
                      <h4 className="font-semibold text-sm text-gray-700">
                        {format(parseISO(date), 'M월 d일 (EEE)', {
                          locale: ko,
                        })}
                      </h4>
                      <div className="space-y-2">
                        {schedules.map((schedule) => (
                          <ScheduleCard key={schedule.id} schedule={schedule} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// 스케줄 카드 컴포넌트
interface ScheduleCardProps {
  schedule: WorkerSchedule;
}

function ScheduleCard({ schedule }: ScheduleCardProps) {
  const statusBadge = {
    upcoming: { label: '예정', className: 'bg-blue-100 text-blue-700' },
    ongoing: { label: '진행중', className: 'bg-orange-100 text-orange-700' },
    completed: { label: '완료', className: 'bg-green-100 text-green-700' },
  }[schedule.status];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-sm line-clamp-2">
              {schedule.postTitle}
            </h4>
            <Badge variant="outline" className={statusBadge.className}>
              {statusBadge.label}
            </Badge>
          </div>

          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-3" />
              <span>
                {format(parseISO(schedule.date), 'yyyy년 MM월 dd일 (EEE)', {
                  locale: ko,
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-3" />
              <span>{schedule.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-3" />
              <span>{schedule.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="size-3" />
              <span>{schedule.authorName}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-gray-500">급여</span>
            <span className="font-bold text-primary">
              {schedule.salary.toLocaleString()}원
            </span>
          </div>

          {schedule.status === 'completed' && (
            <Button size="sm" variant="outline" className="w-full mt-2">
              <CheckCircle2 className="size-3 mr-1" />
              경력에 추가
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
