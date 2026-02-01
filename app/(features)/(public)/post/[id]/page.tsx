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
import { Switch } from '@/app/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
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
} from '@/app/(features)/(protected)/worker/favorit/actions';
import { applyToPostAction } from '@/app/(features)/(protected)/worker/schedule/actions';
import { User } from '@/types/mockData';

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
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({
    personal: true,
    experiences: true,
    documents: true,
    certificates: true,
    languages: true,
  });

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

  const handleToggleField = (key: string) => {
    setSelectedFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmitApplication = async () => {
    if (!currentUser || !post) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    let message = applicationMessage.trim();
    const selectedInfo: string[] = [];

    if (selectedFields.personal) selectedInfo.push('개인정보');
    if (selectedFields.experiences && currentUser.experiences?.length)
      selectedInfo.push(`경력(${currentUser.experiences.length}개)`);
    if (selectedFields.documents && currentUser.documents)
      selectedInfo.push('서류');
    if (selectedFields.certificates && currentUser.documents?.certificates?.length)
      selectedInfo.push(`자격증(${currentUser.documents.certificates.length}개)`);
    if (selectedFields.languages && currentUser.documents?.language?.length)
      selectedInfo.push(`어학(${currentUser.documents.language.length}개)`);

    if (selectedInfo.length > 0) {
      const infoText = `\n\n[전달 정보: ${selectedInfo.join(', ')}]`;
      message = message ? message + infoText : infoText.trim();
    }

    try {
      const result = await applyToPostAction(post.post_id, message || undefined);
      if (result.ok) {
        toast.success(result.message || '지원이 완료되었습니다.');
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
        return { label: '급구', className: 'bg-red-100 text-red-700 border-red-200' };
      case 'completed':
        return { label: '모집완료', className: 'bg-muted text-muted-foreground border-border' };
      default:
        return { label: '모집중', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
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
  const workTimeStart = firstSlot?.start_time || firstSlot?.start || post.work_time_start;
  const workTimeEnd = firstSlot?.end_time || firstSlot?.end || post.work_time_end;
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
        </div>
      </div>

      {/* 공고 헤더 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={cn('text-sm', statusBadge.className)}>
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
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author_avatar} alt={post.author_name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {post.author_name?.charAt(0) || 'M'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{post.author_name || post.manager_name}</p>
              {post.company_name && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="size-3" />
                  {post.company_name}
                </p>
              )}
            </div>
            <p className="ml-auto text-xs text-muted-foreground">
              {post.created_at && format(parseISO(post.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
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
                        ? `${format(parseISO(post.work_slots[0].date), 'yyyy.MM.dd')} 외 ${post.work_slots.length - 1}일`
                        : format(parseISO(workDate), 'yyyy년 MM월 dd일 (E)', { locale: ko })}
                    </p>
                  </div>
                </div>
              )}
              {workTimeStart && workTimeEnd && (
                <div className="flex items-start gap-3">
                  <Clock className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">근무 시간</p>
                    <p className="font-medium">{workTimeStart} - {workTimeEnd}</p>
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
                      {getPayTypeLabel(payType)} {formatNumberWithComma(payAmount)}원
                      {firstSlot?.tax_withholding && (
                        <span className="text-xs text-muted-foreground ml-1">(3.3% 공제)</span>
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
                        {format(parseISO(slot.date), 'MM.dd (E)', { locale: ko })}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {slot.start_time || slot.start} - {slot.end_time || slot.end}
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
                  <p className="text-sm text-muted-foreground ml-6">{post.equipments}</p>
                </div>
              )}
              {post.qualifications && (
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
                    <Check className="size-4" />
                    자격 요건
                  </p>
                  <p className="text-sm text-muted-foreground ml-6">{post.qualifications}</p>
                </div>
              )}
              {post.preferences && (
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
                    <FileText className="size-4" />
                    우대 사항
                  </p>
                  <p className="text-sm text-muted-foreground ml-6">{post.preferences}</p>
                </div>
              )}
              {post.notes && (
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
                    <FileText className="size-4" />
                    기타 사항
                  </p>
                  <p className="text-sm text-muted-foreground ml-6">{post.notes}</p>
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
                      ((post.currentApplicants || 0) / post.recruit_count) * 100,
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
                  <p className="text-sm text-muted-foreground">연락처</p>
                  <a
                    href={`tel:${post.manager_phone}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {post.manager_phone}
                  </a>
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
            >
              지원하기
            </Button>
          )}

          {post.status === 'completed' && (
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-muted-foreground font-medium">모집이 완료되었습니다</p>
            </div>
          )}

          {!isMember && roleHydrated && (
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-blue-600 text-sm">
                지원하려면 회원으로 로그인해주세요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 지원 모달 */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">{post.title}에 지원하기</DialogTitle>
          </DialogHeader>
          {currentUser ? (
            <div className="mt-2 space-y-4 text-sm">
              <p className="text-xs text-muted-foreground">
                아래 항목 중 지원 시 전달할 정보를 선택해주세요.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">개인정보</p>
                  </div>
                  <Switch
                    checked={selectedFields.personal}
                    onCheckedChange={() => handleToggleField('personal')}
                  />
                </div>
                {currentUser.experiences && currentUser.experiences.length > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-medium">경력</p>
                    </div>
                    <Switch
                      checked={selectedFields.experiences}
                      onCheckedChange={() => handleToggleField('experiences')}
                    />
                  </div>
                )}
                {currentUser.documents &&
                  Object.values(currentUser.documents).some(Boolean) && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">서류</p>
                      </div>
                      <Switch
                        checked={selectedFields.documents}
                        onCheckedChange={() => handleToggleField('documents')}
                      />
                    </div>
                  )}
                {currentUser.documents?.certificates &&
                  currentUser.documents.certificates.length > 0 && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">자격증</p>
                      </div>
                      <Switch
                        checked={selectedFields.certificates}
                        onCheckedChange={() => handleToggleField('certificates')}
                      />
                    </div>
                  )}
                {currentUser.documents?.language &&
                  currentUser.documents.language.length > 0 && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">어학 능력</p>
                      </div>
                      <Switch
                        checked={selectedFields.languages}
                        onCheckedChange={() => handleToggleField('languages')}
                      />
                    </div>
                  )}
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
    </div>
  );
}
