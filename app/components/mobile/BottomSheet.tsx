'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  heightPx: number;
  fallbackHeight?: string;
  className?: string;
  children: React.ReactNode;
}

export function BottomSheet({
  heightPx,
  fallbackHeight = '50dvh',
  className,
  children,
}: BottomSheetProps) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-20 rounded-t-2xl border bg-background shadow-lg transition-[height] duration-400 ease-in-out',
        className
      )}
      style={{
        height: heightPx ? `${heightPx}px` : fallbackHeight,
      }}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-center pt-2">
          <div className="h-1.5 w-10 rounded-full bg-muted" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6">{children}</div>
      </div>
    </div>
  );
}
