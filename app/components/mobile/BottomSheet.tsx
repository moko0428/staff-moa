'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  heightPx: number;
  minHeightPx?: number;
  maxHeightPx?: number;
  fallbackHeight?: string;
  className?: string;
  children: React.ReactNode;
  onHeightChange?: (newHeight: number) => void;
}

export function BottomSheet({
  heightPx,
  minHeightPx = 200,
  maxHeightPx,
  fallbackHeight = '50dvh',
  className,
  children,
  onHeightChange,
}: BottomSheetProps) {
  const dragRef = React.useRef<{
    isDragging: boolean;
    startY: number;
    startHeight: number;
  }>({ isDragging: false, startY: 0, startHeight: 0 });

  const [isDragging, setIsDragging] = React.useState(false);

  const clampHeight = React.useCallback(
    (h: number) => {
      let clamped = Math.max(minHeightPx, h);
      if (maxHeightPx !== undefined) {
        clamped = Math.min(maxHeightPx, clamped);
      }
      return Math.round(clamped);
    },
    [minHeightPx, maxHeightPx]
  );

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      dragRef.current = {
        isDragging: true,
        startY: e.clientY,
        startHeight: heightPx,
      };
      setIsDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [heightPx]
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current.isDragging) return;
      e.preventDefault();
      const deltaY = e.clientY - dragRef.current.startY;
      const newHeight = clampHeight(dragRef.current.startHeight - deltaY);
      onHeightChange?.(newHeight);
    },
    [clampHeight, onHeightChange]
  );

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current.isDragging) return;
      dragRef.current.isDragging = false;
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    []
  );

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-20 rounded-t-2xl border bg-background shadow-lg overscroll-none',
        !isDragging && 'transition-[height] duration-400 ease-in-out',
        className
      )}
      style={{
        height: heightPx ? `${heightPx}px` : fallbackHeight,
      }}
    >
      <div className="h-full flex flex-col">
        <div
          className="flex items-center justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="h-1.5 w-10 rounded-full bg-muted" />
        </div>
        <div className="flex-1 overflow-y-auto overscroll-none px-4 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
