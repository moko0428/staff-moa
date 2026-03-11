'use client';

import { useState, useEffect } from 'react';
import { ArrowUp, RefreshCw } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  onRefresh: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export default function FloatingButtons({ onRefresh, isRefreshing, className }: Props) {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handler = () => setShowTop(window.scrollY > 300);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className={cn('fixed bottom-6 right-4 z-30 flex flex-col items-center gap-2', className)}>
      {showTop && (
        <Button
          size="icon"
          variant="secondary"
          className="size-10 rounded-full shadow-md"
          onClick={scrollToTop}
          aria-label="맨 위로"
        >
          <ArrowUp className="size-4" />
        </Button>
      )}
      <Button
        size="icon"
        variant="secondary"
        className="size-10 rounded-full shadow-md"
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="새로고침"
      >
        <RefreshCw className={cn('size-4', isRefreshing && 'animate-spin')} />
      </Button>
    </div>
  );
}
