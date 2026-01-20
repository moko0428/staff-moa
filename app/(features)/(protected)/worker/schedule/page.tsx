'use client';

import { useState, useMemo, useEffect } from 'react';
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
import ScheduleCalendar from '@/app/components/ScheduleCalendar';
import { Post } from '@/types/mockData';
import { getMySchedulesAction } from './actions';
import { createClient } from '@/utils/supabase/client';
import {
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
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

export interface ScheduleWithPost extends Omit<Post, 'status'> {
  scheduleId?: string;
  status: ScheduleStatus;
  applicationId?: string;
  appliedAt?: string;
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
};

function supabasePostToPost(supabasePost: SupabasePost): Post {
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
  const [workerPosts, setWorkerPosts] = useState<Post[]>([]);
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

  // worker가 지원한 공고 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      if (!currentUserId) return;
      
      setIsLoading(true);
      try {
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
              } as unknown as SupabasePost);
            });
          setWorkerPosts(convertedPosts);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        setWorkerPosts([]);
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

    workerPosts.forEach((post) => {
      // date 필드를 파싱하여 날짜 배열로 변환
      const dates = parseDateString(post.date);
      if (dates.length === 0) return; // 유효한 날짜가 없으면 스킵

      const scheduleWithPost: ScheduleWithPost = {
        ...post,
        status: 'upcoming',
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
  }, [workerPosts, isMounted]);

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
        <Hero title="내 스케줄" description="일반 회원 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-gray-600">
            역할 정보를 불러오는 중입니다...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="space-y-4">
        <Hero title="내 스케줄" description="일반 회원 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-gray-600">
            일반 회원만 접근할 수 있는 페이지입니다.
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
          <p className="text-gray-500">로딩 중...</p>
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
        />
      )}

      {/* 스케줄 상세 모달 */}
      {selectedSchedule && (
        <ScheduleDetailModal
          schedule={selectedSchedule}
          onClose={() => {
            setSelectedSchedule(null);
            setSelectedDate(undefined);
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
  };
  onScheduleClick: (schedule: ScheduleWithPost) => void;
}

function CardView({ categorizedSchedules, onScheduleClick }: CardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      {/* 예정 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-blue-500" />
          <h2 className="text-lg font-semibold">예정</h2>
          <Badge variant="outline" className="ml-auto">
            {categorizedSchedules.upcoming.length}
          </Badge>
        </div>
        {categorizedSchedules.upcoming.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-gray-500">
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
          <h2 className="text-lg font-semibold">진행중</h2>
          <Badge variant="outline" className="ml-auto">
            {categorizedSchedules.ongoing.length}
          </Badge>
        </div>
        {categorizedSchedules.ongoing.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-gray-500">
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
          <h2 className="text-lg font-semibold">완료</h2>
          <Badge variant="outline" className="ml-auto">
            {categorizedSchedules.completed.length}
          </Badge>
        </div>
        {categorizedSchedules.completed.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-gray-500">
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
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 선택된 날짜의 스케줄 필터링
  const selectedDateSchedules = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return schedulesByDate[dateStr] || [];
  }, [selectedDate, schedulesByDate]);

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
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="size-5" />
                {selectedDate
                  ? format(selectedDate, 'yyyy년 MM월 dd일', { locale: ko })
                  : '날짜를 선택하세요'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateSchedules.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
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
    </div>
  );
}

interface ScheduleCardProps {
  schedule: ScheduleWithPost;
  onClick: () => void;
  compact?: boolean;
}

function ScheduleCard({ schedule, onClick, compact = false }: ScheduleCardProps) {
  const statusConfig = {
    upcoming: { label: '예정', className: 'bg-blue-100 text-blue-700' },
    ongoing: { label: '진행중', className: 'bg-orange-100 text-orange-700' },
    completed: { label: '완료', className: 'bg-green-100 text-green-700' },
  };

  const config = statusConfig[schedule.status];

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
            <h3 className={cn('font-semibold truncate', compact && 'text-sm')}>
              {schedule.title}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={cn('text-xs', config.className)}>
                {config.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn('pt-0', compact && 'pt-0')}>
        <div className={cn('space-y-2 text-sm', compact && 'space-y-1 text-xs')}>
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarIcon className="size-4" />
            <span>{schedule.date}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="size-4" />
            <span>{schedule.time}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>📍</span>
            <span className="truncate">{schedule.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
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
}

function ScheduleDetailModal({ schedule, onClose }: ScheduleDetailModalProps) {
  const statusConfig = {
    upcoming: { label: '예정', className: 'bg-blue-100 text-blue-700' },
    ongoing: { label: '진행중', className: 'bg-orange-100 text-orange-700' },
    completed: { label: '완료', className: 'bg-green-100 text-green-700' },
  };

  const config = statusConfig[schedule.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{schedule.title}</CardTitle>
              <Badge className={cn('text-xs', config.className)}>
                {config.label}
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">업무 정보</h3>
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
          </div>

          {schedule.description && (
            <div>
              <h3 className="font-semibold mb-2">업무 내용</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {schedule.description}
              </p>
            </div>
          )}

          {schedule.managerInfo && (
            <div>
              <h3 className="font-semibold mb-2">담당자 정보</h3>
              <div className="space-y-1 text-sm">
                <div>이름: {schedule.managerInfo.name}</div>
                <div>연락처: {schedule.managerInfo.phone}</div>
              </div>
            </div>
          )}

          {schedule.notes && (
            <div>
              <h3 className="font-semibold mb-2">참고사항</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {schedule.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
