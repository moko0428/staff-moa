'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/app/components/ui/card';
import Link from 'next/link';
import { PenLine, Check, Clock } from 'lucide-react';
import PageHeader from '@/app/components/PageHeader';
import { useUserStore } from '@/store/useUserStore';
import { useProfile } from './hook/useProfile';
import { ManagerProfileView } from './components/organisms/ManagerProfileView';
import { useFollows } from './hooks/useFollows';
import { getProfileForModalAction } from './actions';
import {
  getCompanyBadge,
  getCompanyInfoFilled,
  getMissingFields,
} from './utils/profileUtils';
import { ProfileSideCard } from './components/organisms/ProfileSideCard';
import { BasicInfoCard } from './components/organisms/BasicInfoCard';
import { CompanyInfoCard } from './components/organisms/CompanyInfoCard';
import { FollowingsCard } from './components/organisms/FollowingsCard';
import { FollowersCard } from './components/organisms/FollowersCard';
import ExperienceSection from './components/ExperienceSection';
import DocumentsSection from './components/DocumentsSection';
import CertificatesSection from './components/CertificatesSection';
import LanguageSection from './components/LanguageSection';
import ProfileModal from '@/app/components/profile-modal';

const WelcomeToast = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (searchParams.get('welcome') === '1') {
      toast.success('회원가입이 완료되었습니다! 환영합니다 🎉');
      router.replace('/profile', { scroll: false });
    }
  }, [searchParams, router]);
  return null;
};

