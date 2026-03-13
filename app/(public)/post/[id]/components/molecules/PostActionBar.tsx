import { Button } from '@/app/components/ui/button';
import { ArrowLeft, Share2, Flag, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostActionBarProps {
  isMember: boolean;
  roleHydrated: boolean;
  currentUserId: string | null;
  authorId: string;
  hasReported: boolean;
  onBack: () => void;
  onDelete: () => void;
  onShare: () => void;
  onReport: () => void;
}

const PostActionBar = ({
  roleHydrated,
  currentUserId,
  authorId,
  hasReported,
  onBack,
  onDelete,
  onShare,
  onReport,
}: PostActionBarProps) => (
  <div className="flex items-center justify-between mb-4">
    <Button variant="ghost" size="sm" onClick={onBack}>
      <ArrowLeft className="size-4 mr-2" />
    </Button>
    <div className="flex items-center gap-2">
      {roleHydrated && currentUserId && authorId === currentUserId && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="hover:bg-destructive/10"
          title="공고 삭제"
        >
          <Trash2 className="size-5 text-destructive" />
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={onShare}>
        <Share2 className="size-5 text-muted-foreground" />
      </Button>
      {roleHydrated && currentUserId && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onReport}
          disabled={hasReported}
          className={cn(
            'hover:bg-destructive/10',
            hasReported && 'opacity-50 cursor-not-allowed',
          )}
          title={hasReported ? '이미 신고한 게시물입니다' : '게시물 신고'}
        >
          <Flag
            className={cn(
              'size-5',
              hasReported
                ? 'fill-destructive text-destructive'
                : 'text-muted-foreground hover:text-destructive',
            )}
          />
        </Button>
      )}
    </div>
  </div>
);

export default PostActionBar;
