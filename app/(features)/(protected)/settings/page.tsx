'use client';

import { useUserStore } from '@/store/useUserStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Separator } from '@/app/components/Separator';
import {
  submitReviewAction,
  getMyReviewAction,
  deleteAccountAction,
  updateProfileVisibilityAction,
} from './actions';
import type { ProfileVisibility } from './actions';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  Monitor,
  Settings as SettingsIcon,
  ShieldCheck,
  Briefcase,
  User,
  Bell,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  Users,
  Briefcase as BriefcaseIcon,
  FileText,
  Award,
  Languages,
  LogIn,
  Trash2,
  Eye,
  MoreHorizontal,
  Star,
  MessageSquare,
} from 'lucide-react';
import Hero from '@/app/components/Hero';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import { createClient } from '@/utils/supabase/client';
import { useMemo } from 'react';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

export default function SettingsPage() {
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  useTheme();
  const [mounted, setMounted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    name: string | null;
    avatar: string | null;
    email: string | null;
    loginMethod: string;
  } | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // 프로필 공개 설정 상태
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

  // 실제 프로필 데이터 상태
  const [profileData, setProfileData] = useState<{
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
  } | null>(null);

  const isAdmin = role === 'admin';
  const isManager = role === 'manager' || role === 'pending_manager';
  const isMember = role === 'member';

  // 리뷰 모달 상태
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // 다크모드 hydration 방지 및 설정 로드
  useEffect(() => {
    setMounted(true);
    // localStorage에서 알림 설정 불러오기
    const savedNotificationSetting = localStorage.getItem(
      'notificationsEnabled',
    );
    if (savedNotificationSetting !== null) {
      setNotificationsEnabled(savedNotificationSetting === 'true');
    }

    // iOS 및 standalone 감지
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsIos(ios);
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    // 푸시 알림 권한 및 구독 상태 확인
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

    // 프로필 정보 및 공개 설정 불러오기
    const fetchProfile = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          // 프로필 정보 가져오기 (profile_visibility 포함)
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar, email, phone, kakao_id, birth_date, gender, experiences, documents, profile_visibility')
            .eq('user_id', userData.user.id)
            .single();

          // 프로필 공개 설정 반영
          if (profile?.profile_visibility) {
            setProfileVisibility(profile.profile_visibility as ProfileVisibility);
          }

          // 로그인 방식 확인
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
            name:
              profile?.name || userData.user.user_metadata?.name || '사용자',
            avatar:
              profile?.avatar || userData.user.user_metadata?.avatar || null,
            email: profile?.email || userData.user.email || null,
            loginMethod,
          });

          setProfileData({
            phone: profile?.phone ?? null,
            kakao_id: profile?.kakao_id ?? null,
            birth_date: profile?.birth_date ?? null,
            gender: profile?.gender ?? null,
            experiences: (profile?.experiences as Array<{ title: string; date: string; location: string }>) ?? undefined,
            documents: profile?.documents as {
              certificates?: string[];
              language?: string[];
              idCard?: string;
              bankbook?: string;
              healthCertificate?: string;
              extraDocuments?: string[];
            } | null,
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    fetchProfile();
  }, [supabase]);

  // 기존 리뷰 불러오기 (모달 열릴 때)
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

  // 푸시 알림 토글 핸들러
  const handlePushToggle = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('이 브라우저는 푸시 알림을 지원하지 않습니다.');
      return;
    }

    setIsPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (pushSubscribed) {
        // 구독 해제
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
        // 권한 요청
        const permission = await Notification.requestPermission();
        setPushPermission(permission);

        if (permission !== 'granted') {
          toast.error('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
          return;
        }

        // 구독
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

  // 알림 설정 변경 핸들러
  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('notificationsEnabled', enabled.toString());
  };

  // 프로필 공개 설정 변경 핸들러
  const handleProfileVisibilityToggle = async (
    key: keyof ProfileVisibility,
  ) => {
    const newVisibility = {
      ...profileVisibility,
      [key]: !profileVisibility[key],
    };
    setProfileVisibility(newVisibility);
    const result = await updateProfileVisibilityAction(newVisibility);
    if (!result.ok) {
      setProfileVisibility(profileVisibility);
      toast.error(result.message);
    }
  };

  if (!roleHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

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
        const count = [docs.idCard, docs.bankbook, docs.healthCertificate].filter(Boolean).length + (docs.extraDocuments?.length ?? 0);
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

  // 리뷰 제출 핸들러
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

  // 계정 탈퇴 핸들러
  const handleDeleteAccount = async () => {
    if (
      !confirm(
        '정말 계정을 탈퇴하시겠습니까?\n\n모든 데이터(프로필, 공고, 지원 내역, 스케줄 등)가 영구 삭제되며 복구할 수 없습니다.',
      )
    ) {
      return;
    }

    setIsDeletingAccount(true);
    try {
      const result = await deleteAccountAction();
      if (result.ok) {
        toast.success(result.message);
        window.location.href = '/auth';
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('계정 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div>
      <Hero title="설정" description="계정 및 앱 설정을 관리하세요" />

      <div className="space-y-6">
        {/* 프로필 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              프로필
            </CardTitle>
            <CardDescription>프로필 정보 및 계정 관리</CardDescription>
          </CardHeader>
          <CardContent>
            {/* 프로필 정보 */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <Avatar className="w-16 h-16">
                <AvatarImage
                  src={userProfile?.avatar || undefined}
                  alt={userProfile?.name || '프로필'}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {userProfile?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {userProfile?.name || '사용자'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.email || '이메일 없음'}
                </p>
              </div>
            </div>

            {/* 아코디언 */}
            <Accordion type="multiple" className="w-full">
              {/* 계정 정보 */}
              <AccordionItem value="account-info">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <LogIn className="size-4" />
                    <span className="font-medium">계정</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <LogIn className="size-4 text-muted-foreground" />
                        <div>
                          <Label className="font-medium">로그인 방식</Label>
                          <p className="text-xs text-muted-foreground">
                            현재 사용 중인 로그인 방법
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">
                        {userProfile?.loginMethod || '이메일'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Mail className="size-4 text-muted-foreground" />
                        <div>
                          <Label className="font-medium">이메일</Label>
                          <p className="text-xs text-muted-foreground">
                            계정에 연결된 이메일 주소
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">
                        {userProfile?.email || '없음'}
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 개인 프로필 공개 여부 (스탭만) */}
              {isMember && (
                <AccordionItem value="profile-visibility">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Eye className="size-4" />
                      <span className="font-medium">개인 프로필 공개 여부</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pt-2">
                      {/* 기본 정보 */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">
                          기본 정보
                        </Label>
                        <div className="space-y-3 pl-4">
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Mail className="size-4 text-muted-foreground" />
                              <div>
                                <Label className="font-medium">이메일</Label>
                                <p className="text-xs text-muted-foreground">
                                  이메일 주소 공개 여부
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getFieldPreview('email') === '미설정' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary font-medium'}`}>
                                {getFieldPreview('email')}
                              </span>
                              <Switch
                                checked={profileVisibility.email}
                                onCheckedChange={() =>
                                  handleProfileVisibilityToggle('email')
                                }
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Phone className="size-4 text-muted-foreground" />
                              <div>
                                <Label className="font-medium">전화번호</Label>
                                <p className="text-xs text-muted-foreground">
                                  전화번호 공개 여부
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getFieldPreview('phone') === '미설정' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary font-medium'}`}>
                                {getFieldPreview('phone')}
                              </span>
                              <Switch
                                checked={profileVisibility.phone}
                                onCheckedChange={() =>
                                  handleProfileVisibilityToggle('phone')
                                }
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <MessageCircle className="size-4 text-muted-foreground" />
                              <div>
                                <Label className="font-medium">
                                  카카오톡 ID
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  카카오톡 ID 공개 여부
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getFieldPreview('kakaoId') === '미설정' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary font-medium'}`}>
                                {getFieldPreview('kakaoId')}
                              </span>
                              <Switch
                                checked={profileVisibility.kakaoId}
                                onCheckedChange={() =>
                                  handleProfileVisibilityToggle('kakaoId')
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* 신체 정보 */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">
                          신체 정보
                        </Label>
                        <div className="space-y-3 pl-4">
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Calendar className="size-4 text-muted-foreground" />
                              <div>
                                <Label className="font-medium">나이</Label>
                                <p className="text-xs text-muted-foreground">
                                  나이 정보 공개 여부
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getFieldPreview('age') === '미설정' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary font-medium'}`}>
                                {getFieldPreview('age')}
                              </span>
                              <Switch
                                checked={profileVisibility.age}
                                onCheckedChange={() =>
                                  handleProfileVisibilityToggle('age')
                                }
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Users className="size-4 text-muted-foreground" />
                              <div>
                                <Label className="font-medium">성별</Label>
                                <p className="text-xs text-muted-foreground">
                                  성별 정보 공개 여부
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getFieldPreview('gender') === '미설정' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary font-medium'}`}>
                                {getFieldPreview('gender')}
                              </span>
                              <Switch
                                checked={profileVisibility.gender}
                                onCheckedChange={() =>
                                  handleProfileVisibilityToggle('gender')
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* 경력 */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">경력</Label>
                        <div className="pl-4">
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <BriefcaseIcon className="size-4 text-muted-foreground" />
                              <div>
                                <Label className="font-medium">경력</Label>
                                <p className="text-xs text-muted-foreground">
                                  경력 정보 공개 여부
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getFieldPreview('experiences') === '미설정' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary font-medium'}`}>
                                {getFieldPreview('experiences')}
                              </span>
                              <Switch
                                checked={profileVisibility.experiences}
                                onCheckedChange={() =>
                                  handleProfileVisibilityToggle('experiences')
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* 서류 */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">서류</Label>
                        <div className="pl-4">
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <FileText className="size-4 text-muted-foreground" />
                              <div>
                                <Label className="font-medium">서류</Label>
                                <p className="text-xs text-muted-foreground">
                                  서류 정보 공개 여부
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getFieldPreview('documents') === '미설정' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary font-medium'}`}>
                                {getFieldPreview('documents')}
                              </span>
                              <Switch
                                checked={profileVisibility.documents}
                                onCheckedChange={() =>
                                  handleProfileVisibilityToggle('documents')
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* 자격증 */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">
                          자격증
                        </Label>
                        <div className="pl-4">
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Award className="size-4 text-muted-foreground" />
                              <div>
                                <Label className="font-medium">자격증</Label>
                                <p className="text-xs text-muted-foreground">
                                  자격증 정보 공개 여부
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getFieldPreview('certificates') === '미설정' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary font-medium'}`}>
                                {getFieldPreview('certificates')}
                              </span>
                              <Switch
                                checked={profileVisibility.certificates}
                                onCheckedChange={() =>
                                  handleProfileVisibilityToggle('certificates')
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* 어학 능력 */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">
                          어학 능력
                        </Label>
                        <div className="pl-4">
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Languages className="size-4 text-muted-foreground" />
                              <div>
                                <Label className="font-medium">어학 능력</Label>
                                <p className="text-xs text-muted-foreground">
                                  어학 능력 정보 공개 여부
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getFieldPreview('languages') === '미설정' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary font-medium'}`}>
                                {getFieldPreview('languages')}
                              </span>
                              <Switch
                                checked={profileVisibility.languages}
                                onCheckedChange={() =>
                                  handleProfileVisibilityToggle('languages')
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* 계정 관리 */}
              <AccordionItem value="account-management">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Trash2 className="size-4" />
                    <span className="font-medium">계정 관리</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Label className="font-medium text-destructive">
                            계정 탈퇴
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            계정을 삭제하면 모든 데이터가 영구적으로 삭제되며
                            복구할 수 없습니다.
                          </p>
                        </div>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={isDeletingAccount}
                          className="ml-4 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md border border-destructive/20 transition-colors disabled:opacity-50"
                        >
                          {isDeletingAccount ? '처리중...' : '탈퇴하기'}
                        </button>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* 공통 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="size-5" />앱 설정
            </CardTitle>
            <CardDescription>
              모든 사용자에게 적용되는 설정입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion
              type="multiple"
              className="w-full"
              defaultValue={['theme']}
            >
              {/* 테마 설정 아코디언 */}
              <AccordionItem value="theme">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Monitor className="size-4" />
                    <span className="font-medium">테마 설정</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      앱의 색상 테마를 선택하세요
                    </p>
                    {mounted && (
                      <div className="space-y-3">
                        {/* 테마 토글 버튼 */}
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <AnimatedThemeToggler
                              className="size-8 p-1 rounded-lg border hover:bg-accent transition-colors"
                              duration={500}
                            />
                            <div>
                              <Label className="font-medium">다크 모드</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 알림 설정 아코디언 */}
              <AccordionItem value="notifications">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Bell className="size-4" />
                    <span className="font-medium">알림 설정</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 flex-1">
                        <p className="text-sm text-muted-foreground">
                          앱 내 알림 수신 여부를 설정합니다
                        </p>
                      </div>
                      <Switch
                        checked={notificationsEnabled}
                        onCheckedChange={handleNotificationToggle}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5 flex-1">
                          <Label className="font-medium">푸시 알림</Label>
                          <p className="text-xs text-muted-foreground">
                            앱을 열지 않아도 알림을 받습니다
                          </p>
                          {pushPermission === 'denied' && (
                            <p className="text-xs text-destructive mt-1">
                              알림이 차단되어 있습니다. 브라우저 설정에서 허용해주세요.
                            </p>
                          )}
                        </div>
                        <Switch
                          checked={pushSubscribed}
                          disabled={isPushLoading || pushPermission === 'denied'}
                          onCheckedChange={handlePushToggle}
                        />
                      </div>

                      {isIos && !isStandalone && (
                        <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                            iOS 푸시 알림 사용 방법
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Safari 하단의 공유 버튼 → &quot;홈 화면에 추가&quot;로 앱을 설치한 후 다시 열어주세요.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* 관리자 전용 섹션 */}
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

        {/* 매니저 전용 섹션 */}
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

        {/* 기타 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MoreHorizontal className="size-5" />
              기타
            </CardTitle>
            <CardDescription>기타 설정 및 기능</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="review">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-4" />
                    <span className="font-medium">앱 리뷰 작성</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      고인력 서비스에 대한 소중한 의견을 남겨주세요. 더 나은
                      서비스를 제공하는 데 큰 도움이 됩니다.
                    </p>
                    <Dialog
                      open={isReviewModalOpen}
                      onOpenChange={setIsReviewModalOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                          <Star className="size-4 mr-2" />
                          리뷰 작성하기
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>앱 리뷰 작성</DialogTitle>
                          <DialogDescription>
                            고인력 서비스에 대한 솔직한 리뷰를 남겨주세요.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {/* 별점 선택 */}
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
                                    className={`size-8 ${
                                      star <= reviewRating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground'
                                    }`}
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
                          {/* 리뷰 내용 */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="review-content"
                              className="text-sm font-medium"
                            >
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
                          <Button
                            variant="outline"
                            onClick={() => setIsReviewModalOpen(false)}
                          >
                            취소
                          </Button>
                          <Button
                            onClick={handleSubmitReview}
                            disabled={
                              isSubmittingReview ||
                              reviewRating === 0 ||
                              !reviewContent.trim()
                            }
                          >
                            {isSubmittingReview ? '제출 중...' : '리뷰 제출'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
