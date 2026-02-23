'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/ui/button';
import {
  BriefcaseBusiness,
  Calendar,
  Check,
  Clock,
  CreditCard,
  FileText,
  Link as LinkIcon,
  MapPin,
  Phone,
  Users,
  Heart,
  User2,
} from 'lucide-react';
import { Separator } from './Separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { User } from '@/types/mockData';
import { useUserStore } from '@/store/useUserStore';
import { toast } from 'sonner';
import {
  addFavoriteAction,
  removeFavoriteAction,
  checkFavoriteAction,
} from '@/app/(features)/(protected)/worker/favorit/actions';
import {
  applyToPostAction,
  checkAppliedToPostAction,
} from '@/app/(features)/(protected)/worker/schedule/actions';

export interface JobItem {
  id: number | string;
  title: string;
  content?: string;
  date?: string;
  workSlotCount?: number;
  time?: string;
  need?: string;
  place?: string;
  pay?: string;
  TO?: string;
  manager?: string;
  managerPhone?: string;
  etc?: string;
  externalLink?: string | null;
  applied?: boolean;
  categories: string[];
  qualifications?: string[];
  status: '급구' | '모집' | '모집완료';
  createdAt?: string; // 정렬용
}

interface JobCardProps {
  item: JobItem;
}

