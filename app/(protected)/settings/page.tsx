'use client';

import { useTheme } from 'next-themes';
import { Switch } from '@/app/components/ui/switch';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import {
  Key,
  Mail,
  Info,
  Users,
  Trash2,
  Bell,
  Star,
  ShieldCheck,
  Eye,
  LogOut,
  ChevronRight,
  Moon,
} from 'lucide-react';
import { useSettingsPage } from './hooks/useSettingsPage';
import PageHeader from '@/app/components/PageHeader';
import { cn } from '@/lib/utils';
import type { ProfileVisibility } from './actions';

// ── 공통 row 컴포넌트들 ──────────────────────────────────

function SectionLabel({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="px-4 pt-6 pb-2">
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 bg-card rounded-xl overflow-hidden divide-y divide-border border border-border">
      {children}
    </div>
  );
}

function SubGroupLabel({ title }: { title: string }) {
  return (
    <div className="px-4 pt-3 pb-1.5">
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center px-4 py-3.5 gap-3">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Icon className="size-4 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {value && (
          <p className="text-xs text-muted-foreground mt-0.5">{value}</p>
        )}
      </div>
    </div>
  );
}

function InfoRowRight({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center px-4 py-3.5 gap-3">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Icon className="size-4 text-foreground" />
      </div>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value && <span className="text-sm text-muted-foreground">{value}</span>}
    </div>
  );
}

