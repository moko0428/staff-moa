'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import {
  submitReviewAction,
  getMyReviewAction,
  deleteAccountAction,
  updateProfileVisibilityAction,
} from '../actions';
import type { ProfileVisibility } from '../actions';

export type UserProfile = {
  name: string | null;
  avatar: string | null;
  email: string | null;
  loginMethod: string;
};

export type ProfileData = {
  phone?: string | null;
  kakao_id?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  experiences?: Array<{ title: string; date: string; location: string }>;
  documents?: {
    certificates?: string[];
    language?: string[];
    idCard?: string;
    bankbook?: string;
    healthCertificate?: string;
    extraDocuments?: string[];
  } | null;
};

export function useSettingsPage() {
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const supabase = useMemo(() => createClient(), []);

  const [mounted, setMounted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>({
    email: true,
    phone: true,
    kakaoId: true,
    age: true,
    gender: true,
    experiences: true,
    documents: true,
    certificates: true,
    languages: true,
  });
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  const isAdmin = role === 'admin';
  const isManager = role === 'manager' || role === 'pending_manager';
  const isMember = role === 'member';

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    setMounted(true);

    const savedNotificationSetting = localStorage.getItem('notificationsEnabled');
    if (savedNotificationSetting !== null) {
      setNotificationsEnabled(savedNotificationSetting === 'true');
    }

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsIos(ios);
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setPushSubscribed(!!sub);
        });
      });
    }

    const fetchProfile = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar, email, phone, kakao_id, birth_date, gender, experiences, documents, profile_visibility')
            .eq('user_id', userData.user.id)
            .single();

          if (profile?.profile_visibility) {
            setProfileVisibility(profile.profile_visibility as ProfileVisibility);
          }

          const identities = userData.user.identities || [];
          const loginMethod =
            identities.length > 0
              ? identities[0].provider === 'email'
                ? '이메일'
                : identities[0].provider === 'google'
                ? 'Google'
                : identities[0].provider === 'kakao'
                ? '카카오'
                : '소셜 로그인'
              : '이메일';

          setUserProfile({
            name: profile?.name || userData.user.user_metadata?.name || '사용자',
            avatar: profile?.avatar || userData.user.user_metadata?.avatar || null,
            email: profile?.email || userData.user.email || null,
            loginMethod,
          });

          setProfileData({
            phone: profile?.phone ?? null,
            kakao_id: profile?.kakao_id ?? null,
            birth_date: profile?.birth_date ?? null,
            gender: profile?.gender ?? null,
            experiences: (profile?.experiences as Array<{ title: string; date: string; location: string }>) ?? undefined,
            documents: profile?.documents as ProfileData['documents'],
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    fetchProfile();
  }, [supabase]);

  useEffect(() => {
    if (!isReviewModalOpen) return;
    const loadMyReview = async () => {
      const result = await getMyReviewAction();
      if (result.ok && result.data) {
        setReviewRating(result.data.rating);
        setReviewContent(result.data.content);
      }
    };
    loadMyReview();
  }, [isReviewModalOpen]);

  const handlePushToggle = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('이 브라우저는 푸시 알림을 지원하지 않습니다.');
      return;
    }

    setIsPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (pushSubscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        setPushSubscribed(false);
        toast.success('푸시 알림 구독이 해제되었습니다.');
      } else {
        const permission = await Notification.requestPermission();
        setPushPermission(permission);

        if (permission !== 'granted') {
          toast.error('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
          return;
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          toast.error('푸시 알림 설정이 올바르지 않습니다.');
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        });

        const subJson = sub.toJSON();
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          }),
        });

        setPushSubscribed(true);
        toast.success('푸시 알림이 활성화되었습니다.');
      }
    } catch (err) {
      console.error('[PushToggle] Error:', err);
      toast.error('푸시 알림 설정 중 오류가 발생했습니다.');
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('notificationsEnabled', enabled.toString());
  };

  const handleProfileVisibilityToggle = async (key: keyof ProfileVisibility) => {
    const newVisibility = { ...profileVisibility, [key]: !profileVisibility[key] };
    setProfileVisibility(newVisibility);
    const result = await updateProfileVisibilityAction(newVisibility);
    if (!result.ok) {
      setProfileVisibility(profileVisibility);
      toast.error(result.message);
    }
  };

  const calcAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const getFieldPreview = (field: keyof ProfileVisibility): string => {
    if (!profileData) return '';
    switch (field) {
      case 'email': return userProfile?.email || '미설정';
      case 'phone': return profileData.phone || '미설정';
      case 'kakaoId': return profileData.kakao_id || '미설정';
      case 'age': return profileData.birth_date ? `${calcAge(profileData.birth_date)}세` : '미설정';
      case 'gender': return profileData.gender || '미설정';
      case 'experiences': {
        const count = profileData.experiences?.length ?? 0;
        return count > 0 ? `${count}건` : '미설정';
      }
      case 'documents': {
        const docs = profileData.documents;
        if (!docs) return '미설정';
        const count =
          [docs.idCard, docs.bankbook, docs.healthCertificate].filter(Boolean).length +
          (docs.extraDocuments?.length ?? 0);
        return count > 0 ? `${count}개` : '미설정';
      }
      case 'certificates': {
        const count = profileData.documents?.certificates?.length ?? 0;
        return count > 0 ? `${count}개` : '미설정';
      }
      case 'languages': {
        const count = profileData.documents?.language?.length ?? 0;
        return count > 0 ? `${count}개` : '미설정';
      }
      default: return '';
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0 || !reviewContent.trim()) {
      toast.error('별점과 리뷰 내용을 모두 입력해주세요.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const result = await submitReviewAction({ rating: reviewRating, content: reviewContent });
      if (result.ok) {
        toast.success(result.message);
        setIsReviewModalOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('리뷰 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteConfirmText('');
    setShowDeleteDialog(true);
  };

  const handleDeleteAccountConfirm = async () => {
    setIsDeletingAccount(true);
    try {
      const result = await deleteAccountAction();
      if (result.ok) {
        toast.success(result.message);
        window.location.href = '/auth';
      } else {
        toast.error(result.message);
        setShowDeleteDialog(false);
      }
    } catch {
      toast.error('계정 삭제 중 오류가 발생했습니다.');
      setShowDeleteDialog(false);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return {
    role,
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
  };
}
