'use client';

import { useTheme } from 'next-themes';
import Hero from '@/app/components/Hero';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { ShieldCheck, Briefcase } from 'lucide-react';
import { useSettingsPage } from './hooks/useSettingsPage';
import { ProfileCard } from './components/organisms/ProfileCard';
import { AppSettingsCard } from './components/organisms/AppSettingsCard';
import { MiscCard } from './components/organisms/MiscCard';

export default function SettingsPage() {
  useTheme();
  const {
    roleHydrated,
    mounted,
    notificationsEnabled,
    pushPermission,
    pushSubscribed,
    isPushLoading,
    isIos,
    isStandalone,
    userProfile,
    profileVisibility,
    isAdmin,
    isManager,
    isMember,
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
    handlePushToggle,
    handleNotificationToggle,
    handleProfileVisibilityToggle,
    getFieldPreview,
    handleSubmitReview,
    handleDeleteAccount,
    handleDeleteAccountConfirm,
  } = useSettingsPage();

  if (!roleHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <Hero title="설정" description="계정 및 앱 설정을 관리하세요" />

      <div className="space-y-6">
        <ProfileCard
          userProfile={userProfile}
          isMember={isMember}
          profileVisibility={profileVisibility}
          getFieldPreview={getFieldPreview}
          onVisibilityToggle={handleProfileVisibilityToggle}
          showDeleteDialog={showDeleteDialog}
          setShowDeleteDialog={setShowDeleteDialog}
          deleteConfirmText={deleteConfirmText}
          setDeleteConfirmText={setDeleteConfirmText}
          isDeletingAccount={isDeletingAccount}
          onDeleteAccount={handleDeleteAccount}
          onDeleteAccountConfirm={handleDeleteAccountConfirm}
        />

        <AppSettingsCard
          mounted={mounted}
          notificationsEnabled={notificationsEnabled}
          onNotificationToggle={handleNotificationToggle}
          pushPermission={pushPermission}
          pushSubscribed={pushSubscribed}
          isPushLoading={isPushLoading}
          onPushToggle={handlePushToggle}
          isIos={isIos}
          isStandalone={isStandalone}
        />

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5" />
                관리자 설정
              </CardTitle>
              <CardDescription>관리자 전용 설정입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="admin-settings">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="font-medium">관리자 전용 설정</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-muted-foreground pt-2">
                      관리자 전용 설정 항목이 여기에 표시됩니다.
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}

        {isManager && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="size-5" />
                매니저 설정
              </CardTitle>
              <CardDescription>매니저 전용 설정입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="manager-settings">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="font-medium">매니저 전용 설정</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-muted-foreground pt-2">
                      매니저 전용 설정 항목이 여기에 표시됩니다.
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}

        <MiscCard
          isReviewModalOpen={isReviewModalOpen}
          setIsReviewModalOpen={setIsReviewModalOpen}
          reviewRating={reviewRating}
          setReviewRating={setReviewRating}
          reviewContent={reviewContent}
          setReviewContent={setReviewContent}
          isSubmittingReview={isSubmittingReview}
          onSubmitReview={handleSubmitReview}
        />
      </div>
    </div>
  );
}
