'use client';

import JobCard, { type JobItem } from '@/app/components/JobCard';
import PostingFilter, { type Filters } from '@/app/components/PostingFilter';
import { useMemo, useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import {
  getAllPostsAction,
  getAllProfilesAction,
  getManagerPostsAction,
} from './actions';
import { Post } from '@/types/mockData';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import Hero from '@/app/components/Hero';
import { Button } from '@/app/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

// Supabase posts 데이터를 Post 타입으로 변환
type SupabasePost = {
  post_id: number;
  title: string;
  description: string;
  work_date: string;
  work_time_start: string;
  work_time_end: string;
  location: string;
  pay_amount: number;
  pay_type: string;
  recruit_count: number;
  manager_name: string;
  manager_phone: string;
  equipments?: string | null;
  qualifications?: string | null;
  preferences?: string | null;
  notes?: string | null;
  keywords?: string[] | null;
  author_id: string;
  status: 'recruiting' | 'completed' | 'urgent';
  form_type?: string | null;
  created_at: string;
  updated_at: string;
  currentApplicants?: number;
  work_slots?: Array<{
    date: string;
    start_time: string;
    end_time: string;
    location?: string;
    pay_amount?: number;
  }> | null;
};

// Supabase Post를 Post 타입으로 변환
function supabasePostToPost(supabasePost: SupabasePost): Post & {
  work_slots?: Array<{
    date: string;
    start_time?: string;
    end_time?: string;
    start?: string;
    end?: string;
    location?: string;
    pay_amount?: number;
  }>;
  equipments?: string;
  manager_name?: string;
  manager_phone?: string;
  recruit_count?: number;
  created_at?: string;
  qualifications?: string;
} {
  const firstSlot = Array.isArray(supabasePost.work_slots)
    ? supabasePost.work_slots[0]
    : null;

  return {
    id: supabasePost.post_id.toString(),
    authorId: supabasePost.author_id,
    authorName: supabasePost.manager_name,
    status: supabasePost.status,
    title: supabasePost.title,
    keywords: supabasePost.keywords || [],
    date: firstSlot?.date || supabasePost.work_date || '',
    location: firstSlot?.location || supabasePost.location || '',
    time: firstSlot
      ? `${firstSlot.start_time} - ${firstSlot.end_time}`
      : `${supabasePost.work_time_start} - ${supabasePost.work_time_end}`,
    salary: firstSlot?.pay_amount || Number(supabasePost.pay_amount) || 0,
    paymentDate: '',
    preparation: supabasePost.equipments || '',
    description: supabasePost.description,
    managerInfo: {
      name: supabasePost.manager_name,
      phone: supabasePost.manager_phone,
    },
    recruitCount: supabasePost.recruit_count,
    currentApplicants: supabasePost.currentApplicants || 0,
    notes: supabasePost.notes || undefined,
    requirements: supabasePost.qualifications || undefined,
    preferences: supabasePost.preferences || undefined,
    createdAt: supabasePost.created_at,
    updatedAt: supabasePost.updated_at,
    // 추가 필드
    work_slots: supabasePost.work_slots?.map(slot => ({
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      start: slot.start_time, // 호환성을 위해 추가
      end: slot.end_time, // 호환성을 위해 추가
      location: slot.location,
      pay_amount: slot.pay_amount,
    })) || undefined,
    equipments: supabasePost.equipments || undefined,
    manager_name: supabasePost.manager_name,
    manager_phone: supabasePost.manager_phone,
    recruit_count: supabasePost.recruit_count,
    created_at: supabasePost.created_at,
    qualifications: supabasePost.qualifications || undefined,
  };
}

// Post를 JobItem으로 변환하는 함수
function postToJobItem(post: Post & {
  work_slots?: Array<{
    date: string;
    start_time?: string;
    end_time?: string;
    start?: string;
    end?: string;
    location?: string;
    pay_amount?: number;
  }>;
  equipments?: string;
  manager_name?: string;
  manager_phone?: string;
  recruit_count?: number;
  created_at?: string;
  qualifications?: string;
}): JobItem {
  const statusMap: Record<Post['status'], JobItem['status']> = {
    urgent: '급구',
    recruiting: '모집',
    completed: '모집완료',
  };

  // work_slots에서 첫 번째 슬롯 정보 가져오기 (새로운 구조)
  const firstSlot = post.work_slots?.[0];
  const date = firstSlot?.date || post.date || '';
  const time = firstSlot
    ? `${firstSlot.start_time || firstSlot.start || ''} - ${firstSlot.end_time || firstSlot.end || ''}`
    : post.time || '';
  const place = firstSlot?.location || post.location || '';
  const pay = firstSlot?.pay_amount || post.salary || 0;
  const need = post.equipments || post.preparation || '';
  const managerName = post.manager_name || post.managerInfo?.name || '';
  const managerPhone = post.manager_phone || post.managerInfo?.phone || '';
  const recruitCount = post.recruit_count || post.recruitCount || 0;
  const currentApplicants = post.currentApplicants || 0;
  const createdAt = post.created_at || post.createdAt || '';

  return {
    id: post.id,
    title: post.title,
    content: post.description,
    date: date,
    time: time,
    need: need,
    place: place,
    pay: pay.toString(),
    TO: `${recruitCount - currentApplicants}명`,
    manager: managerName,
    managerPhone: managerPhone,
    etc: post.notes || '',
    categories: post.keywords || [],
    qualifications: post.qualifications ? [post.qualifications] : [],
    status: statusMap[post.status],
    createdAt: createdAt,
  };
}

export default function PostPage() {
  const [hash, setHash] = useState('');
  const [filters, setFilters] = useState<Filters>({
    status: '',
    payMin: '',
    payMax: '',
    dateRange: undefined,
    dateMode: 'single',
    toText: '',
    placeText: '',
    categories: [],
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [managerPosts, setManagerPosts] = useState<Post[]>([]);
  const [isLoadingManagerPosts, setIsLoadingManagerPosts] = useState(false);
  const [userSchedules, setUserSchedules] = useState<Array<{
    id: string;
    postId: string;
    title: string;
    date: string;
    salary: number;
    location: string;
  }>>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const isManager = role === 'manager';

  // 현재 사용자 ID 가져오기
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    };
    fetchCurrentUser();
  }, []);

  // 공고 데이터 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const result = await getAllPostsAction();
        if (result.ok && result.data) {
          const convertedPosts = result.data.map((post) =>
            supabasePostToPost(post as SupabasePost)
          );
          setPosts(convertedPosts);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // 프로필 데이터 가져오기 (관리자 페이지용)
  useEffect(() => {
    if (hash === '#admin' && role === 'admin') {
      const fetchProfiles = async () => {
        try {
          const result = await getAllProfilesAction();
          if (result.ok && result.data) {
            setProfiles(result.data);
          }
        } catch (error) {
          console.error('Failed to fetch profiles:', error);
        }
      };
      fetchProfiles();
    }
  }, [hash, role]);

  // 매니저 공고 가져오기
  useEffect(() => {
    if (hash === '/manager/my-post' && currentUserId) {
      const fetchManagerPosts = async () => {
        setIsLoadingManagerPosts(true);
        try {
          const result = await getManagerPostsAction(currentUserId);
          if (result.ok && result.data) {
            const convertedPosts = result.data.map((post) =>
              supabasePostToPost(post as SupabasePost)
            );
            setManagerPosts(convertedPosts);
          }
        } catch (error) {
          console.error('Failed to fetch manager posts:', error);
        } finally {
          setIsLoadingManagerPosts(false);
        }
      };
      fetchManagerPosts();
    }
  }, [hash, currentUserId]);

  // 워커 스케줄 가져오기
  useEffect(() => {
    if (hash === '/worker/schedule' && currentUserId) {
      // TODO: schedules 테이블이 생성되면 실제 데이터로 교체
      setIsLoadingSchedules(false);
      setUserSchedules([]);
    }
  }, [hash, currentUserId]);

  useEffect(() => {
    const updateHash = () => {
      setHash(window.location.hash);
    };
    updateHash();
    window.addEventListener('hashchange', updateHash);
    const intervalId = setInterval(updateHash, 100);
    return () => {
      window.removeEventListener('hashchange', updateHash);
      clearInterval(intervalId);
    };
  }, []);

  // 구인공고 페이지 (#open 또는 기본)
  const jobPostings = useMemo(() => {
    return posts.map((post) => postToJobItem(post));
  }, [posts]);

  // 실제 공고 데이터에서 키워드 추출 (빈 값 제외, 정렬)
  const allCategories = useMemo(() => {
    const s = new Set<string>();
    // posts에서 직접 keywords 추출 (변환 전 원본 데이터 사용)
    posts.forEach((post) => {
      if (post.keywords && Array.isArray(post.keywords)) {
        post.keywords.forEach((keyword) => {
          // 빈 문자열이나 null이 아닌 키워드만 추가
          if (keyword && typeof keyword === 'string' && keyword.trim() !== '') {
            s.add(keyword.trim());
          }
        });
      }
    });
    return Array.from(s).sort(); // 알파벳 순으로 정렬
  }, [posts]);

  const allLocations = useMemo(() => {
    const set = new Set<string>();
    jobPostings.forEach((job) => {
      if (job.place) set.add(job.place);
    });
    return Array.from(set);
  }, [jobPostings]);

  const allSalaries = useMemo(() => {
    const salaries = new Set<number>();
    jobPostings.forEach((job) => {
      if (job.pay) {
        const payNum = Number(job.pay);
        if (!isNaN(payNum)) salaries.add(payNum);
      }
    });
    return Array.from(salaries).sort((a, b) => a - b);
  }, [jobPostings]);

  const filtered = useMemo(() => {
    const statusPriority: Record<JobItem['status'], number> = {
      급구: 0,
      모집: 1,
      모집완료: 2,
    };

    return jobPostings
      .filter((job) => {
        if (filters.status && job.status !== filters.status) return false;
        if (filters.payMin && Number(job.pay ?? 0) < Number(filters.payMin))
          return false;
        if (filters.payMax && Number(job.pay ?? 0) > Number(filters.payMax))
          return false;

        if (filters.dateRange?.from) {
          const jobDateStr = job.date ?? '';
          if (!jobDateStr) return false;

          const jobDate = new Date(jobDateStr);
          const from = new Date(filters.dateRange.from);
          const to =
            filters.dateMode === 'open-end'
              ? undefined
              : new Date(filters.dateRange.to ?? filters.dateRange.from);

          const jobTime = jobDate.setHours(0, 0, 0, 0);
          const fromTime = from.setHours(0, 0, 0, 0);

          if (jobTime < fromTime) return false;
          if (filters.dateMode !== 'open-end') {
            const toTime = (to ?? from).setHours(0, 0, 0, 0);
            if (jobTime > toTime) return false;
          }
        }

        if (filters.toText && !(job.TO ?? '').includes(filters.toText))
          return false;
        if (filters.placeText && !(job.place ?? '').includes(filters.placeText))
          return false;
        if (
          filters.categories.length > 0 &&
          !filters.categories.every((c) => job.categories.includes(c))
        )
          return false;

        return true;
      })
      .slice()
      .sort((a, b) => {
        const statusDiff = statusPriority[a.status] - statusPriority[b.status];
        if (statusDiff !== 0) return statusDiff;

        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // 최신순
      });
  }, [filters, jobPostings]);

  // 관리자 페이지 (#admin)
  if (hash === '#admin') {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">관리자 페이지</h2>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>사용자 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">사용자 데이터를 불러오는 중...</p>
                ) : (
                  profiles.map((profile) => (
                    <div
                      key={profile.user_id as string}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">
                          {(profile.name as string) || '이름 없음'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {profile.email as string}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          역할: {profile.role as string}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {profile.attendance_score as number}점
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>공고 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">공고 데이터를 불러오는 중...</p>
                ) : posts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">등록된 공고가 없습니다.</p>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{post.title}</p>
                        <Badge>{post.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {post.location} - {post.date}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        모집: {post.currentApplicants}/{post.recruitCount}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>지원서 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  지원서 기능은 준비 중입니다. (applications 테이블 필요)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 매니저 페이지 - 내 공고 (#my-posting)
  if (hash === '/manager/my-post') {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">내 공고</h2>
        <div className="space-y-4">
          {isLoadingManagerPosts ? (
            <p className="text-sm text-muted-foreground">공고를 불러오는 중...</p>
          ) : managerPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 공고가 없습니다.</p>
          ) : (
            managerPosts.map((post) => (
              <JobCard key={post.id} item={postToJobItem(post)} />
            ))
          )}
        </div>
      </div>
    );
  }

  // 일반 회원 페이지 - 내 스케줄 (#normal-member)
  if (hash === '/worker/schedule') {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">내 스케줄</h2>
        <div className="space-y-4">
          {isLoadingSchedules ? (
            <p className="text-sm text-muted-foreground">스케줄을 불러오는 중...</p>
          ) : userSchedules.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  스케줄 기능은 준비 중입니다. (applications/schedules 테이블 필요)
                </p>
              </CardContent>
            </Card>
          ) : (
            userSchedules.map((schedule) => {
              const post = posts.find((p) => p.id === schedule.postId);
              return (
                <Card key={schedule.id}>
                  <CardHeader>
                    <CardTitle>{schedule.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-semibold">날짜:</span>{' '}
                        {schedule.date}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">급여:</span>{' '}
                        {schedule.salary.toLocaleString()}원
                      </p>
                      {post && (
                        <p className="text-sm text-muted-foreground">
                          {(post as Post & { work_slots?: Array<{ location?: string }> }).work_slots?.[0]?.location || post.location || ''}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // 기본 페이지 - 구인공고 (#open 또는 빈 해시)
  return (
    <div className="flex flex-col gap-2">
      <Hero
        title="스탭 알바 구인공고"
        description="원하는 조건의 스탭 알바를 찾아보세요"
      />
      <PostingFilter
        filters={filters}
        onChange={setFilters}
        allCategories={allCategories}
        allLocations={allLocations}
        allSalaries={allSalaries}
      />
      {!roleHydrated ? (
        <Card className="mb-3">
          <CardContent className="py-3 text-sm text-muted-foreground">
            역할 정보를 불러오는 중입니다...
          </CardContent>
        </Card>
      ) : isManager ? (
        <Button variant="default" size="sm" asChild>
          <Link href="/my-post/create">
            <Plus className="size-4" />
            <span className="text-sm font-medium">새 구인 공고 작성</span>
          </Link>
        </Button>
      ) : null}
      {isLoading ? (
        <Card className="mb-3">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">공고를 불러오는 중...</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="mb-3">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">조건에 맞는 공고가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filtered.map((item) => (
            <JobCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
