'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { User, UserPlus, UserMinus } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    photo?: string | null;
    role: string;
    introduction?: string | null;
    attendanceScore?: number | null;
  };
  currentUserId?: string; // 현재 로그인한 사용자 ID (자신은 팔로우 불가)
  isFollowing?: boolean;
  onFollowToggle?: () => void | Promise<void>;
}

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'admin':
      return { label: '관리자', className: 'bg-red-100 text-red-700 border-red-200' };
    case 'manager':
      return { label: '매니저', className: 'bg-blue-100 text-blue-700 border-blue-200' };
    case 'pending_manager':
      return { label: '매니저 승인 대기', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    case 'member':
    default:
      return { label: '스탭', className: 'bg-green-100 text-green-700 border-green-200' };
  }
};

export default function ProfileModal({
  isOpen,
  onClose,
  user,
  currentUserId,
  isFollowing = false,
  onFollowToggle,
}: ProfileModalProps) {
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const roleBadge = getRoleBadge(user.role);
  const isOwnProfile = currentUserId === user.id;

  const handleFollowToggle = async () => {
    if (!onFollowToggle) return;

    setIsLoadingFollow(true);
    try {
      await onFollowToggle();
    } finally {
      setIsLoadingFollow(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">프로필</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* 아바타 */}
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={user.photo ?? undefined}
              alt={user.name ?? '사용자'}
            />
            <AvatarFallback className="text-2xl">
              {user.name?.at(0) ?? <User className="h-12 w-12" />}
            </AvatarFallback>
          </Avatar>

          {/* 이름과 역할 */}
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-xl font-semibold">
              {user.name ?? '알 수 없음'}
            </h3>
            <Badge variant="outline" className={roleBadge.className}>
              {roleBadge.label}
            </Badge>
          </div>

          {/* 이메일 */}
          {user.email && (
            <p className="text-sm text-muted-foreground">{user.email}</p>
          )}

          {/* 근태 점수 (스탭인 경우) */}
          {user.role === 'member' && user.attendanceScore !== undefined && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                근태 점수: {user.attendanceScore}점
              </Badge>
            </div>
          )}

          {/* 자기소개 */}
          {user.introduction && (
            <div className="w-full mt-2 p-4 bg-muted rounded-lg">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {user.introduction}
              </p>
            </div>
          )}

          {/* 팔로우 버튼 */}
          {!isOwnProfile && onFollowToggle && (
            <Button
              onClick={handleFollowToggle}
              disabled={isLoadingFollow}
              variant={isFollowing ? 'outline' : 'default'}
              className="w-full mt-2"
            >
              {isLoadingFollow ? (
                '처리 중...'
              ) : isFollowing ? (
                <>
                  <UserMinus className="h-4 w-4 mr-2" />
                  팔로우 취소
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  팔로우
                </>
              )}
            </Button>
          )}

          {/* 자신의 프로필인 경우 */}
          {isOwnProfile && (
            <p className="text-xs text-muted-foreground mt-2">내 프로필입니다</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
