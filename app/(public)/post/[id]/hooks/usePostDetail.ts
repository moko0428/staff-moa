'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'sonner';
import { getPublicPostByIdAction } from '../../actions';
import {
  addFavoriteAction,
  removeFavoriteAction,
  checkFavoriteAction,
  getProfileForModalAction,
} from '@/app/(protected)/worker/favorit/actions';
import {
  applyToPostAction,
  checkAppliedToPostAction,
} from '@/app/(protected)/worker/schedule/actions';
import { checkReportAction } from '@/app/(protected)/admin/report-actions';
import { deletePostAction } from '@/app/(protected)/my-post/actions';
import { PostData } from '../types';
import { User } from '@/types/mockData';

export type ProfileModalUser = {
  id: string;
  name: string | null;
  email: string | null;
  photo?: string | null;
  role: string;
  introduction?: string | null;
  attendanceScore?: number | null;
  followerCount?: number;
  companyName?: string | null;
  companyVerifyStatus?: string | null;
};

export const usePostDetail = (id: string) => {
  const router = useRouter();
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const isMember = role === 'member';
  const isManager = role === 'manager';

  const [post, setPost] = useState<PostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<ProfileModalUser | null>(null);

  // 로그인 완료 시 로그인 유도 모달 자동 닫기
  useEffect(() => {
    if (currentUserId && loginPromptOpen) {
      setLoginPromptOpen(false);
    }
  }, [currentUserId, loginPromptOpen]);

  // 공고 데이터 로드
  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const result = await getPublicPostByIdAction(id);
        if (result.ok && result.data) {
          setPost(result.data as PostData);
        } else {
          console.error('Failed to fetch post:', result.message);
        }
      } catch (error) {
        console.error('Failed to fetch post:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  // 현재 사용자 정보 로드
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          setCurrentUserId(data.user.id);
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
          if (profile) {
            const user: User = {
              id: data.user.id,
              name: profile.name || '',
              email: profile.email || '',
              role: (profile.role as User['role']) || 'member',
              phone: profile.phone || undefined,
              kakaoId: profile.kakao_id || undefined,
              gender:
                profile.gender === '남성' || profile.gender === '여성'
                  ? profile.gender
                  : undefined,
              mbti: profile.mbti || undefined,
              personality: profile.personality || undefined,
              experiences: (profile.experiences as User['experiences']) || [],
              documents: (profile.documents as User['documents']) || undefined,
              attendanceScore: profile.attendance_score || 50,
              createdAt: profile.created_at || new Date().toISOString(),
            };
            setCurrentUser(user);
          }
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // 관심 목록 상태 확인
  useEffect(() => {
    if (currentUserId && roleHydrated && isMember && post) {
      const checkFavorite = async () => {
        try {
          const result = await checkFavoriteAction(post.post_id.toString());
          if (result.ok) setIsFavorite(result.data || false);
        } catch (error) {
          console.error('Failed to check favorite:', error);
        }
      };
      checkFavorite();
    }
  }, [currentUserId, post, roleHydrated, isMember]);

  // 지원 여부 확인
  useEffect(() => {
    if (currentUserId && roleHydrated && isMember && post) {
      const checkApplied = async () => {
        try {
          const result = await checkAppliedToPostAction(post.post_id);
          if (result.ok && result.data) setHasApplied(result.data.applied);
        } catch (error) {
          console.error('Failed to check applied:', error);
        }
      };
      checkApplied();
    }
  }, [currentUserId, post, roleHydrated, isMember]);

  // 신고 여부 확인
  useEffect(() => {
    if (currentUserId && roleHydrated && post) {
      const checkReport = async () => {
        try {
          const result = await checkReportAction(post.post_id);
          if (result.ok) setHasReported(result.data || false);
        } catch (error) {
          console.error('Failed to check report:', error);
        }
      };
      checkReport();
    }
  }, [currentUserId, post, roleHydrated]);

  const toggleFavorite = async () => {
    if (!isMember || !currentUserId || !roleHydrated || !post) return;
    try {
      if (isFavorite) {
        const result = await removeFavoriteAction(post.post_id.toString());
        if (result.ok) {
          setIsFavorite(false);
          window.dispatchEvent(new Event('favorites-updated'));
        } else {
          toast.error(result.message || '관심목록 제거에 실패했습니다.');
        }
      } else {
        const result = await addFavoriteAction(post.post_id.toString());
        if (result.ok) {
          setIsFavorite(true);
          window.dispatchEvent(new Event('favorites-updated'));
        } else {
          toast.error(result.message || '관심목록 추가에 실패했습니다.');
        }
      }
    } catch {
      toast.error('관심목록 변경 중 오류가 발생했습니다.');
    }
  };

  const handleSubmitApplication = async () => {
    if (!currentUser || !post) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    try {
      const result = await applyToPostAction(post.post_id, applicationMessage.trim() || undefined);
      if (result.ok) {
        toast.success(result.message || '지원이 완료되었습니다.');
        setHasApplied(true);
        setApplyOpen(false);
        setApplicationMessage('');
      } else {
        toast.error(result.message || '지원에 실패했습니다.');
      }
    } catch {
      toast.error('지원 중 오류가 발생했습니다.');
    }
  };

  const handleDeletePost = async () => {
    if (!post || !currentUserId || currentUserId !== post.author_id) return;
    const confirmed = window.confirm('이 공고를 삭제하시겠습니까?');
    if (!confirmed) return;
    const result = await deletePostAction(post.post_id.toString());
    if (result.ok) {
      toast.success('공고가 삭제되었습니다.');
      router.push('/post');
      return;
    }
    toast.error(result.message || '공고 삭제에 실패했습니다.');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.title, url: window.location.href });
      } catch {
        // 사용자가 공유를 취소한 경우
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 복사되었습니다.');
    }
  };

  const openAuthorProfileModal = async () => {
    if (!post?.author_id) return;
    setProfileModalUser({
      id: post.author_id,
      name: post.author_name || post.manager_name || null,
      email: null,
      photo: post.author_avatar || null,
      role: 'manager',
      introduction: null,
      attendanceScore: null,
      followerCount: 0,
      companyName: post.company_name || null,
      companyVerifyStatus: null,
    });
    setProfileModalOpen(true);
    try {
      const result = await getProfileForModalAction(post.author_id);
      if (!result.ok || !result.data) return;
      const profileData = result.data;
      setProfileModalUser((prev) => {
        if (!prev || prev.id !== post.author_id) return prev;
        return {
          ...prev,
          id: profileData.id,
          name: profileData.name ?? prev.name ?? null,
          email: profileData.email ?? null,
          photo: profileData.photo ?? prev.photo ?? null,
          role: profileData.role ?? prev.role,
          introduction: profileData.introduction ?? null,
          attendanceScore: profileData.attendanceScore ?? null,
          followerCount: profileData.followerCount,
          companyName: profileData.companyName ?? prev.companyName ?? null,
          companyVerifyStatus: profileData.companyVerifyStatus ?? prev.companyVerifyStatus ?? null,
        };
      });
    } catch (error) {
      console.error('Failed to fetch author profile:', error);
    }
  };

  const handleAuthorProfileClick = async () => {
    if (!currentUserId) {
      setLoginPromptOpen(true);
      return;
    }
    await openAuthorProfileModal();
  };

  const markAsReported = () => setHasReported(true);

  return {
    post,
    isLoading,
    isFavorite,
    applyOpen,
    setApplyOpen,
    currentUser,
    currentUserId,
    applicationMessage,
    setApplicationMessage,
    hasApplied,
    reportOpen,
    setReportOpen,
    hasReported,
    markAsReported,
    profileModalOpen,
    setProfileModalOpen,
    loginPromptOpen,
    setLoginPromptOpen,
    profileModalUser,
    isMember,
    isManager,
    roleHydrated,
    toggleFavorite,
    handleSubmitApplication,
    handleDeletePost,
    handleShare,
    handleAuthorProfileClick,
  };
};
