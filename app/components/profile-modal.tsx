'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { UserPlus, UserMinus } from 'lucide-react';
import UserAvatar from '@/app/common/components/UserAvatar';
import Image from 'next/image';
import DefaultCoverImage from '@/app/common/components/DefaultCoverImage';

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
    followerCount?: number;
    companyName?: string | null;
    companyVerifyStatus?: string | null;
    coverImage?: string | null;
  };
  currentUserId?: string; // 현재 로그인한 사용자 ID (자신은 팔로우 불가)
  isFollowing?: boolean;
  onFollowToggle?: () => void | Promise<void>;
}

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'admin':
      return {
        label: '관리자',
        className: 'bg-red-100 text-red-700 border-red-200',
      };
    case 'manager':
      return {
        label: '매니저',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
      };
    case 'pending_manager':
      return {
        label: '매니저 승인 대기',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      };
    case 'member':
    default:
      return {
        label: '스탭',
        className: 'bg-green-100 text-green-700 border-green-200',
      };
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
          <DialogTitle></DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* 커버 이미지 배너 */}
          {user.coverImage ? (
            <div className="relative h-36 w-full overflow-hidden rounded-t-lg -mt-4 -mx-6" style={{ width: 'calc(100% + 3rem)' }}>
              <Image src={user.coverImage} alt="커버 이미지" fill className="object-cover" />
            </div>
          ) : (
            <DefaultCoverImage
              className="h-36 rounded-t-lg -mt-4 -mx-6"
              style={{ width: 'calc(100% + 3rem)' }}
            />
          )}

          {/* 아바타 — 배너 아래로 겹치게 */}
          <UserAvatar
            src={user.photo}
            name={user.name}
            className="-mt-16 ml-2 shadow-lg h-24 w-24 border-4 border-background"
            fallbackClassName="text-2xl"
          />

          {/* 이름과 역할 */}
          <div className="flex items-center gap-2">
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

          {/* 스코어 (스탭인 경우) */}
          {user.role === 'member' && user.attendanceScore !== undefined && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                스코어: {user.attendanceScore}점
              </Badge>
            </div>
          )}

          {/* 팔로워 수 (매니저인 경우) */}
          {user.role === 'manager' &&
            typeof user.followerCount === 'number' && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  팔로워 {user.followerCount}명
                </Badge>
              </div>
            )}

          {/* 회사 정보 (매니저인 경우) */}
          {user.role === 'manager' && user.companyName && (
            <div className="w-full mt-1 p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">회사 정보</p>
              <p className="text-sm text-muted-foreground">
                {user.companyName}
              </p>
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
            <p className="text-xs text-muted-foreground mt-2">
              내 프로필입니다
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
