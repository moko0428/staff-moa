'use client';

import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/app/components/ui/calendar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import CategoryTagList from '../molecules/CategoryTagList';
import { Filters } from './PostingFilter';

interface MobileSearchOverlayProps {
  initialFilters: Filters;
  allCategories: string[];
  allLocations: string[];
  allSalaries: number[];
  activeDates: string[];
  onClose: () => void;
  onApply: (f: Filters) => void;
}

export default function MobileSearchOverlay({
  initialFilters,
  allCategories,
  allLocations,
  allSalaries,
  activeDates,
  onClose,
  onApply,
}: MobileSearchOverlayProps) {
  const [draftFilters, setDraftFilters] = useState<Filters>(initialFilters);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const set = (patch: Partial<Filters>) =>
    setDraftFilters((prev) => ({ ...prev, ...patch }));

  const activeDateObjects = activeDates
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()));

  const dateMode = draftFilters.dateMode ?? 'single';

  const fromDate = draftFilters.dateRange?.from
    ? new Date(draftFilters.dateRange.from)
    : undefined;
  const toDateRaw = draftFilters.dateRange?.to
    ? new Date(draftFilters.dateRange.to)
    : undefined;
  const toDate =
    dateMode === 'range'
      ? (toDateRaw ?? fromDate)
      : dateMode === 'single'
        ? fromDate
        : undefined;

  const handleRangeApply = (range: DateRange | undefined) => {
    if (!range?.from) {
      set({ dateRange: undefined });
      return;
    }
    if (dateMode === 'range') {
      const end = range.to ?? range.from;
      set({
        dateRange: {
          from: format(range.from, 'yyyy-MM-dd'),
          to: format(end, 'yyyy-MM-dd'),
        },
      });
      return;
    }
    if (dateMode === 'open-end') {
      set({
        dateRange: {
          from: format(range.from, 'yyyy-MM-dd'),
          to: undefined,
        },
      });
      return;
    }
    set({
      dateRange: {
        from: format(range.from, 'yyyy-MM-dd'),
        to: format(range.from, 'yyyy-MM-dd'),
      },
    });
  };

  const setDateMode = (mode: Filters['dateMode']) => {
    const currentFrom = draftFilters.dateRange?.from;
    const currentTo = draftFilters.dateRange?.to;
    if (!currentFrom) {
      set({ dateMode: mode, dateRange: undefined });
      return;
    }
    if (mode === 'single') {
      set({
        dateMode: mode,
        dateRange: { from: currentFrom, to: currentFrom },
      });
      return;
    }
    if (mode === 'range') {
      set({
        dateMode: mode,
        dateRange: { from: currentFrom, to: currentTo ?? currentFrom },
      });
      return;
    }
    set({ dateMode: mode, dateRange: { from: currentFrom, to: undefined } });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground"
          aria-label="닫기"
        >
          <X className="size-5" />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={draftFilters.searchTerm ?? ''}
            onChange={(e) => set({ searchTerm: e.target.value })}
            placeholder="원하는 공고를 검색해보세요"
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
        {/* Status */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="overlay-status" className="text-sm font-medium">
            모집 상태
          </Label>
          <select
            id="overlay-status"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={draftFilters.status}
            onChange={(e) =>
              set({ status: e.target.value as Filters['status'] })
            }
          >
            <option value="">전체</option>
            <option value="급구">급구</option>
            <option value="모집">모집</option>
            <option value="모집완료">모집완료</option>
          </select>
        </div>

        {/* Pay */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="overlay-payMin" className="text-sm font-medium">
            최소 급여
          </Label>
          <select
            id="overlay-payMin"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={draftFilters.payMin ?? ''}
            onChange={(e) => set({ payMin: e.target.value })}
          >
            <option value="">전체</option>
            {allSalaries.map((salary) => (
              <option key={salary} value={salary.toString()}>
                {salary >= 10000
                  ? `${(salary / 10000).toFixed(0)}만원 이상`
                  : `${salary.toLocaleString()}원 이상`}
              </option>
            ))}
          </select>
        </div>

        {/* Date picker */}
        <div className="flex flex-col gap-2">
          {showDatePicker ? (
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-sm font-normal border border-border rounded-md"
                  onClick={() => setShowDatePicker(false)}
                >
                  날짜 선택 취소
                </Button>
              </div>
              <div className="flex flex-col gap-4">
                {dateMode === 'range' ? (
                  <Calendar
                    locale={ko}
                    mode="range"
                    selected={{ from: fromDate, to: toDate ?? undefined }}
                    onSelect={(value: DateRange | undefined) =>
                      handleRangeApply(value)
                    }
                    numberOfMonths={1}
                    modifiers={{ active: activeDateObjects }}
                    modifiersClassNames={{ active: 'bg-accent' }}
                  />
                ) : (
                  <Calendar
                    locale={ko}
                    mode="single"
                    selected={fromDate}
                    onSelect={(value: Date | undefined) =>
                      handleRangeApply(
                        value ? { from: value, to: value } : undefined,
                      )
                    }
                    numberOfMonths={1}
                    modifiers={{ active: activeDateObjects }}
                    modifiersClassNames={{ active: 'bg-accent' }}
                  />
                )}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    {(
                      [
                        { value: 'single', label: '하루만' },
                        { value: 'range', label: '기간 지정' },
                        { value: 'open-end', label: '시작일만' },
                      ] as const
                    ).map(({ value, label }) => (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant={dateMode === value ? 'default' : 'outline'}
                        onClick={() => setDateMode(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dateMode === 'single' && '선택한 하루만 검색합니다.'}
                    {dateMode === 'range' &&
                      '시작일과 종료일을 선택해 기간을 검색합니다.'}
                    {dateMode === 'open-end' &&
                      '선택한 날짜 이후(종료일 없음)로 검색합니다.'}
                  </p>
                  <div className="text-sm text-muted-foreground">
                    {fromDate
                      ? dateMode === 'range' && toDate
                        ? `${format(fromDate, 'PPP', { locale: ko })} ~ ${format(toDate, 'PPP', { locale: ko })}`
                        : dateMode === 'open-end'
                          ? `${format(fromDate, 'PPP', { locale: ko })} 이후`
                          : format(fromDate, 'PPP', { locale: ko })
                      : '선택된 날짜가 없습니다.'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="self-start text-sm font-normal border border-border rounded-md"
              onClick={() => setShowDatePicker(true)}
            >
              날짜 선택
            </Button>
          )}
        </div>

        {/* Location */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">지역</Label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => set({ placeText: '' })}
              className={cn(
                'rounded-full border px-3 py-1 text-xs',
                !draftFilters.placeText
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-foreground border-border',
              )}
            >
              전체 지역
            </button>
            {allLocations.map((loc) => {
              const active = draftFilters.placeText === loc;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => set({ placeText: active ? '' : loc })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs',
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-foreground border-border',
                  )}
                >
                  {loc}
                </button>
              );
            })}
          </div>
        </div>

        <CategoryTagList
          allCategories={allCategories}
          selected={draftFilters.categories}
          onChange={(cats) => set({ categories: cats })}
        />
      </div>

      {/* Sticky bottom CTA */}
      <div className="shrink-0 px-4 py-3 border-t border-border">
        <Button
          type="button"
          className="w-full"
          onClick={() => onApply(draftFilters)}
        >
          검색하기
        </Button>
      </div>
    </div>,
    document.body,
  );
}
