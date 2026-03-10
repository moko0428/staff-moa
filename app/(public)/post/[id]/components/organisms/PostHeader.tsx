import { Card, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import { Building2, ChevronRight, User2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PostData } from '../../types';
import {
  getStatusBadge,
  formatKstDateTime,
} from '../../utils/post-detail-helpers';

const getContactLabel = (type?: string) => {
  switch (type) {
    case 'kakao':
      return '카카오톡';
    case 'email':
      return '이메일';
    case 'other':
      return '연락처';
    default:
      return '전화번호';
  }
};

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
          <Badge
            variant="outline"
            className={cn('text-sm', statusBadge.className)}
          >
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
              'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
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
            <ChevronRight className="size-3 text-muted-foreground" />
          </button>
          <p className="ml-auto text-xs text-muted-foreground">
            작성일자:{' '}
            {post.created_at ? formatKstDateTime(post.created_at) : '-'}
          </p>
        </div>

        {(post.manager_name || post.manager_phone) && (
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
            {post.manager_name && (
              <div className="flex items-center gap-2">
                <User2 className="size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">{post.manager_name}</p>
                </div>
              </div>
            )}
            {post.manager_phone && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {getContactLabel(post.manager_contact_type)}
                  </p>
                  {post.manager_contact_type === 'email' ? (
                    <a
                      href={`mailto:${post.manager_phone}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {post.manager_phone}
                    </a>
                  ) : post.manager_contact_type === 'phone' ||
                    !post.manager_contact_type ? (
                    <a
                      href={`tel:${post.manager_phone}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {post.manager_phone}
                    </a>
                  ) : (
                    <p className="text-sm font-medium">{post.manager_phone}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardHeader>
    </Card>
  );
};

export default PostHeader;
