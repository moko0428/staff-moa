'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import * as React from 'react';
import {
  Card,
  CardContent,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { parseDateString } from '@/lib/dateUtils';
import { BottomSheet } from '@/app/components/mobile/BottomSheet';
import ScheduleDetailModal from '../components/ScheduleDetailModal';
import { useManagerScheduleData } from './hooks/useManagerScheduleData';
import { CardView } from './components/organisms/CardView';
import { CalendarView } from './components/organisms/CalendarView';
import { AttendanceReviewModal } from './components/organisms/AttendanceReviewModal';
import type { ScheduleWithPost } from '../types/scheduleTypes';

type ViewType = 'card' | 'calendar';

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
  const [userDraggedHeight, setUserDraggedHeight] = useState<number | null>(null);
  const [bottomSheetMinHeight, setBottomSheetMinHeight] = useState(200);
  const [bottomSheetMaxHeight, setBottomSheetMaxHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight - 100 : 600
  );
  const headerRowRef = React.useRef<HTMLDivElement | null>(null);
  const [addScheduleOpen, setAddScheduleOpen] = useState(false);
  const [monthCalendarOpen, setMonthCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const {
    isMounted,
    isLoading,
    categorizedSchedules,
    schedulesByDate,
    isSubmittingReview,
    selectedSchedule,
    setSelectedSchedule,
    selectedDetailSchedule,
    setSelectedDetailSchedule,
    handleScheduleClick,
    handleReviewSubmit,
  } = useManagerScheduleData();

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
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

  const goToday = () => handleDateSelect(today);

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

    const headerEl = headerRowRef.current;
    if (headerEl) {
      const headerRect = headerEl.getBoundingClientRect();
      setBottomSheetMaxHeight(Math.floor(vh - headerRect.bottom));
    }

    const calendarTop = rect.top;
    const sixRowCalendarHeight = 24 + 6 * 48;
    const minH = Math.max(200, Math.floor(vh - calendarTop - sixRowCalendarHeight));
    setBottomSheetMinHeight(minH);

    const autoHeight = Math.max(240, Math.floor(vh - rect.bottom));
    setBottomSheetHeightPx(autoHeight);
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
    setUserDraggedHeight(null);
    const t = window.setTimeout(updateBottomSheetHeight, 320);
    return () => window.clearTimeout(t);
  }, [monthCalendarOpen, updateBottomSheetHeight]);

  useEffect(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setCalendarMonth(selectedDate);
    }
  }, [selectedDate]);

  const getDateStatusClass = (date: Date): string => {
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
  };

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
              (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
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
        <div ref={headerRowRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" onClick={goToday}>
              오늘
            </Button>
            <div className="flex items-center">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setMonthCalendarOpen((v) => !v)}
                aria-expanded={monthCalendarOpen}
                aria-controls="month-calendar-panel"
                title="월간(1달) 달력 보기"
                className="px-2"
              >
                <span className="text-sm font-medium">{headerMonthLabel}</span>
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
                        const inMonth = d.getMonth() === calendarMonth.getMonth();
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
                        const inMonth = d.getMonth() === calendarMonth.getMonth();
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
        <BottomSheet
          heightPx={userDraggedHeight ?? bottomSheetHeightPx}
          minHeightPx={bottomSheetMinHeight}
          maxHeightPx={bottomSheetMaxHeight}
          onHeightChange={(h) => setUserDraggedHeight(h)}
        >
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

      {selectedSchedule && (
        <AttendanceReviewModal
          schedule={selectedSchedule}
          onClose={() => {
            setSelectedSchedule(null);
            setSelectedDate(undefined);
          }}
          onSubmit={handleReviewSubmit}
          isSubmitting={isSubmittingReview}
        />
      )}

      {selectedDetailSchedule && (
        <ScheduleDetailModal
          schedule={selectedDetailSchedule}
          onClose={() => setSelectedDetailSchedule(null)}
        />
      )}

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
