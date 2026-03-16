'use client';

import { useMemo } from 'react';
import { Label } from '@/app/components/ui/label';
import { Calendar } from '@/app/components/ui/calendar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { type JobItem } from '@/app/components/JobCard';
import { Filters } from './PostingFilter';
import { formatLocationShort } from '../../utils/location';

interface DesktopFilterSidebarProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  allCategories: string[];
  allLocations: string[];
  allSalaries: number[];
  allItems: JobItem[];
}

export default function DesktopFilterSidebar({
  filters,
  onChange,
  allCategories,
  allLocations,
  allSalaries,
  allItems,
}: DesktopFilterSidebarProps) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const filteredActiveDates = useMemo(() => {
    return allItems
      .filter((job) => {
        if (job.status === '모집완료') return false;
        if (filters.status && job.status !== filters.status) return false;
        if (filters.payMin && Number(job.pay ?? 0) < Number(filters.payMin)) return false;
        if (filters.placeText && !(job.place ?? '').includes(filters.placeText)) return false;
        if (
          filters.categories.length > 0 &&
          !filters.categories.every((c) => job.categories.includes(c))
        ) return false;
        return true;
      })
      .flatMap((job) => (job.date ? [new Date(job.date)] : []))
      .filter((d) => !isNaN(d.getTime()));
  }, [allItems, filters.status, filters.payMin, filters.placeText, filters.categories]);

  const fromDate = filters.dateRange?.from
    ? new Date(filters.dateRange.from)
    : undefined;
  const toDate = filters.dateRange?.to
    ? new Date(filters.dateRange.to)
    : undefined;

  const handleSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      set({ dateRange: undefined });
      return;
    }
    set({
      dateRange: {
        from: format(range.from, 'yyyy-MM-dd'),
        to: range.to ? format(range.to, 'yyyy-MM-dd') : undefined,
      },
    });
  };

  return (
    <aside className="hidden sm:flex flex-col gap-5 w-80 shrink-0 pl-2">
      <div className="sticky top-16 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-4rem)] pb-6">
        <div className="grid grid-cols-2 gap-2">
          {/* 모집 상태 */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="sidebar-status" className="text-sm font-medium">
              모집 상태
            </Label>
            <select
              id="sidebar-status"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
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

          {/* 최소 급여 */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="sidebar-payMin" className="text-sm font-medium">
              최소 급여
            </Label>
            <select
              id="sidebar-payMin"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
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
        </div>

        {/* 날짜 */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">날짜</Label>
          <div className="rounded-lg border p-3 space-y-2">
            <Calendar
              locale={ko}
              mode="range"
              selected={{ from: fromDate, to: toDate }}
              onSelect={handleSelect}
              numberOfMonths={1}
              modifiers={{ active: filteredActiveDates }}
              modifiersClassNames={{ active: 'bg-accent' }}
            />
            <div className="text-xs text-muted-foreground">
              {fromDate
                ? toDate && toDate.getTime() !== fromDate.getTime()
                  ? `${format(fromDate, 'PPP', { locale: ko })} ~ ${format(toDate, 'PPP', { locale: ko })}`
                  : format(fromDate, 'PPP', { locale: ko })
                : '날짜를 선택하세요.'}
            </div>
          </div>
        </div>

        {/* 지역 */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">지역</Label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => set({ placeText: '' })}
              className={cn(
                'rounded-full border px-3 py-1 text-xs',
                !filters.placeText
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-foreground border-border',
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
                      : 'bg-muted text-foreground border-border',
                  )}
                >
                  {formatLocationShort(loc)}
                </button>
              );
            })}
          </div>
        </div>

        {/* 카테고리 */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">카테고리</Label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => set({ categories: [] })}
              className={cn(
                'rounded-md border px-3 py-1 text-xs',
                filters.categories.length === 0
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-foreground border-border',
              )}
            >
              전체
            </button>
            {allCategories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  const exists = filters.categories.includes(c);
                  set({
                    categories: exists
                      ? filters.categories.filter((x) => x !== c)
                      : [...filters.categories, c],
                  });
                }}
                className={cn(
                  'rounded-md border px-3 py-1 text-xs',
                  filters.categories.includes(c)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-foreground border-border',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
