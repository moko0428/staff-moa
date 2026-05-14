'use client';

import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Users } from 'lucide-react';
import UserAvatar from '@/app/common/components/UserAvatar';

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
  onOpenProfile,
  onRemove,
}: Props) {
  return (
    <Card>
      <CardContent className="p-4">
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <Users className="size-4 text-red-500" />
          </div>
          <span className="font-bold flex-1">
            팔로우한 매니저
            {followingCount > 0 && (
              <span className="text-muted-foreground font-normal text-sm ml-2">
                {isLoading ? '...' : `${followingCount}곳`}
              </span>
            )}
          </span>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-2">불러오는 중...</p>
        ) : followings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">아직 팔로우한 매니저가 없습니다.</p>
        ) : (
          <div className="divide-y divide-border">
            {followings.map((f) => (
              <div key={f.userId} className="flex items-center gap-3 py-3">
                <button
                  type="button"
                  className="shrink-0"
                  onClick={() => onOpenProfile(f.userId)}
                >
                  <UserAvatar
                    src={f.avatar}
                    name={f.name}
                    className="w-10 h-10"
                    fallbackClassName="text-base"
                  />
                </button>
                <button
                  type="button"
                  className="flex-1 min-w-0 text-left"
                  onClick={() => onOpenProfile(f.userId)}
                >
                  <p className="text-sm font-semibold truncate">{f.name || '-'}</p>
                  <p className="text-xs text-muted-foreground">매니저</p>
                </button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-xs h-8"
                  onClick={() => onRemove(f.userId)}
                >
                  팔로잉
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