export function JobCard({ item }: JobCardProps) {
  const router = useRouter();
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const isMember = role === 'member';

  const [isFavorite, setIsFavorite] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState<boolean>(!!item.applied);
  const [isCheckingApplied, setIsCheckingApplied] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');

  useEffect(() => {
    // 현재 사용자 ID 가져오기
    const fetchCurrentUser = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          setCurrentUserId(data.user.id);

          // Supabase에서 프로필 가져오기
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

          if (profile) {
            // Supabase 프로필을 User 타입으로 변환
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

  useEffect(() => {
    // 부모에서 applied를 넘겨주면 그 값을 우선 사용
    if (typeof item.applied === 'boolean') {
      setIsApplied(item.applied);
    }
  }, [item.applied]);

  useEffect(() => {
    // 스탭 + 로그인 상태일 때, 해당 공고 지원 여부 확인 (카드에서 버튼 비활성화 목적)
    const run = async () => {
      if (!roleHydrated || !isMember) return;
      if (!currentUserId) return;
      if (typeof item.applied === 'boolean') return; // 이미 상위에서 주입됨
      if (item.status === '모집완료') return;

      const postId =
        typeof item.id === 'string' ? parseInt(item.id, 10) : item.id;
      if (!postId || Number.isNaN(postId)) return;

      setIsCheckingApplied(true);
      try {
        const result = await checkAppliedToPostAction(postId);
        if (result.ok) {
          setIsApplied(!!result.data?.applied);
        }
      } catch (error) {
        console.error('Failed to check applied status:', error);
      } finally {
        setIsCheckingApplied(false);
      }
    };

    run();
  }, [
    roleHydrated,
    isMember,
    currentUserId,
    item.id,
    item.applied,
    item.status,
  ]);

  useEffect(() => {
    // 관심 목록 확인 (Supabase에서)
    if (currentUserId && roleHydrated && isMember) {
      const checkFavorite = async () => {
        try {
          const result = await checkFavoriteAction(item.id.toString());
          if (result.ok) {
            setIsFavorite(result.data || false);
          }
        } catch (error) {
          console.error('Failed to check favorite:', error);
        }
      };
      checkFavorite();
    }
  }, [currentUserId, item.id, roleHydrated, isMember]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isMember || !currentUserId || !roleHydrated) return;

    try {
      if (isFavorite) {
        // 관심목록에서 제거
        const result = await removeFavoriteAction(item.id.toString());
        if (result.ok) {
          setIsFavorite(false);
          // 관심 목록 업데이트 이벤트 발생
          window.dispatchEvent(new Event('favorites-updated'));
        } else {
          toast.error(result.message || '관심목록 제거에 실패했습니다.');
        }
      } else {
        // 관심목록에 추가
        const result = await addFavoriteAction(item.id.toString());
        if (result.ok) {
          setIsFavorite(true);
          // 관심 목록 업데이트 이벤트 발생
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
  const statusClassName =
    item.status === '급구'
      ? 'border-red-300/70 bg-red-50'
      : item.status === '모집완료'
      ? 'bg-muted'
      : '';

  const enabledHoverClasses =
    item.status !== '모집완료'
      ? 'transition shadow-sm hover:shadow-md hover:-translate-y-0.5'
      : '';

  const statusBadgeClassName =
    item.status === '급구'
      ? 'bg-red-100 text-red-700 border-red-200'
      : item.status === '모집완료'
      ? 'bg-muted text-muted-foreground border-border'
      : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  const formatNumberWithComma = (value: string | undefined) => {
    if (!value) return undefined;
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return value;
    return numeric.toLocaleString('ko-KR');
  };

  const handleCardClick = () => {
    router.push(`/post/${item.id}`);
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.status === '모집완료') return;
    if (isApplied) return;
    setApplyOpen(true);
  };

  const externalLinkHref = (() => {
    const raw = item.externalLink?.trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
  })();

  const dateLabel = (() => {
    const base = item.date;
    if (!base) return base;
    const count = item.workSlotCount;
    if (typeof count === 'number' && count > 1) {
      return `${base} 외 ${count - 1}일`;
    }
    return base;
  })();

  const handleSubmitApplication = async () => {
    if (!currentUser) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      // post_id가 string일 수 있으므로 number로 변환
      const postId = typeof item.id === 'string' ? parseInt(item.id) : item.id;

      if (isNaN(postId)) {
        toast.error('올바른 공고 ID가 아닙니다.');
        return;
      }

      const result = await applyToPostAction(postId, applicationMessage.trim() || undefined);

      if (result.ok) {
        toast.success(result.message || '지원이 완료되었습니다.');
        setIsApplied(true);
        setApplyOpen(false);
        setApplicationMessage(''); // 메시지 초기화
      } else {
        // 이미 지원한 경우, 버튼 비활성화로 UI도 동기화
        if (result.message?.includes('이미 지원한 공고입니다')) {
          setIsApplied(true);
          setApplyOpen(false);
        }
        toast.error(result.message || '지원에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to apply:', error);
      toast.error('지원 중 오류가 발생했습니다.');
    }
  };

  return (
    <Card
      className={`${cn(
        statusClassName,
        enabledHoverClasses,
        'cursor-pointer'
      )} relative overflow-hidden flex flex-col gap-2 rounded-xl border`}
      onClick={handleCardClick}
    >
      {item.status === '모집완료' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-muted/10 backdrop-blur-sm"
        >
          <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-widest text-muted-foreground opacity-80">
            모집 완료
          </span>
        </div>
      )}

      {/* 관심 목록 버튼 (member 역할만) */}
      {isMember && roleHydrated && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4 z-10 hover:bg-white/80"
          onClick={toggleFavorite}
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

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'shrink-0 inline-flex items-center border px-2.5 py-0.5 text-xs font-medium sm:text-sm',
              statusBadgeClassName
            )}
          >
            {item.status}
          </span>
          <div className="mt-1 flex w-full items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {item.categories.map((c) => (
                <span
                  key={c}
                  className="text-xs sm:text-sm text-foreground border border-border rounded-full px-2.5 py-0.5 bg-muted"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 mt-2">
            <CardTitle className="text-lg sm:text-xl font-semibold leading-snug truncate">
              {item.title}
            </CardTitle>
            {item.content && (
              <CardDescription className="mt-1 line-clamp-2">
                {item.content}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 grid grid-cols-2 md:grid-cols-4 gap-2">
        {dateLabel && (
          <p className="flex items-center gap-2 text-sm text-foreground">
            <Calendar className="size-4" />
            <span>{dateLabel}</span>
          </p>
        )}
        {item.time && (
          <p className="flex items-center gap-2 text-sm text-foreground">
            <Clock className="size-4" />
            <span>{item.time}</span>
          </p>
        )}
        {item.place && (
          <p className="flex items-center gap-2 text-sm text-foreground">
            <MapPin className="size-4" />
            <span>{item.place}</span>
          </p>
        )}

        {item.need && (
          <p className="flex items-center gap-2 text-sm text-foreground">
            <BriefcaseBusiness className="size-4" />
            <span>{item.need}</span>
          </p>
        )}

        {item.manager && (
          <p className="flex items-center gap-2 text-sm text-foreground">
            <User2 className="size-4" />
            <span className="text-muted-foreground">담당자:</span>{' '}
            {item.manager}
          </p>
        )}
        {item.managerPhone && (
          <p className="flex items-center gap-2 text-sm text-foreground">
            <Phone className="size-4" />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(item.managerPhone!)}
              className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              aria-label="전화번호 복사"
              title="전화번호 복사"
            >
              <span>{item.managerPhone}</span>
            </button>
          </p>
        )}
        {item.pay && (
          <p className="flex items-center gap-2 text-sm text-foreground">
            <CreditCard className="size-4" />
            <span>{formatNumberWithComma(item.pay)}원</span>
          </p>
        )}
        {externalLinkHref && (
          <p className="col-span-2 md:col-span-4 flex items-center gap-2 text-sm text-foreground">
            <LinkIcon className="size-4 shrink-0" />
            <a
              href={externalLinkHref}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 truncate text-blue-600 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
              }}
              title={item.externalLink ?? undefined}
            >
              {item.externalLink}
            </a>
          </p>
        )}
      </CardContent>

      <div className="flex flex-col gap-2 px-6 py-2">
        {item.qualifications && item.qualifications.length > 0 && (
          <p className="flex items-center gap-2 text-sm text-foreground">
            <Check className="size-4" />
            <span>{item.qualifications.join(', ')}</span>
          </p>
        )}
        {item.etc && (
          <p className="flex items-center gap-2 text-sm text-foreground">
            <FileText className="size-4" />
            <span>{item.etc}</span>
          </p>
        )}
      </div>
      <div className="px-6">
        <Separator />
      </div>
      <CardFooter className="flex justify-between pt-0">
        <div className="flex items-center gap-2">
          <Users className="size-4" />
          <span>{item.TO || '0/0명 지원'}</span>
        </div>
        {isMember && roleHydrated && (
          <Button
            type="button"
            variant={isApplied ? 'secondary' : 'default'}
            size="sm"
            disabled={
              item.status === '모집완료' || isApplied || isCheckingApplied
            }
            aria-label="지원하기"
            title={
              item.status === '모집완료'
                ? '모집이 완료되어 지원할 수 없습니다'
                : isApplied
                ? '이미 지원한 공고입니다'
                : isCheckingApplied
                ? '지원 여부 확인 중...'
                : '지원하기'
            }
            className={cn(isApplied && 'text-muted-foreground')}
            onClick={handleApplyClick}
          >
            {isApplied
              ? '지원완료'
              : isCheckingApplied
              ? '확인 중...'
              : '지원하기'}
          </Button>
        )}
      </CardFooter>

      {/* 지원 정보 선택 모달 */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="text-base">
              {item.title}에 지원하기
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

              {/* 지원 메시지 입력 */}
              <div className="space-y-2">
                <Label
                  htmlFor="application-message"
                  className="text-sm font-medium"
                >
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
    </Card>
  );
}

export default JobCard;
