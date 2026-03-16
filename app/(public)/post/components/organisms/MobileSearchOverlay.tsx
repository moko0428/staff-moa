'use client';

import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/app/components/ui/calendar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import CategoryTagList from '../molecules/CategoryTagList';
import { Filters } from './PostingFilter';
import { type JobItem } from '@/app/components/JobCard';
import { formatLocationShort } from '../../utils/location';

interface MobileSearchOverlayProps {
  initialFilters: Filters;
  allCategories: string[];
  allLocations: string[];
  allSalaries: number[];
  allItems: JobItem[];
  onClose: () => void;
  onApply: (f: Filters) => void;
  mode?: 'fullscreen' | 'panel';
}

export default function MobileSearchOverlay({
  initialFilters,
  allCategories,
  allLocations,
  allSalaries,
  allItems,
  onClose,
  onApply,
  mode = 'fullscreen',
}: MobileSearchOverlayProps) {
  const [draftFilters, setDraftFilters] = useState<Filters>(initialFilters);

  const set = (patch: Partial<Filters>) =>
    setDraftFilters((prev) => ({ ...prev, ...patch }));

  const filteredActiveDates = useMemo(() => {
    return allItems
      .filter((job) => {
        if (job.status === '모집완료') return false;
        if (draftFilters.searchTerm?.trim()) {
          const q = draftFilters.searchTerm.trim().toLowerCase();
          const matched =
            job.title.toLowerCase().includes(q) ||
            (job.content ?? '').toLowerCase().includes(q) ||
            (job.place ?? '').toLowerCase().includes(q) ||
            job.categories.join(' ').toLowerCase().includes(q);
          if (!matched) return false;
        }
        if (draftFilters.status && job.status !== draftFilters.status) return false;
        if (draftFilters.payMin && Number(job.pay ?? 0) < Number(draftFilters.payMin)) return false;
        if (draftFilters.placeText && !(job.place ?? '').includes(draftFilters.placeText)) return false;
        if (
          draftFilters.categories.length > 0 &&
          !draftFilters.categories.every((c) => job.categories.includes(c))
        ) return false;
        return true;
      })
      .flatMap((job) => (job.date ? [new Date(job.date)] : []))
      .filter((d) => !isNaN(d.getTime()));
  }, [allItems, draftFilters.searchTerm, draftFilters.status, draftFilters.payMin, draftFilters.placeText, draftFilters.categories]);

  const fromDate = draftFilters.dateRange?.from
    ? new Date(draftFilters.dateRange.from)
    : undefined;
  const toDate = draftFilters.dateRange?.to
    ? new Date(draftFilters.dateRange.to)
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

  const matchedItems = useMemo(() => {
    return allItems.filter((job) => {
      if (draftFilters.searchTerm?.trim()) {
        const q = draftFilters.searchTerm.trim().toLowerCase();
        const matched =
          job.title.toLowerCase().includes(q) ||
          (job.content ?? '').toLowerCase().includes(q) ||
          (job.place ?? '').toLowerCase().includes(q) ||
          job.categories.join(' ').toLowerCase().includes(q);
        if (!matched) return false;
      }
      if (draftFilters.status && job.status !== draftFilters.status) return false;
      if (draftFilters.payMin && Number(job.pay ?? 0) < Number(draftFilters.payMin)) return false;
      if (draftFilters.dateRange?.from) {
        const jobDate = new Date(job.date ?? '');
        const from = new Date(draftFilters.dateRange.from);
        const to = new Date(draftFilters.dateRange.to ?? draftFilters.dateRange.from);
        if (jobDate.setHours(0, 0, 0, 0) < from.setHours(0, 0, 0, 0)) return false;
        if (jobDate > to) return false;
      }
      if (draftFilters.placeText && !(job.place ?? '').includes(draftFilters.placeText)) return false;
      if (
        draftFilters.categories.length > 0 &&
        !draftFilters.categories.every((c) => job.categories.includes(c))
      ) return false;
      return true;
    });
  }, [allItems, draftFilters]);

  const recruitCount = matchedItems.filter((j) => j.status === '모집').length;
  const urgentCount = matchedItems.filter((j) => j.status === '급구').length;

  const filterBody = (
    <>
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
        {mode === 'fullscreen' ? (
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
        ) : (
          <span className="text-sm font-medium">필터</span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-4 space-y-5 overflow-hidden">
        {/* Date + Status/Pay grid */}
        <div className="grid grid-cols-2 gap-3 items-start">
          {/* Date picker */}
          <div className="flex flex-col col-span-1 gap-1">
            <div className="border rounded-lg overflow-hidden space-y-1 pb-2">
              <Calendar
                locale={ko}
                mode="range"
                selected={{ from: fromDate, to: toDate }}
                onSelect={handleSelect}
                numberOfMonths={1}
                modifiers={{ active: filteredActiveDates }}
                modifiersClassNames={{ active: 'bg-accent' }}
                className="[--cell-size:--spacing(6)] p-2"
                classNames={{ caption_label: 'text-xs' }}
              />
              <div className="text-xs text-muted-foreground px-3">
                {fromDate
                  ? toDate && toDate.getTime() !== fromDate.getTime()
                    ? `${format(fromDate, 'M/d')} ~ ${format(toDate, 'M/d')}`
                    : format(fromDate, 'PPP', { locale: ko })
                  : '날짜 선택'}
              </div>
            </div>
          </div>

          {/* Status + Pay */}
          <div className="flex flex-col col-span-1 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="overlay-status" className="text-sm font-medium">
                모집 상태
              </Label>
              <select
                id="overlay-status"
                className="w-full px-2 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
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

            <div className="flex flex-col gap-1">
              <Label htmlFor="overlay-payMin" className="text-sm font-medium">
                최소 급여
              </Label>
              <select
                id="overlay-payMin"
                className="w-full px-2 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                value={draftFilters.payMin ?? ''}
                onChange={(e) => set({ payMin: e.target.value })}
              >
                <option value="">전체</option>
                {allSalaries.map((salary) => (
                  <option key={salary} value={salary.toString()}>
                    {salary >= 10000
                      ? `${(salary / 10000).toFixed(0)}만원↑`
                      : `${salary.toLocaleString()}원↑`}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
                  {formatLocationShort(loc)}
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
      <div className="shrink-0 px-4 pt-2 pb-3 border-t border-border space-y-2">
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>총 <strong className="text-foreground">{matchedItems.length}</strong>개</span>
          {recruitCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-primary" />
              모집 <strong className="text-foreground">{recruitCount}</strong>건
            </span>
          )}
          {urgentCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-destructive" />
              급구 <strong className="text-foreground">{urgentCount}</strong>건
            </span>
          )}
        </div>
        <Button
          type="button"
          className="w-full"
          onClick={() => onApply(draftFilters)}
        >
          검색하기
        </Button>
      </div>
    </>
  );

  if (mode === 'panel') {
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div className="absolute top-full left-0 right-0 z-50 bg-background border-b shadow-lg flex flex-col max-h-[calc(100vh-4rem)] overflow-hidden">
          {filterBody}
        </div>
      </>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {filterBody}
    </div>,
    document.body,
  );
}
