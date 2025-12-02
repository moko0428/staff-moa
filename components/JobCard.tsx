'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import { mockFavorites, mockUsers } from '@/lib/mockData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { User } from '@/types/mockData';

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
}

interface JobCardProps {
  item: JobItem;
}

export function JobCard({ item }: JobCardProps) {
  const [isWorker, setIsWorker] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>(
    {
      name: true,
      phone: true,
      kakaoId: true,
      gender: true,
    }
  );

  useEffect(() => {
    // 사용자 역할 확인
    try {
      if (typeof window !== 'undefined') {
        const userRole = localStorage.getItem('userRole');
        const userId = localStorage.getItem('userId');
        setIsWorker(userRole === 'member');

        if (userId) {
          const user = mockUsers.find((u) => u.id === userId) || null;
          setCurrentUser(user);
        }

        // 관심 목록 확인
        if (userId) {
          // localStorage에서 확인
          let saved = localStorage.getItem(`favorites_${userId}`);

          // localStorage에 없으면 mockFavorites에서 초기화
          if (!saved) {
            const userFavorite = mockFavorites.find(
              (fav) => fav.userId === userId
            );
            if (userFavorite) {
              localStorage.setItem(
                `favorites_${userId}`,
                JSON.stringify(userFavorite.postIds)
              );
              saved = JSON.stringify(userFavorite.postIds);
            }
          }

          if (saved) {
            const favorites = JSON.parse(saved);
            setIsFavorite(favorites.includes(item.id.toString()));
          }
        }
      }
    } catch (error) {
      console.error('Failed to check user role or favorites:', error);
    }
  }, [item.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const saved = localStorage.getItem(`favorites_${userId}`);
      const favorites: string[] = saved ? JSON.parse(saved) : [];
      const itemId = item.id.toString();

      const newFavorites = favorites.includes(itemId)
        ? favorites.filter((id) => id !== itemId)
        : [...favorites, itemId];

      localStorage.setItem(`favorites_${userId}`, JSON.stringify(newFavorites));
      setIsFavorite(!isFavorite);

      // 관심 목록 업데이트 이벤트 발생
      window.dispatchEvent(new Event('favorites-updated'));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
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

  const handleSubmitApplication = () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    const payload: Record<string, unknown> = {};
    if (selectedFields.name) payload.name = currentUser.name;
    if (selectedFields.phone && currentUser.phone)
      payload.phone = currentUser.phone;
    if (selectedFields.kakaoId && currentUser.kakaoId)
      payload.kakaoId = currentUser.kakaoId;
    if (selectedFields.gender && currentUser.gender)
      payload.gender = currentUser.gender;

    console.log('지원 정보 전송:', {
      postId: item.id,
      applicantId: currentUser.id,
      payload,
    });
    alert(
      '선택한 정보로 지원 요청이 전송되었다고 가정합니다. (콘솔 확인 가능)'
    );
    setApplyOpen(false);
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

      {/* 관심 목록 버튼 (일반 회원만) */}
      {isWorker && (
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
        {isWorker && (
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
              {item.title} 공고에 지원하기
            </DialogTitle>
          </DialogHeader>
          {currentUser ? (
            <div className="mt-2 space-y-4 text-sm">
              <p className="text-xs text-gray-500">
                아래 항목 중 지원 시 전달할 정보를 선택해주세요.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">이름</p>
                    <p className="text-xs text-gray-500">{currentUser.name}</p>
                  </div>
                  <Switch
                    checked={selectedFields.name}
                    onCheckedChange={() => handleToggleField('name')}
                  />
                </div>
                {currentUser.phone && (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">전화번호</p>
                      <p className="text-xs text-gray-500">
                        {currentUser.phone}
                      </p>
                    </div>
                    <Switch
                      checked={selectedFields.phone}
                      onCheckedChange={() => handleToggleField('phone')}
                    />
                  </div>
                )}
                {currentUser.kakaoId && (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">카카오톡 아이디</p>
                      <p className="text-xs text-gray-500">
                        {currentUser.kakaoId}
                      </p>
                    </div>
                    <Switch
                      checked={selectedFields.kakaoId}
                      onCheckedChange={() => handleToggleField('kakaoId')}
                    />
                  </div>
                )}
                {currentUser.gender && (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">성별</p>
                      <p className="text-xs text-gray-500">
                        {currentUser.gender}
                      </p>
                    </div>
                    <Switch
                      checked={selectedFields.gender}
                      onCheckedChange={() => handleToggleField('gender')}
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
