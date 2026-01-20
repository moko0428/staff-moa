'use client';

import { useState, useEffect } from 'react';
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
import { Switch } from '@/app/components/ui/switch';
import { User } from '@/types/mockData';
import { useUserStore } from '@/store/useUserStore';
import {
  addFavoriteAction,
  removeFavoriteAction,
  checkFavoriteAction,
} from '@/app/(features)/(protected)/worker/favorit/actions';
import { applyToPostAction } from '@/app/(features)/(protected)/worker/schedule/actions';

export interface JobItem {
  id: number | string;
  title: string;
  content?: string;
  date?: string;
  time?: string;
  need?: string;
  place?: string;
  pay?: string;
  TO?: string;
  manager?: string;
  managerPhone?: string;
  etc?: string;
  categories: string[];
  qualifications?: string[];
  status: '급구' | '모집' | '모집완료';
  createdAt?: string; // 정렬용
}

interface JobCardProps {
  item: JobItem;
}

export function JobCard({ item }: JobCardProps) {
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const isMember = role === 'member';
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>(
    {
      personal: true, // 이름/전화/카톡/성별/MBTI
      experiences: true,
      documents: true,
      certificates: true,
      languages: true,
    }
  );

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
              gender: (profile.gender === '남성' || profile.gender === '여성') 
                ? profile.gender 
                : undefined,
              mbti: profile.mbti || undefined,
              personality: profile.personality || undefined,
              experiences: profile.experiences as User['experiences'] || [],
              documents: profile.documents as User['documents'] || undefined,
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
          alert(result.message || '관심목록 제거에 실패했습니다.');
        }
      } else {
        // 관심목록에 추가
        const result = await addFavoriteAction(item.id.toString());
        if (result.ok) {
          setIsFavorite(true);
          // 관심 목록 업데이트 이벤트 발생
          window.dispatchEvent(new Event('favorites-updated'));
        } else {
          alert(result.message || '관심목록 추가에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      alert('관심목록 변경 중 오류가 발생했습니다.');
    }
  };
  const statusClassName =
    item.status === '급구'
      ? 'border-red-300/70 bg-red-50'
      : item.status === '모집완료'
      ? 'bg-gray-200'
      : '';

  const enabledHoverClasses =
    item.status !== '모집완료'
      ? 'transition shadow-sm hover:shadow-md hover:-translate-y-0.5'
      : '';

  const statusBadgeClassName =
    item.status === '급구'
      ? 'bg-red-100 text-red-700 border-red-200'
      : item.status === '모집완료'
      ? 'bg-gray-100 text-gray-600 border-gray-200'
      : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  const formatNumberWithComma = (value: string | undefined) => {
    if (!value) return undefined;
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return value;
    return numeric.toLocaleString('ko-KR');
  };

  const handleToggleField = (key: string) => {
    setSelectedFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.status === '모집완료') return;
    setApplyOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 선택한 정보를 메시지로 구성
    const selectedInfo: string[] = [];
    if (selectedFields.personal) {
      selectedInfo.push('개인정보');
    }
    if (selectedFields.experiences && currentUser.experiences?.length) {
      selectedInfo.push(`경력(${currentUser.experiences.length}개)`);
    }
    if (selectedFields.documents && currentUser.documents) {
      selectedInfo.push('서류');
    }
    if (selectedFields.certificates && currentUser.documents?.certificates?.length) {
      selectedInfo.push(`자격증(${currentUser.documents.certificates.length}개)`);
    }
    if (selectedFields.languages && currentUser.documents?.language?.length) {
      selectedInfo.push(`어학(${currentUser.documents.language.length}개)`);
    }

    const message = selectedInfo.length > 0
      ? `전달 정보: ${selectedInfo.join(', ')}`
      : undefined;

    try {
      // post_id가 string일 수 있으므로 number로 변환
      const postId = typeof item.id === 'string' ? parseInt(item.id) : item.id;

      if (isNaN(postId)) {
        alert('올바른 공고 ID가 아닙니다.');
        return;
      }

      const result = await applyToPostAction(postId, message);

      if (result.ok) {
        alert(result.message);
        setApplyOpen(false);
      } else {
        alert(result.message || '지원에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to apply:', error);
      alert('지원 중 오류가 발생했습니다.');
    }
  };

  return (
    <Card
      aria-disabled={item.status === '모집완료'}
      className={`${cn(
        statusClassName,
        enabledHoverClasses,
        item.status === '모집완료' && 'pointer-events-none'
      )} relative overflow-hidden flex flex-col gap-2 rounded-xl border`}
    >
      {item.status === '모집완료' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-200/10 backdrop-blur-sm"
        >
          <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-widest text-gray-500 opacity-80">
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
                : 'text-gray-400 hover:text-red-500'
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
                  className="text-xs sm:text-sm text-gray-700 border border-gray-300 rounded-full px-2.5 py-0.5 bg-gray-100"
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
        {item.date && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="size-4" />
            <span>{item.date}</span>
          </p>
        )}
        {item.time && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="size-4" />
            <span>{item.time}</span>
          </p>
        )}
        {item.place && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="size-4" />
            <span>{item.place}</span>
          </p>
        )}

        {item.need && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <BriefcaseBusiness className="size-4" />
            <span>{item.need}</span>
          </p>
        )}

        {item.manager && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <User2 className="size-4" />
            <span className="text-gray-500">담당자:</span> {item.manager}
          </p>
        )}
        {item.managerPhone && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
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
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <CreditCard className="size-4" />
            <span>{formatNumberWithComma(item.pay)}원</span>
          </p>
        )}
      </CardContent>

      <div className="flex flex-col gap-2 px-6 py-2">
        {item.qualifications && item.qualifications.length > 0 && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="size-4" />
            <span>{item.qualifications.join(', ')}</span>
          </p>
        )}
        {item.etc && (
          <p className="flex items-center gap-2 text-sm text-gray-700">
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
          <span>0/10명 지원</span>
        </div>
        {isMember && roleHydrated && (
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={item.status === '모집완료'}
            aria-label="지원하기"
            title={
              item.status === '모집완료'
                ? '모집이 완료되어 지원할 수 없습니다'
                : '지원하기'
            }
            onClick={handleApplyClick}
          >
            지원하기
          </Button>
        )}
      </CardFooter>

      {/* 지원 정보 선택 모달 */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              {item.title}에 지원하기
            </DialogTitle>
          </DialogHeader>
          {currentUser ? (
            <div className="mt-2 space-y-4 text-sm">
              <p className="text-xs text-gray-500">
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
                {currentUser.experiences &&
                  currentUser.experiences.length > 0 && (
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
                        <ul className="text-xs text-gray-500 space-y-0.5">
                          {currentUser.documents.idCard && <li>신분증</li>}
                          {currentUser.documents.bankbook && <li>통장사본</li>}
                          {currentUser.documents.healthCertificate && (
                            <li>보건증</li>
                          )}
                        </ul>
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
                        <p className="text-xs text-gray-500">
                          {currentUser.documents.certificates.join(', ')}
                        </p>
                      </div>
                      <Switch
                        checked={selectedFields.certificates}
                        onCheckedChange={() =>
                          handleToggleField('certificates')
                        }
                      />
                    </div>
                  )}
                {currentUser.documents?.language &&
                  currentUser.documents.language.length > 0 && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">어학 능력</p>
                        <p className="text-xs text-gray-500">
                          {currentUser.documents.language.join(', ')}
                        </p>
                      </div>
                      <Switch
                        checked={selectedFields.languages}
                        onCheckedChange={() => handleToggleField('languages')}
                      />
                    </div>
                  )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setApplyOpen(false)}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleSubmitApplication}
                >
                  선택한 정보로 지원하기
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              지원하려면 먼저 로그인해주세요.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default JobCard;
