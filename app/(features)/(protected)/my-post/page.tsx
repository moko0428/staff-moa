'use client';

import Hero from '@/app/components/Hero';
import MyPostCard from '@/app/components/MyPostCard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent } from '@/app/components/ui/card';
import { FilterIcon, Search, Loader2, Plus } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  getMyPostsAction,
  deletePostAction,
  updatePostStatusAction,
} from './actions';

type PostRow = {
  id: string;
  author_id: string;
  title: string;
  description: string;
  location?: string;
  work_slots: Array<{
    date: string;
    start: string;
    end: string;
    work_type?: 'single' | 'range' | 'multi';
    location?: string;
    pay_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
    pay_amount: number;
    tax_withholding: boolean;
  }>;
  recruit_count: number;
  manager_name: string;
  manager_phone: string;
  equipments?: string | null;
  qualifications?: string | null;
  preferences?: string | null;
  notes?: string | null;
  external_link?: string | null;
  keywords?: string[];
  status: 'recruiting' | 'completed' | 'urgent';
  form_type?: 'basic' | 'free';
  created_at: string;
  applicant_stats?: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
};

function inferWorkType(
  slots: Array<{ date: string; work_type?: 'single' | 'range' | 'multi' }>,
): 'single' | 'range' | 'multi' {
  if (!slots || slots.length <= 1) return 'single';

  const explicit = slots.find((s) => s.work_type)?.work_type;
  if (explicit) return explicit;

  const dates = slots
    .map((s) => s.date)
    .filter(Boolean)
    .map((d) => new Date(`${d}T00:00:00`))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length <= 1) return 'single';

  let isContinuous = true;
  for (let i = 1; i < dates.length; i += 1) {
    const diffDays =
      (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays !== 1) {
      isContinuous = false;
      break;
    }
  }
  return isContinuous ? 'range' : 'multi';
}

