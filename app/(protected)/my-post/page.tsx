'use client';

import MyPostCard from '@/app/components/MyPostCard';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { FilterIcon, Loader2, Plus } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useMyPosts } from './hooks/useMyPosts';
import { PostStatsGrid } from './components/molecules/PostStatsGrid';
import { PostFilterPanel } from './components/organisms/PostFilterPanel';
import { inferWorkType } from './utils/postHelpers';

export default function MyPostPage() {
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const effectiveRole = role ?? null;
  const isManager = effectiveRole === 'manager';
  const isPendingManager = effectiveRole === 'pending_manager';

  const {
    loading,
    showFilters,
    setShowFilters,
    sortOrder,
    setSortOrder,
    searchTerm,
    setSearchTerm,
    myPosts,
    handleDelete,
    handleStatusToggle,
    router,
  } = useMyPosts(isManager);

  if (!roleHydrated) {
    return (
      <div className="space-y-4">
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
      <PostStatsGrid
        total={myPosts.length}
        recruiting={
          myPosts.filter(
            (p) => p.status === 'recruiting' || p.status === 'urgent',
          ).length
        }
        completed={myPosts.filter((p) => p.status === 'completed').length}
      />

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
        <div className={cn('lg:col-span-3', !showFilters && 'hidden lg:block')}>
          <PostFilterPanel
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>

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
              <p className="text-muted-foreground mb-4">
                작성한 공고가 없습니다.
              </p>
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
