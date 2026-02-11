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
import { submitReviewAction, getMyReviewAction } from './actions';
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
  Brain,
  Calendar,
  Users,
  Ruler,
  Scale,
  Heart,
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
  const [userProfile, setUserProfile] = useState<{
    name: string | null;
    avatar: string | null;
    email: string | null;
    loginMethod: string;
  } | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // 프로필 공개 설정 상태
  const [profileVisibility, setProfileVisibility] = useState({
    // 기본 정보
    email: true,
    phone: true,
    kakaoId: true,
    mbti: true,
    // 신체 정보
    age: true,
    gender: true,
    heightWeight: true,
    // 성격 및 특징
    personalityFeatures: true,
    // 경력
    experiences: true,
    // 서류
    documents: true,
    // 자격증
    certificates: true,
    // 어학 능력
    languages: true,
  });

  const isAdmin = role === 'admin';
  const isManager = role === 'manager' || role === 'pending_manager';
  const isMember = role === 'member';

  // 리뷰 모달 상태
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

    // localStorage에서 프로필 공개 설정 불러오기
    const savedProfileVisibility = localStorage.getItem('profileVisibility');
    if (savedProfileVisibility) {
      try {
        setProfileVisibility(JSON.parse(savedProfileVisibility));
      } catch (error) {
        console.error('Failed to parse profile visibility settings', error);
      }
    }

    // 프로필 정보 가져오기
    const fetchProfile = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          // 프로필 정보 가져오기
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar, email')
            .eq('user_id', userData.user.id)
            .single();

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
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    fetchProfile();
  }, [supabase]);

  // 알림 설정 변경 핸들러
  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('notificationsEnabled', enabled.toString());
  };

  // 프로필 공개 설정 변경 핸들러
  const handleProfileVisibilityToggle = (
    key: keyof typeof profileVisibility,
  ) => {
    const newVisibility = {
      ...profileVisibility,
      [key]: !profileVisibility[key],
    };
    setProfileVisibility(newVisibility);
    localStorage.setItem('profileVisibility', JSON.stringify(newVisibility));
  };

  // 기존 리뷰 불러오기
  useEffect(() => {
    if (isReviewModalOpen) {
      const loadMyReview = async () => {
        const result = await getMyReviewAction();
        if (result.ok && result.data) {
          setReviewRating(result.data.rating);
          setReviewContent(result.data.content);
        }
      };
      loadMyReview();
    }
  }, [isReviewModalOpen]);

  if (!roleHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  // 리뷰 제출 핸들러
  const handleSubmitReview = async () => {
    if (reviewRating === 0 || !reviewContent.trim()) {
      toast.error('별점과 리뷰 내용을 모두 입력해주세요.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const result = await submitReviewAction({
        rating: reviewRating,
        content: reviewContent,
      });

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
      !confirm('정말 계정을 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
    ) {
      return;
    }

    // TODO: 계정 탈퇴 로직 구현
    toast.message('계정 탈퇴 기능은 곧 구현될 예정입니다.');
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
                            <Switch
                              checked={profileVisibility.email}
                              onCheckedChange={() =>
                                handleProfileVisibilityToggle('email')
                              }
                            />
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
                            <Switch
                              checked={profileVisibility.phone}
                              onCheckedChange={() =>
                                handleProfileVisibilityToggle('phone')
                              }
                            />
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
                            <Switch
                              checked={profileVisibility.kakaoId}
                              onCheckedChange={() =>
                                handleProfileVisibilityToggle('kakaoId')
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Brain className="size-4 text-muted-foreground" />
                              <div>
                                <Label className="font-medium">MBTI</Label>
                                <p className="text-xs text-muted-foreground">
                                  MBTI 성격 유형 공개 여부
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={profileVisibility.mbti}
                              onCheckedChange={() =>
                                handleProfileVisibilityToggle('mbti')
                              }
                            />
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
                            <Switch
                              checked={profileVisibility.age}
                              onCheckedChange={() =>
                                handleProfileVisibilityToggle('age')
                              }
                            />
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
                            <Switch
                              checked={profileVisibility.gender}
                              onCheckedChange={() =>
                                handleProfileVisibilityToggle('gender')
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Ruler className="size-4 text-muted-foreground" />
                                <Scale className="size-4 text-muted-foreground" />
                              </div>
                              <div>
                                <Label className="font-medium">키/몸무게</Label>
                                <p className="text-xs text-muted-foreground">
                                  키와 몸무게 정보 공개 여부
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={profileVisibility.heightWeight}
                              onCheckedChange={() =>
                                handleProfileVisibilityToggle('heightWeight')
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* 성격 및 특징 */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">
                          성격 및 특징
                        </Label>
                        <div className="pl-4">
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Heart className="size-4 text-muted-foreground" />
                              <div>
                                <Label className="font-medium">
                                  성격 및 특징
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  성격과 특징 정보 공개 여부
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={profileVisibility.personalityFeatures}
                              onCheckedChange={() =>
                                handleProfileVisibilityToggle(
                                  'personalityFeatures',
                                )
                              }
                            />
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
                            <Switch
                              checked={profileVisibility.experiences}
                              onCheckedChange={() =>
                                handleProfileVisibilityToggle('experiences')
                              }
                            />
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
                            <Switch
                              checked={profileVisibility.documents}
                              onCheckedChange={() =>
                                handleProfileVisibilityToggle('documents')
                              }
                            />
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
                            <Switch
                              checked={profileVisibility.certificates}
                              onCheckedChange={() =>
                                handleProfileVisibilityToggle('certificates')
                              }
                            />
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
                          className="ml-4 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md border border-destructive/20 transition-colors"
                        >
                          탈퇴하기
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
                      스탭알바 서비스에 대한 소중한 의견을 남겨주세요. 더 나은
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
                            스탭알바 서비스에 대한 솔직한 리뷰를 남겨주세요.
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
