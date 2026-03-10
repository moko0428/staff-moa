'use client';

import { Button } from '@/app/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomActionBarProps {
  isMember: boolean;
  roleHydrated: boolean;
  status: 'recruiting' | 'completed' | 'urgent';
  hasApplied: boolean;
  isFavorite: boolean;
  onApply: () => void;
  onToggleFavorite: () => void;
}

const BottomActionBar = ({
  isMember,
  roleHydrated,
  status,
  hasApplied,
  isFavorite,
  onApply,
  onToggleFavorite,
}: BottomActionBarProps) => {
  if (!roleHydrated) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
      {isMember && (
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={onToggleFavorite}
          aria-label={isFavorite ? '관심 해제' : '관심 등록'}
        >
          <Heart
            className={cn(
              'size-5',
              isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground',
            )}
          />
        </Button>
      )}

      {isMember && status !== 'completed' && (
        <Button
          className="flex-1"
          size="lg"
          disabled={hasApplied}
          onClick={onApply}
        >
          {hasApplied ? '지원 완료' : '지원하기'}
        </Button>
      )}

      {status === 'completed' && (
        <div className="flex-1 flex items-center justify-center py-2 rounded-lg bg-muted">
          <p className="text-sm text-muted-foreground font-medium">모집이 완료되었습니다</p>
        </div>
      )}

      {!isMember && status !== 'completed' && (
        <Button className="flex-1" size="lg" onClick={onApply}>
          로그인 후 지원하기
        </Button>
      )}
    </div>
  );
};

export default BottomActionBar;
