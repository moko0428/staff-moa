'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { FollowUserRow } from '../molecules/FollowUserRow';

interface Props {
  followingCount: number;
  followings: Array<{ userId: string; name: string | null; avatar: string | null; role: string }>;
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  onOpenProfile: (userId: string) => void;
  onRemove: (userId: string) => void;
}

export function FollowingsCard({
  followingCount,
  followings,
  isLoading,
  search,
  onSearchChange,
  onOpenProfile,
  onRemove,
}: Props) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between flex-row">
        <CardTitle>팔로잉</CardTitle>
        <Badge variant="secondary">{isLoading ? '...' : `${followingCount}명`}</Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : followings.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 팔로우한 매니저가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            <Input
              placeholder="팔로잉(매니저) 이름 검색"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {followings.length === 0 ? (
              <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
            ) : (
              <div className={followings.length >= 5 ? 'space-y-2 max-h-[360px] overflow-y-auto pr-1' : 'space-y-2'}>
                {followings.map((f) => (
                  <FollowUserRow
                    key={f.userId}
                    userId={f.userId}
                    name={f.name}
                    avatar={f.avatar}
                    role={f.role}
                    onOpen={onOpenProfile}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
