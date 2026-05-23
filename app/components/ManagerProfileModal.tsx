'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import {
  ShieldCheck,
  Briefcase,
  PenLine,
  Tag,
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Building2,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import UserAvatar from '@/app/common/components/UserAvatar';
import { cn } from '@/lib/utils';

// ── 타입 ────────────────────────────────────────────────

export interface ManagerProfileData {
  id: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  role: string;
  introduction: string | null;
  attendanceScore: number | null;
  followerCount: number;
  companyName: string | null;
  companyVerifyStatus: string | null;
  coverImage: string | null;
  phone: string | null;
  kakaoId: string | null;
  position: string | null;
  managerType: string | null;
  address: string | null;
  website: string | null;
  foundedYear: string | null;
  specialties: string[];
  activityRegions: string[];
  profileVisibility: { email: boolean; phone: boolean; kakaoId: boolean };
}

interface ManagerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ManagerProfileData;
  currentUserId?: string;
  isFollowing?: boolean;
  onFollowToggle?: () => void | Promise<void>;
}

// ── 내부 레이아웃 컴포넌트 ──────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  count,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  count?: string;
}) {
  return (
    <div className="px-4 pt-4 pb-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
          <Icon className="size-4 text-red-500" />
        </div>
        <span className="font-bold text-sm">{title}</span>
        {count && <span className="text-sm text-muted-foreground">{count}</span>}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1.5 ml-9">{subtitle}</p>
      )}
    </div>
  );
}

function InfoRow({
  label,
  alignTop = false,
  children,
}: {
  label: string;
  alignTop?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-2.5 border-t border-border',
        alignTop ? 'items-start' : 'items-center'
      )}
    >
      <span
        className={cn(
          'w-20 shrink-0 text-sm text-muted-foreground',
          alignTop && 'pt-2'
        )}
      >
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-border">
      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
        <Icon className="size-4 text-red-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────

