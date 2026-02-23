'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Hero from '@/app/components/Hero';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/components/ui/dialog';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Users,
  Phone,
  User2,
  BriefcaseBusiness,
  FileText,
  Check,
  Heart,
  Share2,
  Building2,
  Flag,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useUserStore } from '@/store/useUserStore';
import { getPublicPostByIdAction } from '../actions';
import {
  addFavoriteAction,
  removeFavoriteAction,
  checkFavoriteAction,
  getProfileForModalAction,
} from '@/app/(features)/(protected)/worker/favorit/actions';
import { applyToPostAction, checkAppliedToPostAction } from '@/app/(features)/(protected)/worker/schedule/actions';
import { checkReportAction } from '@/app/(features)/(protected)/admin/report-actions';
import { deletePostAction } from '@/app/(features)/(protected)/my-post/actions';
import ReportModal from '@/app/components/ReportModal';
import ProfileModal from '@/app/components/profile-modal';
import { User } from '@/types/mockData';
import Link from 'next/link';

type WorkSlot = {
  date: string;
  start_time?: string;
  end_time?: string;
  start?: string;
  end?: string;
  location?: string;
  pay_type?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  pay_amount?: number;
  tax_withholding?: boolean;
};

type PostData = {
  post_id: number;
  author_id: string;
  title: string;
  description: string;
  work_date?: string;
  work_time_start?: string;
  work_time_end?: string;
  location?: string;
  pay_amount?: string | number;
  pay_type?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  tax_withholding?: boolean;
  work_slots?: WorkSlot[];
  recruit_count: number;
  manager_name: string;
  manager_contact_type?: 'phone' | 'kakao' | 'email' | 'other';
  manager_phone: string;
  equipments?: string;
  qualifications?: string;
  preferences?: string;
  notes?: string;
  external_link?: string;
  keywords?: string[];
  status: 'recruiting' | 'completed' | 'urgent';
  created_at: string;
  currentApplicants?: number;
  author_name?: string;
  author_avatar?: string;
  company_name?: string;
};

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const isMember = role === 'member';

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
  const [profileModalUser, setProfileModalUser] = useState<{
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
  } | null>(null);

  const formatKstDateTime = (input: string | Date) => {
    const date = typeof input === 'string' ? parseISO(input) : input;
    if (Number.isNaN(date.getTime())) return '-';
    const parts = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? '';
    return `${get('year')}.${get('month')}.${get('day')} ${get('hour')}:${get('minute')}`;
  };

  // 로그인 상태가 확인되면(로그인 완료) 로그인 유도 모달은 자동 닫기
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
          if (result.ok) {
            setIsFavorite(result.data || false);
          }
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
          if (result.ok && result.data) {
            setHasApplied(result.data.applied);
          }
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
          if (result.ok) {
            setHasReported(result.data || false);
          }
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
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('관심목록 변경 중 오류가 발생했습니다.');
    }
  };

  const handleSubmitApplication = async () => {
    if (!currentUser || !post) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      const result = await applyToPostAction(
        post.post_id,
        applicationMessage.trim() || undefined
      );
      if (result.ok) {
        toast.success(result.message || '지원이 완료되었습니다.');
        setHasApplied(true);
        setApplyOpen(false);
        setApplicationMessage('');
      } else {
        toast.error(result.message || '지원에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to apply:', error);
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
        await navigator.share({
          title: post?.title,
          url: window.location.href,
        });
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

    // 먼저 포스트에 포함된 최소 정보로 모달을 즉시 오픈
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

    // 백그라운드로 프로필 상세 로드 (manager_follows 기반 팔로워 수 포함)
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
    // 비로그인 사용자는 로그인 유도 모달
    if (!currentUserId) {
      setLoginPromptOpen(true);
      return;
    }

    await openAuthorProfileModal();
  };

  const formatNumberWithComma = (value: string | number | undefined) => {
    if (!value) return '0';
    const numeric = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(numeric)) return String(value);
    return numeric.toLocaleString('ko-KR');
  };

  const getPayTypeLabel = (payType?: string) => {
    switch (payType) {
      case 'hourly':
        return '시급';
      case 'daily':
        return '일급';
      case 'weekly':
        return '주급';
      case 'monthly':
        return '월급';
      default:
        return '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'urgent':
        return {
          label: '급구',
          className: 'bg-red-100 text-red-700 border-red-200',
        };
      case 'completed':
        return {
          label: '모집완료',
          className: 'bg-muted text-muted-foreground border-border',
        };
      default:
        return {
          label: '모집중',
          className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        };
    }
  };

  if (isLoading) {
    return (
      <div>
        <Hero title="공고 상세" description="공고 정보를 불러오는 중..." />
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div>
        <Hero title="공고 상세" description="공고를 찾을 수 없습니다" />
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-muted-foreground">존재하지 않는 공고입니다.</p>
          <Button onClick={() => router.push('/post')}>
            <ArrowLeft className="size-4 mr-2" />
            공고 목록으로
          </Button>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(post.status);
  const firstSlot = post.work_slots?.[0];
  const workDate = firstSlot?.date || post.work_date;
  const workTimeStart =
    firstSlot?.start_time || firstSlot?.start || post.work_time_start;
  const workTimeEnd =
    firstSlot?.end_time || firstSlot?.end || post.work_time_end;
  const workLocation = firstSlot?.location || post.location;
  const payAmount = firstSlot?.pay_amount || post.pay_amount;
  const payType = firstSlot?.pay_type || post.pay_type;

  return (
    <div>
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4 mr-2" />
          뒤로가기
        </Button>
        <div className="flex items-center gap-2">
          {roleHydrated && currentUserId && post.author_id === currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeletePost}
              className="hover:bg-destructive/10"
              title="공고 삭제"
            >
              <Trash2 className="size-5 text-destructive" />
            </Button>
          )}
          {isMember && roleHydrated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              className="hover:bg-red-50"
            >
              <Heart
                className={cn(
                  'size-5',
                  isFavorite
                    ? 'fill-red-500 text-red-500'
                    : 'text-muted-foreground hover:text-red-500'
                )}
              />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="size-5 text-muted-foreground" />
          </Button>
          {roleHydrated && currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setReportOpen(true)}
              disabled={hasReported}
              className={cn(
                'hover:bg-destructive/10',
                hasReported && 'opacity-50 cursor-not-allowed'
              )}
              title={hasReported ? '이미 신고한 게시물입니다' : '게시물 신고'}
            >
              <Flag
                className={cn(
                  'size-5',
                  hasReported
                    ? 'fill-destructive text-destructive'
                    : 'text-muted-foreground hover:text-destructive'
                )}
              />
            </Button>
          )}
        </div>
      </div>

      {/* 공고 헤더 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className={cn('text-sm', statusBadge.className)}
            >
              {statusBadge.label}
            </Badge>
            {post.keywords?.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
          <CardTitle className="text-2xl">{post.title}</CardTitle>
          {/* 작성자 정보 */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t">
            <button
              type="button"
              onClick={handleAuthorProfileClick}
              className={cn(
                'flex items-center gap-3 rounded-md px-1 py-1 -ml-1 transition-colors',
                'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              )}
              aria-label="작성자 프로필 보기"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={post.author_avatar} alt={post.author_name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {post.author_name?.charAt(0) || 'M'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-medium text-sm">
                  {post.author_name || post.manager_name}
                </p>
                {post.company_name && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="size-3" />
                    {post.company_name}
                  </p>
                )}
              </div>
            </button>
            <p className="ml-auto text-xs text-muted-foreground">
              작성일자:{' '}
              {post.created_at ? formatKstDateTime(post.created_at) : '-'}
            </p>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 상세 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 근무 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">근무 정보</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {workDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">근무일</p>
                    <p className="font-medium">
                      {post.work_slots && post.work_slots.length > 1
                        ? `${format(
                            parseISO(post.work_slots[0].date),
                            'yyyy.MM.dd'
                          )} 외 ${post.work_slots.length - 1}일`
                        : format(parseISO(workDate), 'yyyy년 MM월 dd일 (E)', {
                            locale: ko,
                          })}
                    </p>
                  </div>
                </div>
              )}
              {workTimeStart && workTimeEnd && (
                <div className="flex items-start gap-3">
                  <Clock className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">근무 시간</p>
                    <p className="font-medium">
                      {workTimeStart} - {workTimeEnd}
                    </p>
                  </div>
                </div>
              )}
              {workLocation && (
                <div className="flex items-start gap-3">
                  <MapPin className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">근무 장소</p>
                    <p className="font-medium">{workLocation}</p>
                  </div>
                </div>
              )}
              {payAmount && (
                <div className="flex items-start gap-3">
                  <CreditCard className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">급여</p>
                    <p className="font-medium text-primary">
                      {getPayTypeLabel(payType)}{' '}
                      {formatNumberWithComma(payAmount)}원
                      {firstSlot?.tax_withholding && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (3.3% 공제)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 여러 근무일이 있는 경우 */}
          {post.work_slots && post.work_slots.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">근무일 상세</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {post.work_slots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">
                        {format(parseISO(slot.date), 'MM.dd (E)', {
                          locale: ko,
                        })}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {slot.start_time || slot.start} -{' '}
                        {slot.end_time || slot.end}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {formatNumberWithComma(slot.pay_amount)}원
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 상세 설명 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">상세 설명</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {post.description}
              </div>
              {post.equipments && (
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
                    <BriefcaseBusiness className="size-4" />
                    준비물
                  </p>
                  <p className="text-sm text-muted-foreground ml-6">
                    {post.equipments}
                  </p>
                </div>
              )}
              {post.qualifications && (
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
                    <Check className="size-4" />
                    자격 요건
                  </p>
                  <p className="text-sm text-muted-foreground ml-6">
                    {post.qualifications}
                  </p>
                </div>
              )}
              {post.preferences && (
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
                    <FileText className="size-4" />
                    우대 사항
                  </p>
                  <p className="text-sm text-muted-foreground ml-6">
                    {post.preferences}
                  </p>
                </div>
              )}
              {post.notes && (
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
                    <FileText className="size-4" />
                    기타 사항
                  </p>
                  <p className="text-sm text-muted-foreground ml-6">
                    {post.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽: 지원 정보 */}
        <div className="space-y-6">
          {/* 모집 현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="size-5" />
                모집 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">지원자 수</span>
                <span className="font-semibold">
                  {post.currentApplicants || 0} / {post.recruit_count}명
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      ((post.currentApplicants || 0) / post.recruit_count) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* 담당자 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">담당자 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User2 className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">담당자</p>
                  <p className="font-medium">{post.manager_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {post.manager_contact_type === 'kakao' ? '카카오톡' : post.manager_contact_type === 'email' ? '이메일' : post.manager_contact_type === 'other' ? '연락처' : '전화번호'}
                  </p>
                  {post.manager_contact_type === 'email' ? (
                    <a
                      href={`mailto:${post.manager_phone}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {post.manager_phone}
                    </a>
                  ) : post.manager_contact_type === 'phone' || !post.manager_contact_type ? (
                    <a
                      href={`tel:${post.manager_phone}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {post.manager_phone}
                    </a>
                  ) : (
                    <p className="font-medium">{post.manager_phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 지원하기 버튼 */}
          {isMember && roleHydrated && post.status !== 'completed' && (
            <Button
              className="w-full"
              size="lg"
              onClick={() => setApplyOpen(true)}
              disabled={hasApplied}
            >
              {hasApplied ? '지원 완료' : '지원하기'}
            </Button>
          )}

          {post.status === 'completed' && (
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-muted-foreground font-medium">
                모집이 완료되었습니다
              </p>
            </div>
          )}

          {/* 비로그인 사용자에게만 로그인 유도 */}
          {!currentUserId && !isMember && roleHydrated && (
            <Button variant="default" className="w-full" asChild>
              <Link href="/auth">지원하려면 회원으로 로그인해주세요</Link>
            </Button>
          )}
        </div>
      </div>

      {/* 지원 모달 */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              {post.title}에 지원하기
            </DialogTitle>
          </DialogHeader>
          {currentUser ? (
            <div className="mt-2 space-y-4 text-sm">
              {/* 기본 정보 전달 안내 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{currentUser.name}</span>님의 기본 정보가 함께 전달됩니다.
                </p>
                <Link
                  href="/settings"
                  className="text-xs text-primary underline underline-offset-2 shrink-0 ml-2"
                  onClick={() => setApplyOpen(false)}
                >
                  정보 설정
                </Link>
              </div>

              <div className="space-y-2">
                <Label htmlFor="application-message" className="text-sm font-medium">
                  지원 메시지 (선택)
                </Label>
                <Textarea
                  id="application-message"
                  placeholder="매니저에게 전할 메시지를 작성해주세요..."
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  지원 동기, 경력 설명 등을 자유롭게 작성할 수 있습니다.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setApplyOpen(false);
                    setApplicationMessage('');
                  }}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleSubmitApplication}
                >
                  지원하기
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              지원하려면 먼저 로그인해주세요.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* 신고 모달 */}
      {post && (
        <ReportModal
          open={reportOpen}
          onOpenChange={setReportOpen}
          postId={post.post_id}
          postTitle={post.title}
          onReported={() => setHasReported(true)}
        />
      )}

      {/* 프로필 모달 */}
      {profileModalUser && (
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={profileModalUser}
          currentUserId={currentUserId ?? undefined}
        />
      )}

      {/* 로그인 유도 모달 */}
      <Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">로그인이 필요합니다</DialogTitle>
            <DialogDescription className="text-sm">
              작성자 프로필을 보려면 로그인해주세요.
            </DialogDescription>
          </DialogHeader>
          {!currentUserId && (
            <div className="flex justify-center gap-2 pt-2">
              <Button type="button" onClick={() => router.push('/auth')}>
                로그인하기
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
