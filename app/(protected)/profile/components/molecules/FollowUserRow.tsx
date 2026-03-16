'use client';

import { Button } from '@/app/components/ui/button';
import UserAvatar from '@/app/common/components/UserAvatar';

type RoleType = 'member' | 'manager' | 'admin' | string;

const roleLabel: Record<string, string> = {
  member: '스탭',
  manager: '매니저',
  admin: '관리자',
};

interface Props {
  userId: string;
  name: string | null;
  avatar: string | null;
  role: RoleType;
  onOpen: (userId: string) => void;
  onRemove: (userId: string) => void;
  removeLabel?: string;
}

export function FollowUserRow({ userId, name, avatar, role, onOpen, onRemove, removeLabel = '삭제' }: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(userId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(userId);
        }
      }}
      className="flex items-center justify-between gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent"
    >
      <div className="min-w-0 flex items-center gap-3">
        <UserAvatar src={avatar} name={name || 'U'} className="size-10" />
        <div className="min-w-0">
          <p className="font-medium truncate">{name || '이름 없음'}</p>
          <p className="text-xs text-muted-foreground">{roleLabel[role] ?? role}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(userId);
        }}
      >
        {removeLabel}
      </Button>
    </div>
  );
}