export default function ManagerProfileModal({
  isOpen,
  onClose,
  user,
  currentUserId,
  isFollowing = false,
  onFollowToggle,
}: ManagerProfileModalProps) {
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);

  const isOwnProfile = currentUserId === user.id;
  const isVerified = user.companyVerifyStatus === 'approved';
  const isCompany = user.managerType !== 'personal';
  const managerTypeLabel = isCompany ? '컴퍼니 매니저' : '퍼스널 매니저';

  const visibleEmail = user.profileVisibility.email && user.email;
  const visiblePhone = user.profileVisibility.phone && user.phone;
  const visibleKakaoId = user.profileVisibility.kakaoId && user.kakaoId;
  const hasAnyContact = visibleEmail || visiblePhone || visibleKakaoId;

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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>{user.name ?? '매니저 프로필'}</DialogTitle>
        </DialogHeader>

        {/* 스크롤 영역 */}
        <div className="overflow-y-auto flex-1">
          <div className="bg-muted pb-6">

            {/* ── 히어로 ── */}
            <div className="relative">
              {/* 커버 */}
              <div className="relative h-36 w-full overflow-hidden">
                {user.coverImage ? (
                  <Image
                    src={user.coverImage}
                    alt="커버 이미지"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-rose-200 to-rose-400" />
                )}
              </div>

              {/* 아바타 */}
              <div className="flex justify-center -mt-12">
                <UserAvatar
                  src={user.photo}
                  name={user.name}
                  className="w-24 h-24 border-4 border-background shadow-sm"
                  fallbackClassName="text-2xl bg-primary text-primary-foreground"
                />
              </div>

              {/* 이름 · 배지 */}
              <div className="text-center mt-2 px-4 pb-1">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">{user.name ?? '알 수 없음'}</h2>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-white bg-primary px-2 py-0.5 rounded-full">
                      <ShieldCheck className="size-3" />
                      인증 매니저
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {[user.companyName, user.position]
                    .filter(Boolean)
                    .join(' · ') || managerTypeLabel}
                </p>
                {typeof user.followerCount === 'number' && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    팔로워 {user.followerCount}명
                  </p>
                )}
              </div>
            </div>

            {/* ── 팔로우 버튼 ── */}
            {!isOwnProfile && onFollowToggle && (
              <div className="px-4 mt-3">
                <Button
                  onClick={handleFollowToggle}
                  disabled={isLoadingFollow}
                  variant={isFollowing ? 'outline' : 'default'}
                  className="w-full"
                  size="sm"
                >
                  {isLoadingFollow ? (
                    '처리 중...'
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="size-4 mr-1.5" />
                      팔로우 취소
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-4 mr-1.5" />
                      팔로우
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* ── 카드 영역 ── */}
            <div className="px-4 mt-4 space-y-3">

              {/* 매니저 유형 */}
              <SectionCard>
                <SectionHeader icon={Briefcase} title="매니저 유형" />
                <div className="px-4 pb-4">
                  <div className="rounded-xl border-2 border-primary bg-primary/5 p-3 w-full">
                    <p className="text-sm font-semibold">{isCompany ? '컴퍼니' : '퍼스널'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isCompany ? '회사로 운영' : '개인 (사업자 X)'}
                    </p>
                  </div>
                </div>
              </SectionCard>

              {/* 기본 정보 */}
              {(user.position || user.introduction) && (
                <SectionCard>
                  <SectionHeader icon={PenLine} title="기본 정보" />
                  <div className="divide-y divide-border">
                    {user.position && (
                      <InfoRow label="직책">
                        <span className="text-sm font-medium">{user.position}</span>
                      </InfoRow>
                    )}
                    {user.introduction && (
                      <InfoRow label="자기소개" alignTop>
                        <span className="text-sm leading-relaxed whitespace-pre-wrap">
                          {user.introduction}
                        </span>
                      </InfoRow>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* 연락처 */}
              {hasAnyContact && (
                <SectionCard>
                  <SectionHeader
                    icon={Mail}
                    title="연락처"
                    subtitle="매니저가 공개한 항목만 표시돼요."
                  />
                  <div>
                    {visibleEmail && (
                      <ContactRow icon={Mail} label="이메일" value={user.email!} />
                    )}
                    {visiblePhone && (
                      <ContactRow icon={Phone} label="전화번호" value={user.phone!} />
                    )}
                    {visibleKakaoId && (
                      <ContactRow icon={MessageCircle} label="카카오톡 ID" value={user.kakaoId!} />
                    )}
                  </div>
                </SectionCard>
              )}

              {/* 회사 정보 */}
              {isCompany && (user.companyName || user.address || user.website || user.foundedYear) && (
                <SectionCard>
                  <SectionHeader icon={Building2} title="회사 정보" />
                  <div className="divide-y divide-border">
                    {user.companyName && (
                      <InfoRow label="회사명">
                        <span className="text-sm font-medium">{user.companyName}</span>
                      </InfoRow>
                    )}
                    {user.address && (
                      <InfoRow label="소재지">
                        <span className="text-sm font-medium">{user.address}</span>
                      </InfoRow>
                    )}
                    {user.website && (
                      <InfoRow label="웹사이트">
                        <span className="text-sm font-medium">{user.website}</span>
                      </InfoRow>
                    )}
                    {user.foundedYear && (
                      <InfoRow label="설립연도">
                        <span className="text-sm font-medium">{user.foundedYear}</span>
                      </InfoRow>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* 전문 분야 */}
              {user.specialties.length > 0 && (
                <SectionCard>
                  <SectionHeader
                    icon={Tag}
                    title="전문 분야"
                    count={`${user.specialties.length}개`}
                  />
                  <div className="px-4 pb-4">
                    <div className="flex flex-wrap gap-2">
                      {user.specialties.map((s, i) => (
                        <span
                          key={i}
                          className="bg-red-50 text-red-700 text-sm px-3 py-1 rounded-full border border-red-100"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* 활동 지역 */}
              {user.activityRegions.length > 0 && (
                <SectionCard>
                  <SectionHeader
                    icon={MapPin}
                    title="활동 지역"
                    count={`${user.activityRegions.length}곳`}
                  />
                  <div className="px-4 pb-4">
                    <div className="flex flex-wrap gap-2">
                      {user.activityRegions.map((r, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1.5 bg-red-50 text-red-700 text-sm px-3 py-1 rounded-full border border-red-100"
                        >
                          <MapPin className="size-3" />
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              )}

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
