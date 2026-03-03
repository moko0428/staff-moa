'use client';

import * as React from 'react';
import { Button } from '@/app/components/ui/button';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface WeeklyCalendarProps {
  today: Date;
  selectedDate: Date | undefined;
  calendarMonth: Date;
  monthCalendarOpen: boolean;
  currentRowDates: Date[];
  expandedAboveWeeks: Date[][];
  expandedBelowWeeks: Date[][];
  headerMonthLabel: string;
  calendarAreaRef: React.RefObject<HTMLDivElement | null>;
  aboveWeeksRef: React.RefObject<HTMLDivElement | null>;
  belowWeeksRef: React.RefObject<HTMLDivElement | null>;
  getDateStatusClass: (date: Date) => string;
  onDateSelect: (date: Date | undefined) => void;
  onMonthCalendarToggle: () => void;
  onAddSchedule: () => void;
  onNavigateBySwipe: (direction: 'prev' | 'next') => void;
}

export function WeeklyCalendar({
  today,
  selectedDate,
  calendarMonth,
  monthCalendarOpen,
  currentRowDates,
  expandedAboveWeeks,
  expandedBelowWeeks,
  headerMonthLabel,
  calendarAreaRef,
  aboveWeeksRef,
  belowWeeksRef,
  getDateStatusClass,
  onDateSelect,
  onMonthCalendarToggle,
  onAddSchedule,
  onNavigateBySwipe,
}: WeeklyCalendarProps) {
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

  return (
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
          onNavigateBySwipe(dx < 0 ? 'next' : 'prev');
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
      {/* 상단: 오늘 + 타이틀(월) + 월간 토글 + 추가 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={() => onDateSelect(today)}>
            오늘
          </Button>
          <div className="flex items-center">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onMonthCalendarToggle}
              aria-expanded={monthCalendarOpen}
              aria-controls="month-calendar-panel"
              title="월간(1달) 달력 보기"
              className="px-2"
            >
              <span className="text-sm font-medium">스케줄 관리 ({headerMonthLabel})</span>
              {monthCalendarOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddSchedule}
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
                <span key={label} className="w-10 text-center text-xs text-muted-foreground">
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
                monthCalendarOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="flex flex-col items-center justify-center gap-2 pt-2">
                {expandedAboveWeeks.map((week, wi) => (
                  <div key={`above-${wi}`} className="flex items-center justify-center gap-2">
                    {week.map((d) => {
                      const selected = selectedDate ? isSameDay(d, selectedDate) : isSameDay(d, today);
                      const inMonth = d.getMonth() === calendarMonth.getMonth();
                      const statusClass = inMonth && !selected ? getDateStatusClass(d) : '';
                      return (
                        <Button
                          key={d.toISOString()}
                          type="button"
                          size="sm"
                          variant={selected ? 'default' : 'outline'}
                          className={cn('w-10', !selected && (statusClass || 'bg-background'), !inMonth && 'opacity-40')}
                          onClick={() => onDateSelect(d)}
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
                const selected = selectedDate ? isSameDay(d, selectedDate) : isSameDay(d, today);
                const inMonth = !monthCalendarOpen || d.getMonth() === calendarMonth.getMonth();
                const statusClass = !selected && (!monthCalendarOpen || inMonth) ? getDateStatusClass(d) : '';
                return (
                  <Button
                    key={d.toISOString()}
                    type="button"
                    size="sm"
                    variant={selected ? 'default' : 'outline'}
                    className={cn('w-10', !selected && (statusClass || 'bg-background'), !inMonth && 'opacity-40')}
                    onClick={() => onDateSelect(d)}
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
                monthCalendarOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="flex flex-col items-center justify-center gap-2 pt-2">
                {expandedBelowWeeks.map((week, wi) => (
                  <div key={`below-${wi}`} className="flex items-center justify-center gap-2">
                    {week.map((d) => {
                      const selected = selectedDate ? isSameDay(d, selectedDate) : isSameDay(d, today);
                      const inMonth = d.getMonth() === calendarMonth.getMonth();
                      const statusClass = inMonth && !selected ? getDateStatusClass(d) : '';
                      return (
                        <Button
                          key={d.toISOString()}
                          type="button"
                          size="sm"
                          variant={selected ? 'default' : 'outline'}
                          className={cn('w-10', !selected && (statusClass || 'bg-background'), !inMonth && 'opacity-40')}
                          onClick={() => onDateSelect(d)}
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
  );
}
