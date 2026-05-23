'use client';

import { useRef } from 'react';
import Image from 'next/image';
import {
  Camera,
  ShieldCheck,
  Briefcase,
  PenLine,
  Tag,
  MapPin,
  X,
  Plus,
  Lightbulb,
  ChevronRight,
  Mail,
  Phone,
  MessageCircle,
  Building2,
} from 'lucide-react';
import UserAvatar from '@/app/common/components/UserAvatar';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
import { cn } from '@/lib/utils';
import { formatBusinessNumber } from '../../utils/profileUtils';
import type { User } from '@/types/mockData';
import type { ChangeEvent } from 'react';

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
  onAdd,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  count?: string;
  onAdd?: () => void;
}) {
  return (
    <div className="px-4 pt-4 pb-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
          <Icon className="size-4 text-red-500" />
        </div>
        <span className="font-bold text-sm">{title}</span>
        {count && <span className="text-sm text-muted-foreground">{count}</span>}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="ml-auto flex items-center gap-1 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-lg"
          >
            <Plus className="size-3.5" />
            추가
          </button>
        )}
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
  placeholder,
  isEditing,
  isVisible,
  onChange,
  onToggle,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  placeholder: string;
  isEditing: boolean;
  isVisible: boolean;
  onChange: (v: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-border">
      {/* 아이콘 */}
      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
        <Icon className="size-4 text-red-400" />
      </div>
      {/* 라벨 + 입력 */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {isEditing ? (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-8 text-sm"
          />
        ) : (
          <p className="text-sm font-medium truncate">{value || <span className="text-muted-foreground">-</span>}</p>
        )}
      </div>
      {/* 공개 토글 */}
      <div className="shrink-0 flex flex-col items-center gap-0.5">
        <Switch
          checked={isVisible}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-primary"
        />
        <span className="text-[10px] text-muted-foreground">{isVisible ? 'ON' : 'OFF'}</span>
      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────

interface Props {
  currentUser: User;
  isEditing: boolean;
  isSaving: boolean;
  isUploadingPhoto: boolean;
  isUploadingCover: boolean;
  isReRequesting: boolean;
  newSpecialty: string;
  setNewSpecialty: (v: string) => void;
  showSpecialtyInput: boolean;
  setShowSpecialtyInput: (v: boolean) => void;
  addSpecialty: () => void;
  removeSpecialty: (i: number) => void;
  newRegion: string;
  setNewRegion: (v: string) => void;
  showRegionInput: boolean;
  setShowRegionInput: (v: boolean) => void;
  addRegion: () => void;
  removeRegion: (i: number) => void;
  profileVisibility: { email: boolean; phone: boolean; kakaoId: boolean };
  onVisibilityToggle: (field: 'email' | 'phone' | 'kakaoId') => void;
  onInputChange: (field: keyof User, value: string | number | undefined) => void;
  onProfileImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onCoverImageUpload: (file: File) => void;
  onSubmitApproval: () => void;
}

// ── 메인 컴포넌트 ──────────────────────────────────────

export function ManagerProfileView({
  currentUser,
  isEditing,
  isUploadingPhoto,
  isUploadingCover,
  isReRequesting,
  newSpecialty,
  setNewSpecialty,
  showSpecialtyInput,
  setShowSpecialtyInput,
  addSpecialty,
  removeSpecialty,
  newRegion,
  setNewRegion,
  showRegionInput,
  setShowRegionInput,
  addRegion,
  removeRegion,
  profileVisibility,
  onVisibilityToggle,
  onInputChange,
  onProfileImageUpload,
  onCoverImageUpload,
  onSubmitApproval,
}: Props) {
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isVerified = currentUser.companyVerifyStatus === 'approved';
  const isCompany = currentUser.managerType !== 'personal';
  const managerTypeLabel = isCompany ? '컴퍼니 매니저' : '퍼스널 매니저';
  const isPendingDraft =
    currentUser.role === 'pending_manager' &&
    (currentUser.companyVerifyStatus == null ||
      currentUser.companyVerifyStatus === 'rejected');
  const isCompanyLocked = currentUser.companyVerifyStatus === 'pending';

  const specialties = currentUser.specialties ?? [];
  const activityRegions = currentUser.activityRegions ?? [];

  return (
    <div className="bg-muted min-h-screen pb-12">

      {/* ── 히어로 ── */}
      <div className="relative">
        {/* 커버 */}
        <div className="relative h-44 w-full overflow-hidden">
          {currentUser.coverImage ? (
            <Image
              src={currentUser.coverImage}
              alt="커버 이미지"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-rose-200 to-rose-400" />
          )}
          {isEditing && (
            <button
              type="button"
              className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/30 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploadingCover}
            >
              <Camera className="size-3.5" />
              커버 변경
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onCoverImageUpload(file);
              e.target.value = '';
            }}
          />
        </div>

        {/* 아바타 */}
        <div className="flex justify-center -mt-14">
          <div className="relative">
            {isEditing ? (
              <button
                type="button"
                onClick={() => document.getElementById('mgr-photo-upload')?.click()}
                disabled={isUploadingPhoto}
              >
                <UserAvatar
                  src={currentUser.photo}
                  name={currentUser.name}
                  className="w-28 h-28 border-4 border-background shadow-sm"
                  fallbackClassName="text-2xl bg-primary text-primary-foreground"
                />
                <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center shadow">
                  <Camera className="size-3.5 text-muted-foreground" />
                </div>
              </button>
            ) : (
              <UserAvatar
                src={currentUser.photo}
                name={currentUser.name}
                className="w-28 h-28 border-4 border-background shadow-sm"
                fallbackClassName="text-2xl bg-primary text-primary-foreground"
              />
            )}
            <input
              id="mgr-photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onProfileImageUpload}
            />
          </div>
        </div>

        {/* 이름 · 배지 · 서브타이틀 */}
        <div className="text-center mt-3 px-4 pb-1">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold">{currentUser.name}</h2>
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-white bg-primary px-2 py-0.5 rounded-full">
                <ShieldCheck className="size-3" />
                인증 매니저
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {[currentUser.companyName, currentUser.position]
              .filter(Boolean)
              .join(' · ') || managerTypeLabel}
          </p>
        </div>
      </div>

      {/* ── 카드 영역 ── */}
      <div className="px-4 mt-5 space-y-4">

        {/* 매니저 유형 */}
        <SectionCard>
          <SectionHeader icon={Briefcase} title="매니저 유형" />
          <div className="px-4 pb-4">
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onInputChange('managerType', 'company')}
                  className={cn(
                    'rounded-xl border-2 p-3 text-left transition-colors',
                    isCompany ? 'border-primary bg-primary/5' : 'border-border'
                  )}
                >
                  <p className="text-sm font-semibold">컴퍼니</p>
                  <p className="text-xs text-muted-foreground mt-0.5">회사로 운영</p>
                </button>
                <button
                  type="button"
                  onClick={() => onInputChange('managerType', 'personal')}
                  className={cn(
                    'rounded-xl border-2 p-3 text-left transition-colors',
                    !isCompany ? 'border-primary bg-primary/5' : 'border-border'
                  )}
                >
                  <p className="text-sm font-semibold">퍼스널</p>
                  <p className="text-xs text-muted-foreground mt-0.5">개인 (사업자 X)</p>
                </button>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-primary bg-primary/5 p-3 w-full">
                <p className="text-sm font-semibold">{isCompany ? '컴퍼니' : '퍼스널'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isCompany ? '회사로 운영' : '개인 (사업자 X)'}
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* 기본 정보 */}
        <SectionCard>
          <SectionHeader icon={PenLine} title="기본 정보" />
          <div className="divide-y divide-border">
            <InfoRow label="이름">
              {isEditing ? (
                <Input
                  value={currentUser.name ?? ''}
                  onChange={(e) => onInputChange('name', e.target.value)}
                  placeholder="이름"
                  className="h-9"
                />
              ) : (
                <span className="text-sm font-medium">{currentUser.name || '-'}</span>
              )}
            </InfoRow>

            <InfoRow label="직책">
              {isEditing ? (
                <Input
                  value={currentUser.position ?? ''}
                  onChange={(e) => onInputChange('position', e.target.value)}
                  placeholder="예: 이벤트 운영 팀장"
                  className="h-9"
                />
              ) : (
                <span className="text-sm font-medium">
                  {currentUser.position || <span className="text-muted-foreground">-</span>}
                </span>
              )}
            </InfoRow>

            <InfoRow label="자기소개" alignTop>
              {isEditing ? (
                <Textarea
                  value={currentUser.introduction ?? ''}
                  onChange={(e) => onInputChange('introduction', e.target.value)}
                  placeholder="자신을 소개해주세요"
                  className="resize-none min-h-[72px] text-sm"
                  rows={3}
                />
              ) : (
                <span className="text-sm leading-relaxed whitespace-pre-wrap">
                  {currentUser.introduction || <span className="text-muted-foreground">-</span>}
                </span>
              )}
            </InfoRow>
          </div>
        </SectionCard>

        {/* 연락처 */}
        <SectionCard>
          <SectionHeader
            icon={Mail}
            title="연락처"
            subtitle="공개로 설정한 항목만 스탭에게 표시돼요."
          />
          <div>
            <ContactRow
              icon={Mail}
              label="이메일"
              value={currentUser.email ?? ''}
              placeholder="example@email.com"
              isEditing={isEditing}
              isVisible={profileVisibility.email}
              onChange={(v) => onInputChange('email', v)}
              onToggle={() => onVisibilityToggle('email')}
            />
            <ContactRow
              icon={Phone}
              label="전화번호"
              value={currentUser.phone ?? ''}
              placeholder="010-0000-0000"
              isEditing={isEditing}
              isVisible={profileVisibility.phone}
              onChange={(v) => onInputChange('phone', v)}
              onToggle={() => onVisibilityToggle('phone')}
            />
            <ContactRow
              icon={MessageCircle}
              label="카카오톡 ID"
              value={currentUser.kakaoId ?? ''}
              placeholder="카카오톡 아이디"
              isEditing={isEditing}
              isVisible={profileVisibility.kakaoId}
              onChange={(v) => onInputChange('kakaoId', v)}
              onToggle={() => onVisibilityToggle('kakaoId')}
            />
          </div>
        </SectionCard>

        {/* 회사 정보 (컴퍼니 매니저만) */}
        {isCompany && (
          <SectionCard>
            <SectionHeader
              icon={Building2}
              title="회사 정보"
              subtitle="사업자 인증 시 '인증 매니저' 배지가 표시돼요."
            />
            <div className="divide-y divide-border">
              <InfoRow label="회사명">
                {isEditing ? (
                  <Input
                    value={currentUser.companyName ?? ''}
                    onChange={(e) => onInputChange('companyName', e.target.value)}
                    placeholder="회사명"
                    className="h-9"
                    disabled={isCompanyLocked}
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {currentUser.companyName || <span className="text-muted-foreground">-</span>}
                  </span>
                )}
              </InfoRow>

              <InfoRow label="사업자번호">
                {isEditing ? (
                  <Input
                    value={formatBusinessNumber(currentUser.businessNumber ?? '')}
                    onChange={(e) =>
                      onInputChange(
                        'businessNumber',
                        formatBusinessNumber(e.target.value)
                      )
                    }
                    placeholder="123-45-67890"
                    className="h-9"
                    disabled={isCompanyLocked}
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {currentUser.businessNumber
                      ? formatBusinessNumber(currentUser.businessNumber)
                      : <span className="text-muted-foreground">-</span>}
                  </span>
                )}
              </InfoRow>

              <InfoRow label="소재지">
                {isEditing ? (
                  <Input
                    value={currentUser.address ?? ''}
                    onChange={(e) => onInputChange('address', e.target.value)}
                    placeholder="서울 강남구 테헤란로 123"
                    className="h-9"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {currentUser.address || <span className="text-muted-foreground">-</span>}
                  </span>
                )}
              </InfoRow>

              <InfoRow label="웹사이트">
                {isEditing ? (
                  <Input
                    value={currentUser.website ?? ''}
                    onChange={(e) => onInputChange('website', e.target.value)}
                    placeholder="www.example.co.kr"
                    className="h-9"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {currentUser.website || <span className="text-muted-foreground">-</span>}
                  </span>
                )}
              </InfoRow>

              <InfoRow label="설립연도">
                {isEditing ? (
                  <Input
                    value={currentUser.foundedYear ?? ''}
                    onChange={(e) => onInputChange('foundedYear', e.target.value)}
                    placeholder="2019"
                    className="h-9"
                    maxLength={4}
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {currentUser.foundedYear || <span className="text-muted-foreground">-</span>}
                  </span>
                )}
              </InfoRow>

              {/* 인증 배너 */}
              {!isVerified && (
                <div className="mx-4 my-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3">
                  <Lightbulb className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    사업자등록증명원을 제출하시면 &apos;인증 매니저&apos;로
                    전환돼요.{' '}
                    {isPendingDraft && (
                      <button
                        type="button"
                        className="font-bold underline underline-offset-2 inline-flex items-center gap-0.5"
                        onClick={onSubmitApproval}
                        disabled={isReRequesting}
                      >
                        인증 신청
                        <ChevronRight className="size-3" />
                      </button>
                    )}
                  </p>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* 전문 분야 */}
        <SectionCard>
          <SectionHeader
            icon={Tag}
            title="전문 분야"
            count={specialties.length > 0 ? `${specialties.length}개` : undefined}
            onAdd={isEditing ? () => setShowSpecialtyInput(true) : undefined}
          />
          <div className="px-4 pb-4 space-y-3">
            <p className="text-xs text-muted-foreground -mt-1">
              스탭이 검색할 때 매칭에 활용돼요.
            </p>
            {showSpecialtyInput && (
              <div className="flex gap-2">
                <Input
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  placeholder="예: 팝업스토어"
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSpecialty();
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={addSpecialty}
                  className="shrink-0 bg-primary text-primary-foreground text-xs font-semibold px-3 rounded-lg"
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSpecialtyInput(false);
                    setNewSpecialty('');
                  }}
                  className="shrink-0 text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
            {specialties.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {specialties.map((s, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 bg-red-50 text-red-700 text-sm px-3 py-1 rounded-full border border-red-100"
                  >
                    {s}
                    {isEditing && (
                      <button type="button" onClick={() => removeSpecialty(i)}>
                        <X className="size-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        {/* 활동 지역 */}
        <SectionCard>
          <SectionHeader
            icon={MapPin}
            title="활동 지역"
            count={activityRegions.length > 0 ? `${activityRegions.length}곳` : undefined}
            onAdd={isEditing ? () => setShowRegionInput(true) : undefined}
          />
          <div className="px-4 pb-4 space-y-3">
            <p className="text-xs text-muted-foreground -mt-1">
              주로 행사를 진행하는 지역을 선택하세요.
            </p>
            {showRegionInput && (
              <div className="flex gap-2">
                <Input
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  placeholder="예: 서울"
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRegion();
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={addRegion}
                  className="shrink-0 bg-primary text-primary-foreground text-xs font-semibold px-3 rounded-lg"
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRegionInput(false);
                    setNewRegion('');
                  }}
                  className="shrink-0 text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
            {activityRegions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activityRegions.map((r, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 bg-red-50 text-red-700 text-sm px-3 py-1 rounded-full border border-red-100"
                  >
                    <MapPin className="size-3" />
                    {r}
                    {isEditing && (
                      <button type="button" onClick={() => removeRegion(i)}>
                        <X className="size-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

    </div>
  );
}
