'use client';

import * as React from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import type { DayButton } from 'react-day-picker';
import { format, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ScheduleWithPost } from '@/app/manager/schedule/page';

interface ScheduleCalendarProps {
  schedulesByDate: Record<string, ScheduleWithPost[]>;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export default function ScheduleCalendar({
  schedulesByDate,
  selectedDate,
  onDateSelect,
  currentMonth,
  onMonthChange,
}: ScheduleCalendarProps) {
  const today = React.useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // 커스텀 DayButton 컴포넌트
  const CustomDayButton = React.useCallback(
    (props: React.ComponentProps<typeof DayButton>) => {
      const { day, modifiers, ...buttonProps } = props;
      const dayDate = day.date;

      const dateStr = format(dayDate, 'yyyy-MM-dd');
      const schedules = schedulesByDate[dateStr] || [];

      // 스케줄을 상태별로 그룹화
      const upcomingSchedules = schedules.filter(
        (s) => s.status === 'upcoming'
      );
      const ongoingSchedules = schedules.filter((s) => s.status === 'ongoing');
      const completedSchedules = schedules.filter(
        (s) => s.status === 'completed'
      );

      // 스케줄 상태별 배경색과 텍스트 색상 결정 (우선순위: ongoing > upcoming > completed)
      let backgroundColor = '';
      let textColor = 'text-foreground'; // 기본 검정색

      if (schedules.length > 0) {
        const hasUpcoming = upcomingSchedules.length > 0;
        const hasOngoing = ongoingSchedules.length > 0;
        const hasCompleted = completedSchedules.length > 0;

        if (hasOngoing) {
          backgroundColor = 'bg-orange-100';
          textColor = 'text-orange-600 font-semibold';
        } else if (hasUpcoming) {
          backgroundColor = 'bg-blue-100';
          textColor = 'text-blue-600 font-semibold';
        } else if (hasCompleted) {
          backgroundColor = 'bg-green-100';
          textColor = 'text-green-600 font-semibold';
        }
      }

      const isToday = isSameDay(dayDate, today);
      const isSelected = selectedDate
        ? isSameDay(dayDate, selectedDate)
        : false;

      return (
        <button
          type="button"
          className={cn(
            'relative w-full h-full p-2 text-center flex flex-col items-center justify-start transition-colors border border-gray-200',
            // 선택된 날짜
            modifiers.selected && 'bg-primary text-primary-foreground',
            // 외부 날짜 (다른 월)
            modifiers.outside && 'text-muted-foreground opacity-50',
            // 배경색 (스케줄 있을 때)
            !modifiers.selected && !modifiers.outside && backgroundColor,
            // 텍스트 색상 (스케줄 있을 때)
            !modifiers.selected && !modifiers.outside && textColor,
            // 오늘 표시
            isToday && !modifiers.selected && 'ring-2 ring-orange-400',
            // 선택된 날짜 표시
            isSelected && !modifiers.selected && 'ring-2 ring-blue-500'
          )}
          {...buttonProps}
        >
          <span className="text-sm font-medium mb-1">{dayDate.getDate()}</span>

          {/* 스케줄 상태 표시 바 */}
          {schedules.length > 0 && !modifiers.selected && (
            <div className="w-full space-y-0.5 mt-auto">
              {upcomingSchedules.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="h-1 flex-1 bg-blue-500 rounded-full" />
                  {upcomingSchedules.length > 1 && (
                    <span className="text-[8px] font-bold text-blue-600">
                      {upcomingSchedules.length}
                    </span>
                  )}
                </div>
              )}
              {ongoingSchedules.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="h-1 flex-1 bg-orange-500 rounded-full" />
                  {ongoingSchedules.length > 1 && (
                    <span className="text-[8px] font-bold text-orange-600">
                      {ongoingSchedules.length}
                    </span>
                  )}
                </div>
              )}
              {completedSchedules.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="h-1 flex-1 bg-green-500 rounded-full" />
                  {completedSchedules.length > 1 && (
                    <span className="text-[8px] font-bold text-green-600">
                      {completedSchedules.length}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </button>
      );
    },
    [selectedDate, today, schedulesByDate]
  );

  return (
    <div className="w-full">
      <CalendarComponent
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        month={currentMonth}
        onMonthChange={onMonthChange}
        locale={ko}
        components={{
          DayButton: CustomDayButton,
        }}
        className="rounded-md border w-full"
      />
    </div>
  );
}
