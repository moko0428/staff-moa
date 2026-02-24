import { Card, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PostData } from '../../types';
import { getStatusBadge, formatKstDateTime } from '../../utils/post-detail-helpers';

interface PostHeaderProps {
  post: PostData;
  onAuthorClick: () => void;
}

const PostHeader = ({ post, onAuthorClick }: PostHeaderProps) => {
  const statusBadge = getStatusBadge(post.status);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={cn('text-sm', statusBadge.className)}>
            {statusBadge.label}
          </Badge>
          {post.keywords?.map((keyword) => (
            <Badge key={keyword} variant="secondary" className="text-xs">
              {keyword}
            </Badge>
          ))}
        </div>
        <CardTitle className="text-2xl">{post.title}</CardTitle>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t">
          <button
            type="button"
            onClick={onAuthorClick}
            className={cn(
              'flex items-center gap-3 rounded-md px-1 py-1 -ml-1 transition-colors',
              'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
            aria-label="작성자 프로필 보기"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author_avatar} alt={post.author_name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {post.author_name?.charAt(0) || 'M'}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="font-medium text-sm">
                {post.author_name || post.manager_name}
              </p>
              {post.company_name && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="size-3" />
                  {post.company_name}
                </p>
              )}
            </div>
          </button>
          <p className="ml-auto text-xs text-muted-foreground">
            작성일자: {post.created_at ? formatKstDateTime(post.created_at) : '-'}
          </p>
        </div>
      </CardHeader>
    </Card>
  );
};

export default PostHeader;
