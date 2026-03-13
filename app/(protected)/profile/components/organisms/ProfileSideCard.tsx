'use client';

import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Card, CardContent } from '@/app/components/ui/card';
import { Plus, X, Star } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ChangeEvent } from 'react';

type EffectiveRole = 'member' | 'manager' | 'admin' | 'pending_manager' | null;

const roleLabelMap: Partial<Record<string, string>> = {
  member: '스탭',
  manager: '매니저',
  admin: '관리자',
};

interface Props {
  name: string;
  photo?: string | null;
  effectiveRole: EffectiveRole;
  attendanceScore?: number | null;
  introduction?: string | null;
  isMember: boolean;
  isManagerType: boolean; // manager 또는 pending_manager
  companyName?: string | null;
  coverImage?: string | null;
  isEditing: boolean;
  isUploadingPhoto: boolean;
  isSaving: boolean;
  onToggleEdit: () => void;
  onNameChange: (value: string) => void;
  onIntroductionChange: (value: string) => void;
  onProfileImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveProfileImage: () => void;
}

export function ProfileSideCard({
  name,
  photo,
  effectiveRole,
  attendanceScore,
  introduction,
  isMember,
  isManagerType,
  companyName,
  coverImage,
  isEditing,
  isUploadingPhoto,
  onToggleEdit,
  onNameChange,
  onIntroductionChange,
  onProfileImageUpload,
  onRemoveProfileImage,
}: Props) {
  const avatarEditButtons = isEditing ? (
    <div className="absolute bottom-0 right-0 flex gap-1.5">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="rounded-full w-8 h-8 p-0 bg-background"
        onClick={() => document.getElementById('profile-image-upload')?.click()}
        disabled={isUploadingPhoto}
      >
        <Plus className="size-3.5" />
      </Button>
      {photo && (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="rounded-full w-8 h-8 p-0"
          onClick={onRemoveProfileImage}
          disabled={isUploadingPhoto}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  ) : null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">

        {isManagerType ? (
          <>
            {/* ── DESKTOP (lg+): 커버이미지 배너 + 아바타 오버랩 ── */}
            <div className="hidden lg:block">
              {/* 배너 */}
              <div className="relative h-36 w-full overflow-hidden">
                {coverImage ? (
                  <Image src={coverImage} alt="커버 이미지" fill className="object-cover" />
                ) : (
                  <div className="h-full bg-muted" />
                )}
              </div>
              {/* 아바타: 배너 아래로 절반 겹치게 */}
              <div className="flex justify-center -mt-12 relative z-10">
                <div className="relative">
                  <Avatar key={photo ?? 'no-photo'} className="w-24 h-24 border-4 border-background shadow-md">
                    <AvatarImage src={photo ?? undefined} alt={name} className="object-cover" />
                    <AvatarFallback className="text-xl">{name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {avatarEditButtons}
                </div>
              </div>
            </div>

            {/* ── MOBILE: 커버이미지와 아바타 같은 영역, 아바타 z-index 위 ── */}
            <div className="relative lg:hidden h-32 w-full overflow-hidden">
              {coverImage ? (
                <Image src={coverImage} alt="커버 이미지" fill className="object-cover" />
              ) : (
                <div className="h-full bg-muted" />
              )}
              {/* 아바타: 커버이미지 위에 z-index */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="relative">
                  <Avatar key={photo ?? 'no-photo'} className="w-20 h-20 border-4 border-background shadow-md">
                    <AvatarImage src={photo ?? undefined} alt={name} className="object-cover" />
                    <AvatarFallback className="text-xl">{name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {avatarEditButtons}
                </div>
              </div>
            </div>
          </>
        ) : null}

        <div className={cn(
          'flex flex-col items-center px-6 pb-6',
          isManagerType ? 'pt-3 lg:pt-4' : 'pt-6',
        )}>

          {/* 멤버/관리자: 일반 아바타 */}
          {!isManagerType && (
            <div className="relative mb-4">
              <Avatar key={photo ?? 'no-photo'} className="w-32 h-32">
                <AvatarImage src={photo ?? undefined} alt={name} className="object-cover" />
                <AvatarFallback className="text-2xl">{name.charAt(0)}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute bottom-0 right-0 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full w-10 h-10 p-0"
                    onClick={() => document.getElementById('profile-image-upload')?.click()}
                    disabled={isUploadingPhoto}
                  >
                    <Plus className="size-4" />
                  </Button>
                  {photo && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="rounded-full w-10 h-10 p-0"
                      onClick={onRemoveProfileImage}
                      disabled={isUploadingPhoto}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          <input
            id="profile-image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onProfileImageUpload}
          />

          {/* 이름 표시 */}
          {isManagerType ? (
            /* 매니저: 회사명(메인) + 담당자명(서브) */
            <div className="text-center mb-1">
              <h2 className="text-xl font-bold leading-tight">
                {companyName || name}
              </h2>
              {companyName && (
                <p className="text-sm text-muted-foreground mt-0.5">{name}</p>
              )}
            </div>
          ) : (
            /* 멤버/관리자: 개인 이름 */
            isEditing ? (
              <Input
                value={name ?? ''}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="이름"
                className="text-2xl font-bold h-12 text-center mb-2"
              />
            ) : (
              <h2 className="text-2xl font-bold mb-2">{name}</h2>
            )
          )}

          <Badge variant="outline" className="mb-4">
            {roleLabelMap[effectiveRole ?? ''] ?? effectiveRole}
          </Badge>

          {isMember && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Star className="size-5 text-yellow-500 fill-yellow-500" />
                <span className="text-lg font-semibold">{attendanceScore}점</span>
              </div>
              <div className="w-full pb-4 flex items-center justify-center">
                {isEditing ? (
                  <Textarea
                    value={introduction ?? ''}
                    placeholder="자신을 어필해보세요!"
                    rows={3}
                    onChange={(e) => onIntroductionChange(e.target.value)}
                    className="resize-none text-sm"
                  />
                ) : (
                  <p className="text-sm leading-relaxed">{introduction || '-'}</p>
                )}
              </div>
            </>
          )}

          <Button className="w-full" onClick={onToggleEdit}>
            {isEditing ? '편집 취소' : '프로필 수정'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
