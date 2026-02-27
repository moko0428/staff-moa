'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { parseDateString } from '@/lib/dateUtils';
import { Separator } from '@/app/components/Separator';
import { ScheduleStatusLegend } from '@/app/components/ScheduleStatusLegend';
import ScheduleCalendar from '@/app/components/ScheduleCalendar';
import { ScheduleItem } from '../molecules/ScheduleItem';
import type { ScheduleWithPost } from '../../../types/scheduleTypes';

interface CalendarViewProps {
  schedulesByDate: Record<string, ScheduleWithPost[]>;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  onScheduleClick: (schedule: ScheduleWithPost) => void;
}

export const CalendarView = ({
  schedulesByDate,
  selectedDate,
  onDateSelect,
  onScheduleClick,
}: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

  const getDateStatus = (
    date: Date
  ): 'upcoming' | 'ongoing' | 'completed' | null => {
    if (!date || isNaN(date.getTime())) return null;

    const dateStr = format(date, 'yyyy-MM-dd');
    const schedules = schedulesByDate[dateStr] || [];
    if (schedules.length === 0) return null;

    const hasOngoing = schedules.some((s) => s.status === 'ongoing');
    const hasCompleted = schedules.some((s) => s.status === 'completed');
    const hasUpcoming = schedules.some((s) => s.status === 'upcoming');

    if (hasOngoing) return 'ongoing';
    if (hasCompleted) return 'completed';
    if (hasUpcoming) return 'upcoming';
    return null;
  };

  const currentMonthSchedules = useMemo(() => {
    const scheduleSet = new Set<string>();
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

    return allSchedules.sort((a, b) => {
      const datesA = parseDateString(a.date);
      const datesB = parseDateString(b.date);
      if (datesA.length === 0 || datesB.length === 0) return 0;

      try {
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
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>스케줄 달력</CardTitle>
            </CardHeader>
            <CardContent>
              <ScheduleStatusLegend />
            </CardContent>
            <div className="px-6">
              <Separator />
            </div>
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
                selectedDateSchedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    선택한 날짜에 스케줄이 없습니다.
                  </p>
                ) : (
                  selectedDateSchedules
                    .map((schedule) => {
                      const dates = parseDateString(schedule.date);
                      const isInRange = dates.includes(selectedDateStr || '');
                      if (!isInRange) return null;

                      let statusDate: Date | null = null;
                      if (dates[0]) {
                        try {
                          statusDate = parseISO(dates[0]);
                          if (isNaN(statusDate.getTime())) statusDate = null;
                        } catch {
                          statusDate = null;
                        }
                      }
                      if (!statusDate && selectedDateStr) {
                        try {
                          statusDate = parseISO(selectedDateStr);
                          if (isNaN(statusDate.getTime())) statusDate = null;
                        } catch {
                          statusDate = null;
                        }
                      }

                      const status = statusDate ? getDateStatus(statusDate) : null;
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
                (() => {
                  const groupedByDate: Record<string, ScheduleWithPost[]> = {};
                  const currentYear = currentMonth.getFullYear();
                  const currentMonthNum = currentMonth.getMonth();

                  currentMonthSchedules.forEach((schedule) => {
                    const dates = parseDateString(schedule.date);
                    let targetDate: string | null = null;

                    if (dates.length === 1) {
                      targetDate = dates[0];
                    } else if (dates.length > 1) {
                      targetDate =
                        schedule.status === 'completed'
                          ? dates[dates.length - 1]
                          : dates[0];
                    }

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
                            const dates = parseDateString(schedule.date);
                            let statusDate: Date | null = null;

                            if (dates[0]) {
                              try {
                                statusDate = parseISO(dates[0]);
                                if (isNaN(statusDate.getTime())) statusDate = null;
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
};
