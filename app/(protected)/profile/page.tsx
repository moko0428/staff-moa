'use client';

import { useState } from 'react';
import Hero from '@/app/components/Hero';
import { toast } from 'sonner';
import { Card, CardContent } from '@/app/components/ui/card';
import Link from 'next/link';
import { useUserStore } from '@/store/useUserStore';
import { useProfile } from './hook/useProfile';
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
import { PersonalInfoCard } from './components/organisms/PersonalInfoCard';
import { FollowingsCard } from './components/organisms/FollowingsCard';
import { FollowersCard } from './components/organisms/FollowersCard';
import ExperienceSection from './components/ExperienceSection';
import DocumentsSection from './components/DocumentsSection';
import CertificatesSection from './components/CertificatesSection';
import LanguageSection from './components/LanguageSection';
import ProfileModal from '@/app/components/profile-modal';

export default function ProfilePage() {
  const {
    supabase: _supabase,
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
    handleReRequestManagerApproval,
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
        <Hero title="프로필" description="내 프로필 정보" />
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div>
        <Hero title="프로필" description="내 프로필 정보" />
        <div className="flex flex-col items-center justify-center gap-4 min-h-[400px] text-muted-foreground">
          <p>로그인이 필요합니다.</p>
          <div className="flex gap-2">
            <Link href="/auth/login" className="text-primary underline">
              로그인
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/auth/join" className="text-primary underline">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const companyStatusRaw = (currentUser.companyVerifyStatus ?? 'pending') as
    | 'pending'
    | 'approved'
    | 'rejected';
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

  return (
    <div>
      {!isAdmin && missingFields.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex flex-col gap-2 text-sm text-amber-900">
              <p className="font-semibold">
                {isMember
                  ? '프로필을 모두 채우면 지원 성공 확률이 올라가요.'
                  : '프로필을 모두 채우면 회사 인증을 승인 받을 수 있어요.'}
              </p>
              <p>
                아직 입력되지 않은 항목: {missingFields.join(', ')}
                {missingFields.length >= 3 && ' 등'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 프로필 사이드 카드 */}
        <div className="lg:col-span-1">
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
            isEditing={isEditing}
            isUploadingPhoto={isUploadingPhoto}
            isSaving={isSaving}
            onToggleEdit={() => setIsEditing(!isEditing)}
            onNameChange={(v) => handleInputChange('name', v)}
            onIntroductionChange={(v) => handleInputChange('introduction', v)}
            onProfileImageUpload={handleProfileImageUpload}
            onRemoveProfileImage={handleRemoveProfileImage}
          />
        </div>

        {/* 상세 정보 */}
        <div className="lg:col-span-2 space-y-6">
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

          <BasicInfoCard
            name={currentUser.name}
            email={currentUser.email}
            phone={currentUser.phone}
            kakaoId={currentUser.kakaoId}
            isEditing={isEditing}
            isManagerOrPending={isManager || isPendingManager}
            onNameChange={(v) => handleInputChange('name', v)}
            onEmailChange={(v) => handleInputChange('email', v)}
            onPhoneChange={(v) => handleInputChange('phone', v)}
            onKakaoIdChange={(v) => handleInputChange('kakaoId', v)}
          />

          {isAdmin && isEditing && (
            <div className="flex justify-end gap-2">
              <button
                className="border rounded px-4 py-2 text-sm"
                onClick={() => setIsEditing(false)}
              >
                취소
              </button>
              <button
                className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          )}

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
              isPendingManagerRejected={
                isPendingManager && companyStatusRaw === 'rejected'
              }
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
            />
          )}

          {isMember && (
            <>
              <PersonalInfoCard
                age={currentUser.age}
                birthDate={currentUser.birthDate}
                gender={currentUser.gender}
                isEditing={isEditing}
                isSaving={isSaving}
                onBirthDateChange={handleBirthDateChange}
                onGenderChange={(v) => handleInputChange('gender', v)}
                onSave={handleSaveProfile}
                onCancelEdit={() => setIsEditing(false)}
              />

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
            </>
          )}
        </div>
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
