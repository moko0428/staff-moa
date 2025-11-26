'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FilterIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { useState } from 'react';

export type Filters = {
  status: '' | '급구' | '모집' | '모집완료';
  payMin?: string;
  payMax?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
  dateMode?: 'single' | 'range' | 'open-end';
  toText?: string;
  placeText?: string;
  categories: string[];
  searchTerm?: string;
  showFilters?: boolean;
};

interface FilterBarProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  allCategories: string[];
  allLocations: string[];
  allSalaries: number[];
}

export default function PostingFilter({
  filters,
  onChange,
  allCategories,
  allLocations,
  allSalaries,
}: FilterBarProps) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const toggleCategory = (c: string) => {
    const exists = filters.categories.includes(c);
    const next = exists
      ? filters.categories.filter((x) => x !== c)
      : [...filters.categories, c];
    set({ categories: next });
  };

  const handleAllClick = () => {
    set({ categories: [] });
  };

  const toggleFilters = () => {
    set({ showFilters: !filters.showFilters });
  };

  const isAllSelected = filters.categories.length === 0;
  const showFilters = filters.showFilters ?? false;
  const dateMode = filters.dateMode ?? 'single';
  const fromDate = filters.dateRange?.from
    ? new Date(filters.dateRange.from)
    : undefined;
  const toDateRaw = filters.dateRange?.to
    ? new Date(filters.dateRange.to)
    : undefined;
  const toDate =
    dateMode === 'range'
      ? toDateRaw ?? fromDate
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
    const currentFrom = filters.dateRange?.from;
    const currentTo = filters.dateRange?.to;
    if (!currentFrom) {
      set({ dateMode: mode, dateRange: undefined });
      return;
    }

    if (mode === 'single') {
      set({
        dateMode: mode,
        dateRange: {
          from: currentFrom,
          to: currentFrom,
        },
      });
      return;
    }

    if (mode === 'range') {
      set({
        dateMode: mode,
        dateRange: {
          from: currentFrom,
          to: currentTo ?? currentFrom,
        },
      });
      return;
    }

    set({
      dateMode: mode,
      dateRange: {
        from: currentFrom,
        to: undefined,
      },
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => set({ searchTerm: e.target.value })}
            placeholder="공고 제목으로 검색..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <button
          onClick={toggleFilters}
          className={cn(
            'px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors',
            showFilters
              ? 'bg-primary/10 border-primary text-primary'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          <FilterIcon className="size-5" />
          필터
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap gap-2 max-h-[5rem] overflow-hidden">
          {/* 전체 버튼 - 맨 왼쪽 */}
          <button
            type="button"
            onClick={handleAllClick}
            className={
              'rounded-md border px-3 py-1 text-xs shrink-0 ' +
              (isAllSelected
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-foreground border-border')
            }
          >
            전체
          </button>

          {/* 키워드 버튼들 - 모든 키워드 표시 */}
          {allCategories.map((c) => {
            const active = filters.categories.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCategory(c)}
                className={
                  'rounded-md border px-3 py-1 text-md shrink-0 ' +
                  (active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-foreground border-border')
                }
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>
      {showFilters && (
        <>
          <div className="my-4 h-px w-full bg-gray-200" />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="status" className="text-sm font-medium mb-2">
                모집 상태
              </Label>
              <select
                id="status"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={filters.status}
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

            <div className="flex flex-col gap-1">
              <Label htmlFor="payMin" className="text-sm font-medium mb-2">
                최소 급여
              </Label>
              <select
                id="payMin"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={filters.payMin ?? ''}
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

            <div className="flex flex-col gap-2 col-span-2">
              {showDatePicker ? (
                <div className="rounded-lg border p-4 space-y-4 w-full md:max-w-2xl">
                  <div className="flex items-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-sm font-normal border border-gray-300 rounded-md"
                      onClick={() => setShowDatePicker(false)}
                    >
                      날짜 선택 취소
                    </Button>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-full">
                      {dateMode === 'range' ? (
                        <Calendar
                          locale={ko}
                          mode="range"
                          selected={{
                            from: fromDate,
                            to: toDate ?? undefined,
                          }}
                          onSelect={(value: DateRange | undefined) =>
                            handleRangeApply(value)
                          }
                          numberOfMonths={1}
                          initialFocus
                        />
                      ) : (
                        <Calendar
                          locale={ko}
                          mode="single"
                          selected={fromDate}
                          onSelect={(value: Date | undefined) =>
                            handleRangeApply(
                              value
                                ? {
                                    from: value,
                                    to: value,
                                  }
                                : undefined
                            )
                          }
                          numberOfMonths={1}
                          initialFocus
                        />
                      )}
                    </div>
                    <div className="flex flex-col  gap-3 w-full">
                      <div className="flex flex-col gap-2">
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
                      <div className="text-sm text-gray-600">
                        {fromDate
                          ? dateMode === 'range' && toDate
                            ? `${format(fromDate, 'PPP', {
                                locale: ko,
                              })} ~ ${format(toDate, 'PPP', { locale: ko })}`
                            : dateMode === 'open-end'
                            ? `${format(fromDate, 'PPP', { locale: ko })} 이후`
                            : format(fromDate, 'PPP', { locale: ko })
                          : '선택된 날짜가 없습니다.'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-sm font-normal border border-gray-300 rounded-md"
                    onClick={() => setShowDatePicker(true)}
                  >
                    날짜 선택
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <Label>지역</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => set({ placeText: '' })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs',
                    !filters.placeText
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-foreground border-border'
                  )}
                >
                  전체 지역
                </button>
                {allLocations.map((loc) => {
                  const active = filters.placeText === loc;
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => set({ placeText: active ? '' : loc })}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs',
                        active
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-foreground border-border'
                      )}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({
              status: '',
              payMin: '',
              payMax: '',
              dateRange: undefined,
              toText: '',
              placeText: '',
              categories: [],
              showFilters: filters.showFilters,
              dateMode: filters.dateMode ?? 'single',
            })
          }
        >
          초기화
        </Button>
      </div>
    </div>
  );
}