function NavRow({
  icon: Icon,
  label,
  description,
  destructive = false,
  iconBgClass,
  iconClass,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  destructive?: boolean;
  iconBgClass?: string;
  iconClass?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="flex items-center px-4 py-3.5 gap-3 w-full text-left active:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          iconBgClass ?? (destructive ? 'bg-destructive/10' : 'bg-muted')
        )}
      >
        <Icon
          className={cn(
            'size-4',
            iconClass ?? (destructive ? 'text-destructive' : 'text-foreground')
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', destructive && 'text-destructive')}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description?: string | null;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center px-4 py-3.5 gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

function VisibilityToggleRow({
  label,
  value,
  checked,
  onCheckedChange,
}: {
  label: string;
  value: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <div className="flex items-center px-4 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{value}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────

export default function SettingsPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const {
    roleHydrated,
    mounted,
    pushPermission,
    pushSubscribed,
    isPushLoading,
    isIos,
    isStandalone,
    userProfile,
    profileVisibility,
    isMember,
    isManager,
    isReviewModalOpen,
    setIsReviewModalOpen,
    reviewRating,
    setReviewRating,
    reviewContent,
    setReviewContent,
    isSubmittingReview,
    isDeletingAccount,
    showDeleteDialog,
    setShowDeleteDialog,
    deleteConfirmText,
    setDeleteConfirmText,
    showManagerRequestDialog,
    setShowManagerRequestDialog,
    isRequestingManagerRole,
    showRevertToMemberDialog,
    setShowRevertToMemberDialog,
    isRevertingToMember,
    handlePushToggle,
    handleProfileVisibilityToggle,
    getFieldPreview,
    handleSubmitReview,
    handleDeleteAccount,
    handleDeleteAccountConfirm,
    handleRequestManagerRole,
    handleRevertToMember,
    handleSignOut,
  } = useSettingsPage();

  if (!roleHydrated) {
    return (
      <div>
        <PageHeader title="설정" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-sm text-muted-foreground">로딩 중...</div>
        </div>
      </div>
    );
  }

  const pushDescription =
    pushPermission === 'denied'
      ? '알림이 차단됐어요'
      : pushSubscribed
      ? '알림이 켜져 있어요'
      : '알림이 꺼져 있어요';

  const visibilityFields: Array<{
    group: string;
    items: Array<{ key: keyof ProfileVisibility; label: string }>;
  }> = [
    {
      group: '기본 정보',
      items: [
        { key: 'email', label: '이메일' },
        { key: 'phone', label: '전화번호' },
        { key: 'kakaoId', label: '카카오톡 ID' },
      ],
    },
    {
      group: '신체 정보',
      items: [
        { key: 'age', label: '나이' },
        { key: 'gender', label: '성별' },
      ],
    },
    {
      group: '경력·자격',
      items: [
        { key: 'experiences', label: '경력' },
        { key: 'certificates', label: '자격증' },
        { key: 'languages', label: '어학 능력' },
      ],
    },
    {
      group: '서류',
      items: [{ key: 'documents', label: '서류' }],
    },
  ];

  return (
    <div className="bg-muted min-h-screen pb-10">
      <PageHeader title="설정" />

      {/* ── 계정 ── */}
      <SectionLabel title="계정" />
      <SettingsCard>
        <InfoRowRight
          icon={Key}
          label="로그인 방식"
          value={userProfile?.loginMethod}
        />
        <InfoRowRight
          icon={Mail}
          label="이메일"
          value={userProfile?.email ?? undefined}
        />
        <InfoRow
          icon={Info}
          label="가입일"
          value={userProfile?.joinedAt ?? undefined}
        />
      </SettingsCard>

      {/* ── 프로필 공개 설정 (멤버 전용) ── */}
      {isMember && (
        <>
          <SectionLabel
            title="프로필 공개 설정"
            description="매니저에게 보여줄 정보를 선택하세요."
          />
          <SettingsCard>
            {visibilityFields.map(({ group, items }) => (
              <div key={group}>
                <SubGroupLabel title={group} />
                {items.map(({ key, label }) => (
                  <VisibilityToggleRow
                    key={key}
                    label={label}
                    value={getFieldPreview(key)}
                    checked={!!profileVisibility[key]}
                    onCheckedChange={() => handleProfileVisibilityToggle(key)}
                  />
                ))}
              </div>
            ))}
          </SettingsCard>
        </>
      )}

      {/* ── 계정 관리 ── */}
      <SectionLabel title="계정 관리" />
      <SettingsCard>
        {isMember && (
          <NavRow
            icon={Users}
            label="매니저로 전환"
            description="공고 등록·스탭 모집 권한을 신청해요."
            onClick={() => setShowManagerRequestDialog(true)}
          />
        )}
        {isManager && (
          <NavRow
            icon={Users}
            label="스탭 계정으로 전환"
            description="매니저 권한을 반납하고 스탭으로 돌아가요."
            onClick={() => setShowRevertToMemberDialog(true)}
          />
        )}
        <NavRow
          icon={Trash2}
          label="계정 탈퇴"
          description="모든 데이터가 삭제돼요."
          destructive
          onClick={handleDeleteAccount}
        />
      </SettingsCard>

      {/* ── 앱 설정 ── */}
      <SectionLabel title="앱 설정" />
      <SettingsCard>
        {mounted ? (
          <ToggleRow
            label="다크 모드"
            description={isDark ? '다크 모드 사용 중' : '시스템 기본 (밝음)'}
            checked={isDark}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          />
        ) : (
          <ToggleRow
            label="다크 모드"
            description="시스템 기본"
            checked={false}
            onCheckedChange={() => {}}
          />
        )}
        <ToggleRow
          label="푸시 알림"
          description={pushDescription}
          checked={pushSubscribed}
          onCheckedChange={() => handlePushToggle()}
          disabled={isPushLoading || pushPermission === 'denied'}
        />
      </SettingsCard>

      {isIos && !isStandalone && mounted && (
        <div className="mx-4 mt-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
            iOS 푸시 알림 사용 방법
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Safari 하단의 공유 버튼 → &quot;홈 화면에 추가&quot;로 앱을 설치한 후 다시 열어주세요.
          </p>
        </div>
      )}

      {/* ── 기타 ── */}
      <SectionLabel title="기타" />
      <SettingsCard>
        <NavRow
          icon={Star}
          label="앱 리뷰 작성"
          description="고인력을 사용한 소감을 알려주세요."
          iconBgClass="bg-yellow-100 dark:bg-yellow-900/30"
          iconClass="fill-yellow-400 text-yellow-400"
          onClick={() => setIsReviewModalOpen(true)}
        />
        <NavRow icon={ShieldCheck} label="이용약관" />
        <NavRow icon={Eye} label="개인정보 처리방침" />
        <InfoRowRight icon={Info} label="버전 정보" value="v1.0.0" />
      </SettingsCard>

      {/* ── 로그아웃 푸터 ── */}
      <div className="mx-4 mt-6">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-card border border-border text-sm font-medium text-foreground active:bg-accent/50 transition-colors"
        >
          <LogOut className="size-4" />
          로그아웃
        </button>
      </div>

      {/* ── 다이얼로그 ── */}

      {/* 매니저 전환 */}
      <Dialog
        open={showManagerRequestDialog}
        onOpenChange={(open) => {
          if (!isRequestingManagerRole) setShowManagerRequestDialog(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>매니저 전환 신청</DialogTitle>
            <DialogDescription>
              매니저로 전환하면 공고 등록 및 스탭 모집 기능을 사용할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>신청 후 관리자 검토를 거쳐 매니저로 승인됩니다</li>
              <li>
                승인 전까지{' '}
                <strong className="text-foreground">승인 대기</strong> 상태가 유지됩니다
              </li>
              <li>프로필에서 회사 정보를 입력한 뒤 승인을 요청할 수 있습니다</li>
            </ul>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setShowManagerRequestDialog(false)}
                disabled={isRequestingManagerRole}
              >
                취소
              </Button>
              <Button onClick={handleRequestManagerRole} disabled={isRequestingManagerRole}>
                {isRequestingManagerRole ? '처리중...' : '신청하기'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 스탭 계정으로 전환 */}
      <Dialog
        open={showRevertToMemberDialog}
        onOpenChange={(open) => {
          if (!isRevertingToMember) setShowRevertToMemberDialog(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>스탭 계정으로 전환</DialogTitle>
            <DialogDescription>
              매니저 권한을 반납하고 스탭으로 전환합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>공고 등록 및 스탭 모집 기능을 더 이상 사용할 수 없습니다</li>
              <li>등록된 공고는 유지되지만 새 공고를 올릴 수 없습니다</li>
              <li>다시 매니저로 전환하려면 재신청 후 관리자 승인이 필요합니다</li>
            </ul>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setShowRevertToMemberDialog(false)}
                disabled={isRevertingToMember}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleRevertToMember}
                disabled={isRevertingToMember}
              >
                {isRevertingToMember ? '처리중...' : '전환하기'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 계정 탈퇴 */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!isDeletingAccount) setShowDeleteDialog(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">계정 탈퇴</DialogTitle>
            <DialogDescription>이 작업은 되돌릴 수 없습니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>프로필 및 개인 정보</li>
              <li>작성한 공고 및 지원 내역</li>
              <li>스케줄 및 근태 기록</li>
              <li>업로드한 이미지 및 문서</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              위 데이터가 모두 영구 삭제됩니다. 계속하려면 아래에{' '}
              <strong className="text-foreground">탈퇴</strong>를 입력하세요.
            </p>
            <Input
              placeholder="탈퇴"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              disabled={isDeletingAccount}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeletingAccount}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccountConfirm}
                disabled={deleteConfirmText !== '탈퇴' || isDeletingAccount}
              >
                {isDeletingAccount ? '처리중...' : '탈퇴 확인'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 앱 리뷰 */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>앱 리뷰 작성</DialogTitle>
            <DialogDescription>
              고인력 서비스에 대한 솔직한 리뷰를 남겨주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">별점</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        'size-8',
                        star <= reviewRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      )}
                    />
                  </button>
                ))}
              </div>
              {reviewRating > 0 && (
                <p className="text-xs text-muted-foreground">
                  {reviewRating === 1 && '별로예요'}
                  {reviewRating === 2 && '그저 그래요'}
                  {reviewRating === 3 && '보통이에요'}
                  {reviewRating === 4 && '좋아요'}
                  {reviewRating === 5 && '아주 좋아요!'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-content" className="text-sm font-medium">
                리뷰 내용
              </Label>
              <Textarea
                id="review-content"
                placeholder="서비스 이용 경험을 자세히 적어주세요..."
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={isSubmittingReview || reviewRating === 0 || !reviewContent.trim()}
            >
              {isSubmittingReview ? '제출 중...' : '리뷰 제출'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
