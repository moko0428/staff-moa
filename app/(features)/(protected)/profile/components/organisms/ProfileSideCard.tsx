'use client';

import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Card, CardContent } from '@/app/components/ui/card';
import { Plus, X, Star } from 'lucide-react';
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
  isEditing,
  isUploadingPhoto,
  onToggleEdit,
  onNameChange,
  onIntroductionChange,
  onProfileImageUpload,
  onRemoveProfileImage,
}: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <Avatar className="w-32 h-32">
              {photo ? <img src={photo} alt={name} className="w-full h-full object-cover rounded-full" /> : null}
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
            <input
              id="profile-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onProfileImageUpload}
            />
          </div>

          {isEditing ? (
            <Input
              value={name ?? ''}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="이름"
              className="text-2xl font-bold h-12 text-center mb-2"
            />
          ) : (
            <h2 className="text-2xl font-bold mb-2">{name}</h2>
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
