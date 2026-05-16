'use client';

import UserAvatar from '@/app/common/components/UserAvatar';
import { Card, CardContent } from '@/app/components/ui/card';
import { ShieldCheck, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, type ChangeEvent } from 'react';
import Image from 'next/image';
import { TRUST_SCORE_LABEL } from '@/lib/trust-score';

type EffectiveRole = 'member' | 'manager' | 'admin' | 'pending_manager' | null;

const roleLabelMap: Partial<Record<string, string>> = {
  member: '스탭',
  manager: '매니저',
  admin: '관리자',
  pending_manager: '매니저(승인대기)',
};

const getScoreTrust = (score: number | null | undefined) => {
  if (score == null) return { label: '점수 없음', color: 'text-muted-foreground' };
  if (score >= 81) return { label: `${TRUST_SCORE_LABEL} 우수`, color: 'text-emerald-600' };
  if (score >= 61) return { label: `${TRUST_SCORE_LABEL} 양호`, color: 'text-primary' };
  if (score >= 41) return { label: `${TRUST_SCORE_LABEL} 보통`, color: 'text-amber-600' };
  return { label: `${TRUST_SCORE_LABEL} 주의`, color: 'text-red-600' };
};

const ScoreCircle = ({ score }: { score: number }) => {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const targetOffset = circ - (Math.min(Math.max(score, 0), 100) / 100) * circ;

  // 스트로크: 초기엔 빈 원(circ)에서 시작 → rAF 이후 CSS transition으로 부드럽게 채움
  const [strokeOffset, setStrokeOffset] = useState(circ);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setStrokeOffset(targetOffset));
    return () => cancelAnimationFrame(raf);
  }, [targetOffset]);

  // 숫자 카운터: 항상 0에서 score까지 easeOut 애니메이션
  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => {
    setDisplayScore(0);
    if (score === 0) return;

    const duration = 800;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayScore(Math.round(score * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div className="relative shrink-0 w-[88px] h-[88px]">
      <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
        <circle
          cx="44" cy="44" r={r}
          fill="none"
          style={{ stroke: 'var(--muted)' }}
          strokeWidth="9"
        />
        <circle
          cx="44" cy="44" r={r}
          fill="none"
          style={{
            stroke: 'var(--primary)',
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          strokeWidth="9"
          strokeDasharray={circ}
          strokeDashoffset={strokeOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold leading-none">{displayScore}</span>
        <span className="text-[11px] text-muted-foreground leading-none mt-0.5">/100</span>
      </div>
    </div>
  );
};

interface Props {
  name: string;
  photo?: string | null;
  effectiveRole: EffectiveRole;
  attendanceScore?: number | null;
  introduction?: string | null;
  isMember: boolean;
  isManagerType: boolean;
  companyName?: string | null;
  coverImage?: string | null;
  isEditing: boolean;
  isUploadingPhoto: boolean;
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
  onNameChange,
  onIntroductionChange,
  onProfileImageUpload,
  onRemoveProfileImage,
}: Props) {
  const displayName = isManagerType ? (companyName || name) : name;
  const roleLabel = roleLabelMap[effectiveRole ?? ''] ?? effectiveRole;
  const { label: trustLabel, color: trustColor } = getScoreTrust(attendanceScore);

  return (
    <Card className="overflow-hidden">
      {isManagerType && coverImage && (
        <div className="relative h-28 w-full overflow-hidden">
          <Image src={coverImage} alt="커버 이미지" fill className="object-cover" />
        </div>
      )}

      <CardContent className="p-4">
        {/* 상단: 아바타 + 정보 */}
        <div className="flex gap-4 items-start">
          <div className="relative shrink-0">
            <UserAvatar
              key={photo ?? 'no-photo'}
              src={photo}
              name={displayName}
              className="w-[72px] h-[72px]"
              fallbackClassName="text-2xl"
            />
            {isEditing && (
              <div className="absolute -bottom-1 -right-1 flex gap-1">
                <button
                  type="button"
                  className="w-6 h-6 rounded-full bg-background border border-border shadow flex items-center justify-center"
                  onClick={() => document.getElementById('profile-image-upload')?.click()}
                  disabled={isUploadingPhoto}
                >
                  <Plus className="size-3" />
                </button>
                {photo && (
                  <button
                    type="button"
                    className="w-6 h-6 rounded-full bg-destructive shadow flex items-center justify-center"
                    onClick={onRemoveProfileImage}
                    disabled={isUploadingPhoto}
                  >
                    <X className="size-3 text-destructive-foreground" />
                  </button>
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

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="이름"
                className="text-xl font-bold w-full border-b border-border outline-none bg-transparent pb-0.5"
              />
            ) : (
              <h2 className="text-xl font-bold truncate">{displayName}</h2>
            )}
            <p className="text-sm text-muted-foreground mt-1">{roleLabel}</p>
            {isEditing ? (
              <textarea
                value={introduction ?? ''}
                onChange={(e) => onIntroductionChange(e.target.value)}
                placeholder="자신을 소개해주세요"
                rows={2}
                className="text-sm w-full border border-border rounded-md px-2 py-1 mt-2 resize-none outline-none bg-transparent text-foreground"
              />
            ) : (
              introduction && (
                <p className="text-sm text-muted-foreground mt-1.5 leading-snug">{introduction}</p>
              )
            )}
          </div>
        </div>

        {/* 신뢰점수 - 멤버 전용 */}
        {isMember && (
          <>
            <div className="mt-4 mb-4 border-t border-border" />
            <div className="flex gap-4 items-center">
              <ScoreCircle score={attendanceScore ?? 0} />
              <div className="flex-1 min-w-0">
                <div className={cn('flex items-center gap-1.5 font-semibold text-sm', trustColor)}>
                  <ShieldCheck className="size-4 shrink-0" />
                  <span>{trustLabel}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {(attendanceScore ?? 0) < 41
                    ? '프로필 정보를 누락없이 입력하면 점수가 부여됩니다.'
                    : '별탈 없이 근무할수록 점수가 올라가요. 매니저 평가가 반영됩니다.'}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