export default function MyPostPage() {
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const effectiveRole = role ?? null;
  const isManager = effectiveRole === 'manager';
  const isPendingManager = effectiveRole === 'pending_manager';

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyPostsAction();
      if (result.ok && result.data) {
        setPosts(result.data as PostRow[]);
      } else {
        console.error('Failed to fetch posts:', result.message);
        setPosts([]);
      }
    } catch (err) {
      console.error('Unexpected error fetching posts', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isManager) {
      fetchPosts();
    }
  }, [isManager, fetchPosts]);

  // 페이지 포커스 시 공고 목록 새로고침 (수정 후 돌아왔을 때 최신 데이터 표시)
  useEffect(() => {
    const handleFocus = () => {
      if (isManager) {
        fetchPosts();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isManager, fetchPosts]);

  const myPosts = useMemo(() => {
    let filtered = [...posts];

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [posts, searchTerm, sortOrder]);

  const handleDelete = async (postId: string) => {
    const result = await deletePostAction(postId);
    if (result.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('삭제되었습니다.');
    } else {
      toast.error(result.message);
    }
  };

  const handleStatusToggle = async (
    postId: string,
    newStatus: PostRow['status'],
  ) => {
    // 낙관적 업데이트를 위해 이전 상태 저장
    const prevPosts = posts;
    const prevStatus = posts.find((p) => p.id === postId)?.status;

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p)),
    );

    const result = await updatePostStatusAction(postId, newStatus);

    if (!result.ok) {
      toast.error(result.message || '공고 상태 변경에 실패했습니다.');
      // 실패 시 이전 상태로 롤백
      if (prevStatus) {
        setPosts(prevPosts);
      }
      return;
    }

    // 서버와 상태를 한 번 더 동기화
    fetchPosts();
  };

  if (!roleHydrated) {
    return (
      <div className="space-y-4">
        <Hero title="내 공고 관리" description="매니저 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            역할 정보를 불러오는 중입니다...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="space-y-4">
        <Hero title="내 공고 관리" description="매니저 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {isPendingManager
              ? '관리자 승인 후에 접근할 수 있습니다. 프로필을 완성하고 재요청을 진행해주세요.'
              : '관리자 승인이 필요한 매니저 전용 페이지입니다.'}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Hero title="내 공고 관리" description="작성한 구인공고를 관리하세요" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-muted-foreground mb-2">전체 공고</p>
          <p className="text-2xl text-foreground">{myPosts.length}개</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-muted-foreground mb-2">모집중</p>
          <p className="text-2xl text-green-600">
            {
              myPosts.filter(
                (p) => p.status === 'recruiting' || p.status === 'urgent',
              ).length
            }
            개
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-muted-foreground mb-2">완료</p>
          <p className="text-2xl text-muted-foreground">
            {myPosts.filter((p) => p.status === 'completed').length}개
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end mb-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors lg:hidden',
            showFilters
              ? 'bg-primary/10 border-primary text-primary'
              : 'border-border text-foreground hover:bg-muted',
          )}
        >
          <FilterIcon className="size-5" />
        </Button>
        <Button variant="default" size="sm" asChild>
          <Link href="/my-post/create">
            <Plus className="size-4" />
            <span className="text-sm font-medium">새 공고 작성</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 좌측 필터 패널 (데스크톱 상시 / 모바일 토글) */}
        <div className={cn('lg:col-span-3', !showFilters && 'hidden lg:block')}>
          <Card className="bg-white lg:sticky lg:top-20">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">정렬:</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={sortOrder === 'newest' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortOrder('newest')}
                    >
                      최신순
                    </Button>
                    <Button
                      type="button"
                      variant={sortOrder === 'oldest' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortOrder('oldest')}
                    >
                      오래된 순
                    </Button>
                  </div>
                </div>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="공고 제목 또는 내용으로 검색..."
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 우측 공고 카드 섹션 */}
        <div className="lg:col-span-9">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="size-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  공고를 불러오는 중...
                </p>
              </CardContent>
            </Card>
          ) : myPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <p className="text-muted-foreground mb-4">작성한 공고가 없습니다.</p>
              <Button
                asChild
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
              >
                <Link href="/my-post/create">첫 공고 작성하기</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPosts.map((post) => (
                <MyPostCard
                  key={post.id}
                  post={{
                    id: post.id,
                    authorId: post.author_id as string,
                    authorName: post.manager_name as string,
                    status: post.status,
                    title: post.title,
                    description: post.description,
                    keywords: post.keywords || [],
                    date: post.work_slots?.[0]?.date || '',
                    location:
                      (post.work_slots?.[0]?.location as string) ||
                      (post.location as string) ||
                      '',
                    time: post.work_slots?.[0]
                      ? `${post.work_slots[0].start} - ${post.work_slots[0].end}`
                      : '',
                    salary: post.work_slots?.[0]?.pay_amount || 0,
                    paymentDate: '',
                    preparation: (post.equipments as string) || '',
                    managerInfo: {
                      name: post.manager_name as string,
                      phone: post.manager_phone as string,
                    },
                    recruitCount: post.recruit_count,
                    currentApplicants: post.applicant_stats?.total || 0,
                    applicantStats: post.applicant_stats,
                    notes: (post.notes as string) || undefined,
                    requirements: (post.qualifications as string) || undefined,
                    preferences: (post.preferences as string) || undefined,
                    workType: inferWorkType(post.work_slots || []),
                    workDatesCount: post.work_slots?.length || 1,
                    workSlots: (post.work_slots || []).map((slot) => ({
                      date: slot.date,
                      start: slot.start,
                      end: slot.end,
                      location: slot.location,
                    })),
                    createdAt: post.created_at as string,
                    updatedAt: post.created_at as string,
                  }}
                  onEdit={(editedPost) => {
                    router.push(`/my-post/edit/${editedPost.id}`);
                  }}
                  onDelete={handleDelete}
                  onStatusToggle={handleStatusToggle}
                  onRepost={(repostPost) => {
                    router.push(`/my-post/create?repost=${repostPost.id}`);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