export default function ProfilePage() {
  const {
    currentUser,
    isEditing,
    setIsEditing,
    newLanguage,
    setNewLanguage,
    newCertificate,
    setNewCertificate,
    newDocumentLabel,
    setNewDocumentLabel,
    newExperience,
    setNewExperience,
    showCertificateInput,
    setShowCertificateInput,
    showLanguageInput,
    setShowLanguageInput,
    showDocumentInput,
    setShowDocumentInput,
    showExperienceInput,
    setShowExperienceInput,
    isLoadingExperiences,
    isUploadingPhoto,
    isUploadingCover,
    isReRequesting,
    isLoadingUser,
    isSaving,
    handleBirthDateChange,
    handleSaveProfile,
    handleInputChange,
    addLanguage,
    removeLanguage,
    addCertificate,
    removeCertificate,
    addDocumentItem,
    removeDocumentItem,
    addExperienceManual,
    removeExperience,
    loadExperiencesFromSchedules,
    handleCompanyCertUpload,
    handleProfileImageUpload,
    handleRemoveProfileImage,
    handleCoverImageUpload,
    handleRemoveCoverImage,
    handleReRequestManagerApproval,
    handleSubmitManagerApproval,
    newSpecialty,
    setNewSpecialty,
    newRegion,
    setNewRegion,
    showSpecialtyInput,
    setShowSpecialtyInput,
    showRegionInput,
    setShowRegionInput,
    addSpecialty,
    removeSpecialty,
    addRegion,
    removeRegion,
    profileVisibility,
    handleManagerVisibilityToggle,
  } = useProfile();

  const roleFromStore = useUserStore((state) => state.role);
  const effectiveRole = roleFromStore ?? currentUser?.role ?? null;
  const isMember = effectiveRole === 'member';
  const isPendingManager = effectiveRole === 'pending_manager';
  const isManager = effectiveRole === 'manager';
  const isAdmin = effectiveRole === 'admin';

  const {
    followerCount,
    followers,
    isLoadingFollowers,
    followerSearch,
    setFollowerSearch,
    handleRemoveFollower,
    followingCount,
    followings,
    isLoadingFollowings,
    followingSearch,
    setFollowingSearch,
    handleRemoveFollowing,
  } = useFollows({ isManager, isMember });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<{
    id: string;
    name: string | null;
    email: string | null;
    photo?: string | null;
    role: string;
    introduction?: string | null;
    attendanceScore?: number | null;
    followerCount?: number;
    coverImage?: string | null;
  } | null>(null);

  const openProfileModal = async (userId: string) => {
    const result = await getProfileForModalAction(userId);
    if (!result.ok || !result.data) {
      toast.error(result.message || '프로필을 불러오는데 실패했습니다.');
      return;
    }
    setProfileModalUser(result.data);
    setIsProfileModalOpen(true);
  };

  if (isLoadingUser) {
    return (
      <div>
        <PageHeader title="프로필 관리" />
        <div className="flex justify-center items-center min-h-[300px]">
          <p className="text-muted-foreground text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div>
        <PageHeader title="프로필 관리" />
        <div className="flex flex-col items-center justify-center gap-4 min-h-[300px] text-muted-foreground p-4">
          <p>로그인이 필요합니다.</p>
          <Link href="/auth" className="text-primary underline text-sm">
            로그인 / 회원가입
          </Link>
        </div>
      </div>
    );
  }

  const companyStatusRaw = (currentUser.companyVerifyStatus ?? null) as
    | 'pending'
    | 'approved'
    | 'rejected'
    | null;
  const companyInfoFilled = getCompanyInfoFilled({
    companyName: currentUser.companyName,
    businessNumber: currentUser.businessNumber,
    companyCertificate: currentUser.companyCertificate,
  });
  const companyBadge = getCompanyBadge(companyInfoFilled, companyStatusRaw);
  const missingFields = getMissingFields({
    role: effectiveRole ?? '',
    phone: currentUser.phone,
    gender: currentUser.gender,
    introduction: currentUser.introduction,
    birthDate: currentUser.birthDate,
    companyName: currentUser.companyName,
    businessNumber: currentUser.businessNumber,
    companyCertificate: currentUser.companyCertificate,
  });

  // ── 매니저 전용 신규 UI ──
  if (isManager || isPendingManager) {
    return (
      <div>
        <Suspense>
          <WelcomeToast />
        </Suspense>
        <PageHeader
          title="매니저 프로필 관리"
          right={
            isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-sm px-2 h-8 rounded-md hover:bg-accent transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-1 bg-primary text-primary-foreground text-sm font-semibold px-3 h-8 rounded-md disabled:opacity-50"
                >
                  <Check className="size-3.5" />
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-sm font-medium border border-border rounded-md px-3 h-8 hover:bg-accent transition-colors"
              >
                <PenLine className="size-3.5" />
                수정
              </button>
            )
          }
        />
        <ManagerProfileView
          currentUser={currentUser}
          isEditing={isEditing}
          isSaving={isSaving}
          isUploadingPhoto={isUploadingPhoto}
          isUploadingCover={isUploadingCover}
          isReRequesting={isReRequesting}
          newSpecialty={newSpecialty}
          setNewSpecialty={setNewSpecialty}
          showSpecialtyInput={showSpecialtyInput}
          setShowSpecialtyInput={setShowSpecialtyInput}
          addSpecialty={addSpecialty}
          removeSpecialty={removeSpecialty}
          newRegion={newRegion}
          setNewRegion={setNewRegion}
          showRegionInput={showRegionInput}
          setShowRegionInput={setShowRegionInput}
          addRegion={addRegion}
          removeRegion={removeRegion}
          profileVisibility={profileVisibility}
          onVisibilityToggle={handleManagerVisibilityToggle}
          onInputChange={handleInputChange}
          onProfileImageUpload={handleProfileImageUpload}
          onCoverImageUpload={handleCoverImageUpload}
          onSubmitApproval={handleSubmitManagerApproval}
        />
      </div>
    );
  }

  return (
    <div>
      <Suspense>
        <WelcomeToast />
      </Suspense>

      <PageHeader
        title="프로필 관리"
        right={
          <button
            type="button"
            onClick={async () => {
              if (isEditing) {
                await handleSaveProfile();
                setIsEditing(false);
              } else {
                setIsEditing(true);
              }
            }}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-sm font-medium border border-border rounded-md px-3 h-8 hover:bg-accent transition-colors disabled:opacity-50"
          >
            {isEditing ? (
              <>
                <Check className="size-3.5" />
                {isSaving ? '저장 중...' : '완료'}
              </>
            ) : (
              <>
                <PenLine className="size-3.5" />
                수정
              </>
            )}
          </button>
        }
      />

      {/* 컨텐츠 영역 */}
      <div className="p-4 pb-8 space-y-4">
        {/* 관리자 검토 중 안내 */}
        {isPendingManager && companyStatusRaw === 'pending' && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-2 text-sm text-blue-700">
                <Clock className="size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">관리자 검토 중입니다.</p>
                  <p className="text-xs mt-0.5">검토가 완료될 때까지 회사 정보는 수정할 수 없습니다.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 미입력 필드 알림 - 멤버 전용 */}
        {!isAdmin && isMember && missingFields.length > 0 && (
          <Card className="mb-4 border-amber-200 bg-amber-50">
            <CardContent className="py-3 px-4">
              <div className="flex flex-col gap-1 text-sm text-amber-900">
                <p className="font-semibold">
                  프로필을 모두 채우면 지원 성공 확률이 올라가요.
                </p>
                <p className="text-xs">
                  아직 입력되지 않은 항목: {missingFields.join(', ')}
                  {missingFields.length >= 3 && ' 등'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 프로필 카드 */}
        <ProfileSideCard
          name={currentUser.name}
          photo={currentUser.photo}
          effectiveRole={
            effectiveRole as
              | 'member'
              | 'manager'
              | 'admin'
              | 'pending_manager'
              | null
          }
          attendanceScore={currentUser.attendanceScore}
          introduction={currentUser.introduction}
          isMember={isMember}
          isManagerType={isManager || isPendingManager}
          companyName={currentUser.companyName}
          coverImage={currentUser.coverImage}
          isEditing={isEditing}
          isUploadingPhoto={isUploadingPhoto}
          onNameChange={(v) => handleInputChange('name', v)}
          onIntroductionChange={(v) => handleInputChange('introduction', v)}
          onProfileImageUpload={handleProfileImageUpload}
          onRemoveProfileImage={handleRemoveProfileImage}
        />

        {/* 팔로우 섹션 - 개인정보 위 */}
        {isMember && (
          <FollowingsCard
            followingCount={followingCount}
            followings={followings}
            isLoading={isLoadingFollowings}
            search={followingSearch}
            onSearchChange={setFollowingSearch}
            onOpenProfile={openProfileModal}
            onRemove={handleRemoveFollowing}
          />
        )}
        {isManager && (
          <FollowersCard
            followerCount={followerCount}
            followers={followers}
            isLoading={isLoadingFollowers}
            search={followerSearch}
            onSearchChange={setFollowerSearch}
            onOpenProfile={openProfileModal}
            onRemove={handleRemoveFollower}
          />
        )}

        {/* 개인 정보 (기본 + 개인) */}
        <BasicInfoCard
          email={currentUser.email}
          phone={currentUser.phone}
          kakaoId={currentUser.kakaoId}
          birthDate={currentUser.birthDate}
          gender={currentUser.gender}
          isEditing={isEditing}
          isMember={isMember}
          onEmailChange={(v) => handleInputChange('email', v)}
          onPhoneChange={(v) => handleInputChange('phone', v)}
          onKakaoIdChange={(v) => handleInputChange('kakaoId', v)}
          onBirthDateChange={handleBirthDateChange}
          onGenderChange={(v) => handleInputChange('gender', v)}
        />

        {/* 회사 정보 - 매니저 전용 */}
        {(isManager || isPendingManager) && (
          <CompanyInfoCard
            companyName={currentUser.companyName}
            businessNumber={currentUser.businessNumber}
            companyCertificate={currentUser.companyCertificate}
            companyVerifyStatus={companyStatusRaw}
            companyBadgeLabel={companyBadge.label}
            companyBadgeVariant={companyBadge.variant}
            companyInfoFilled={companyInfoFilled}
            isEditing={isEditing}
            isAdmin={isAdmin}
            isSaving={isSaving}
            isReRequesting={isReRequesting}
            isSubmittingApproval={isReRequesting}
            isPendingManagerDraft={isPendingManager && companyStatusRaw === null}
            isPendingManagerReviewing={isPendingManager && companyStatusRaw === 'pending'}
            isPendingManagerRejected={isPendingManager && companyStatusRaw === 'rejected'}
            coverImage={currentUser.coverImage}
            isUploadingCover={isUploadingCover}
            onCompanyNameChange={(v) => handleInputChange('companyName', v)}
            onBusinessNumberChange={(v) =>
              handleInputChange('businessNumber', v)
            }
            onCompanyCertUpload={handleCompanyCertUpload}
            onVerifyStatusChange={(v) =>
              handleInputChange('companyVerifyStatus', v)
            }
            onSave={handleSaveProfile}
            onCancelEdit={() => setIsEditing(false)}
            onReRequest={handleReRequestManagerApproval}
            onSubmitApproval={handleSubmitManagerApproval}
            onCoverImageUpload={handleCoverImageUpload}
            onRemoveCoverImage={handleRemoveCoverImage}
          />
        )}

        {/* 멤버 전용 섹션 */}
        {isMember && (
          <>
            <ExperienceSection
              currentUser={currentUser}
              isEditing={isEditing}
              showExperienceInput={showExperienceInput}
              setShowExperienceInput={setShowExperienceInput}
              newExperience={newExperience}
              setNewExperience={setNewExperience}
              isLoadingExperiences={isLoadingExperiences}
              loadExperiencesFromSchedules={loadExperiencesFromSchedules}
              addExperienceManual={addExperienceManual}
              removeExperience={removeExperience}
              isSaving={isSaving}
            />

            <LanguageSection
              documents={currentUser.documents}
              showLanguageInput={showLanguageInput}
              setShowLanguageInput={setShowLanguageInput}
              newLanguage={newLanguage}
              setNewLanguage={setNewLanguage}
              addLanguage={addLanguage}
              removeLanguage={removeLanguage}
              isEditing={isEditing}
              isSaving={isSaving}
            />

            <DocumentsSection
              documents={currentUser.documents}
              showDocumentInput={showDocumentInput}
              setShowDocumentInput={setShowDocumentInput}
              newDocumentLabel={newDocumentLabel}
              setNewDocumentLabel={setNewDocumentLabel}
              addDocumentItem={addDocumentItem}
              removeDocumentItem={removeDocumentItem}
              isSaving={isSaving}
            />

            <CertificatesSection
              documents={currentUser.documents}
              showCertificateInput={showCertificateInput}
              setShowCertificateInput={setShowCertificateInput}
              newCertificate={newCertificate}
              setNewCertificate={setNewCertificate}
              addCertificate={addCertificate}
              removeCertificate={removeCertificate}
              isEditing={isEditing}
              isSaving={isSaving}
            />
          </>
        )}
      </div>

      {profileModalUser && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={profileModalUser}
          currentUserId={currentUser?.id}
        />
      )}
    </div>
  );
}
