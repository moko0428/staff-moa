'use client';

import { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/app/components/ui/label';

interface CategoryTagListProps {
  allCategories: string[];
  selected: string[];
  onChange: (categories: string[]) => void;
}

export default function CategoryTagList({
  allCategories,
  selected,
  onChange,
}: CategoryTagListProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollWidth <= el.clientWidth) return;

    const rawDelta =
      Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const multiplier =
      e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientWidth : 1;
    const delta = rawDelta * multiplier;
    const maxLeft = el.scrollWidth - el.clientWidth;
    const nextLeft = el.scrollLeft + delta;
    const canScroll =
      (delta > 0 && el.scrollLeft < maxLeft) ||
      (delta < 0 && el.scrollLeft > 0);

    if (!canScroll) return;
    e.preventDefault();
    el.scrollLeft = Math.max(0, Math.min(maxLeft, nextLeft));
  }, []);

  const toggle = (c: string) => {
    const exists = selected.includes(c);
    onChange(exists ? selected.filter((x) => x !== c) : [...selected, c]);
  };

  if (allCategories.length === 0) return null;

  const isAllSelected = selected.length === 0;

  return (
    <div
      ref={scrollRef}
      onWheel={handleWheel}
      className="overflow-x-auto overflow-y-hidden"
    >
      <Label htmlFor="category-tag-list" className="text-sm font-medium mb-2">
        카테고리
      </Label>
      <div className="flex flex-nowrap gap-2 pb-1">
        <button
          type="button"
          onClick={() => onChange([])}
          className={cn(
            'rounded-md border px-3 py-1 text-xs shrink-0',
            isAllSelected
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
            onClick={() => toggle(c)}
            className={cn(
              'rounded-md border px-3 py-1 text-xs shrink-0',
              selected.includes(c)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-foreground border-border',
            )}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
