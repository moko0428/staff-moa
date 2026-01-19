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
};

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
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
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
    if (!confirm('정말 이 공고를 삭제하시겠습니까?')) return;
    const result = await deletePostAction(postId);
    if (result.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } else {
      alert(result.message);
    }
  };

  const handleStatusToggle = async (
    postId: string,
    newStatus: PostRow['status']
  ) => {
    // 낙관적 업데이트를 위해 이전 상태 저장
    const prevPosts = posts;
    const prevStatus = posts.find((p) => p.id === postId)?.status;

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p))
    );

    const result = await updatePostStatusAction(postId, newStatus);

    if (!result.ok) {
      alert(result.message || '공고 상태 변경에 실패했습니다.');
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
          <CardContent className="py-6 text-sm text-gray-600">
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
          <CardContent className="py-6 text-sm text-gray-600">
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
          <p className="text-sm text-gray-600 mb-2">전체 공고</p>
          <p className="text-2xl text-gray-900">{myPosts.length}개</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">모집중</p>
          <p className="text-2xl text-green-600">
            {
              myPosts.filter(
                (p) => p.status === 'recruiting' || p.status === 'urgent'
              ).length
            }
            개
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">완료</p>
          <p className="text-2xl text-gray-600">
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
            'px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors',
            showFilters
              ? 'bg-primary/10 border-primary text-primary'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          <FilterIcon className="size-5" />
          필터
        </Button>
        <Button variant="default" size="sm" asChild>
          <Link href="/my-post/create">
            <Plus className="size-4" />
            <span className="text-sm font-medium">새 공고 작성</span>
          </Link>
        </Button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">정렬:</span>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="공고 제목 또는 내용으로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="size-6 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">공고를 불러오는 중...</p>
          </CardContent>
        </Card>
      ) : myPosts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500 mb-4">작성한 공고가 없습니다.</p>
          <Button
            asChild
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            <Link href="/my-post/create">첫 공고 작성하기</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
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
                location: (post.work_slots?.[0]?.location as string) || (post.location as string) || '',
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
                currentApplicants: 0,
                notes: (post.notes as string) || undefined,
                requirements: (post.qualifications as string) || undefined,
                preferences: (post.preferences as string) || undefined,
                createdAt: post.created_at as string,
                updatedAt: post.created_at as string,
              }}
              onEdit={(editedPost) => {
                router.push(`/my-post/edit/${editedPost.id}`);
              }}
              onDelete={handleDelete}
              onStatusToggle={handleStatusToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
