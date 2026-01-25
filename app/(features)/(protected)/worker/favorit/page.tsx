'use client';

import { useState, useEffect, useMemo } from 'react';
import Hero from '@/app/components/Hero';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import JobCard, { type JobItem } from '@/app/components/JobCard';
import { Heart, Search, ArrowUpDown, Loader2, FileText, Users } from 'lucide-react';
import { getFavoritePostsAction } from './actions';
import { useUserStore } from '@/store/useUserStore';
import { Post } from '@/types/mockData'; // 타입 정의만 사용 (실제 데이터는 Supabase에서 가져옴)

type SortOrder = 'newest' | 'oldest';

// Supabase Post를 Post 타입으로 변환
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
  work_slots?: Array<{
    date: string;
    start_time: string;
    end_time: string;
    location?: string;
    pay_amount?: number;
  }> | null;
};

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
  const firstSlot = Array.isArray(supabasePost.work_slots) && supabasePost.work_slots.length > 0
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
    currentApplicants: 0,
    notes: supabasePost.notes || undefined,
    requirements: supabasePost.qualifications || undefined,
    preferences: supabasePost.preferences || undefined,
    createdAt: supabasePost.created_at,
    updatedAt: supabasePost.updated_at,
    work_slots: supabasePost.work_slots?.map(slot => ({
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      start: slot.start_time,
      end: slot.end_time,
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

export default function WorkerFavoritePage() {
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const isMember = role === 'member';
  
  const [favoritePosts, setFavoritePosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // 관심목록 공고 가져오기
  useEffect(() => {
    const fetchFavoritePosts = async () => {
      if (!isMember || !roleHydrated) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const result = await getFavoritePostsAction();
        if (result.ok && result.data) {
          const convertedPosts = result.data.map((post) =>
            supabasePostToPost(post as SupabasePost)
          );
          setFavoritePosts(convertedPosts);
        } else {
          setFavoritePosts([]);
        }
      } catch (error) {
        console.error('Failed to fetch favorite posts:', error);
        setFavoritePosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoritePosts();

    // 관심 목록 변경 감지를 위한 커스텀 이벤트 리스너
    const handleFavoritesUpdate = () => {
      fetchFavoritePosts();
    };

    window.addEventListener('favorites-updated', handleFavoritesUpdate);

    return () => {
      window.removeEventListener('favorites-updated', handleFavoritesUpdate);
    };
  }, [isMember, roleHydrated]);

  // 관심 목록 공고 필터링 및 정렬
  const filteredAndSortedPosts = useMemo(() => {
    let posts = [...favoritePosts];

    // 검색어 필터링
    if (searchTerm) {
      posts = posts.filter((post) => {
        return (
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.keywords?.some((k) =>
            k.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      });
    }

    // 정렬
    posts.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return posts;
  }, [favoritePosts, searchTerm, sortOrder]);

  return (
    <div>
      <Hero
        title="관심 목록"
        description="관심있는 공고와 매니저를 저장하고 빠르게 확인하세요"
      />

      {!roleHydrated ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="size-12 text-gray-300 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">역할 정보를 불러오는 중입니다...</p>
          </CardContent>
        </Card>
      ) : !isMember ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">스탭만 관심 목록을 사용할 수 있습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto mb-6 grid-cols-2">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="size-4" />
              포스트
            </TabsTrigger>
            <TabsTrigger value="managers" className="flex items-center gap-2">
              <Users className="size-4" />
              매니저
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {isLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="size-12 text-gray-300 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-500">관심 목록을 불러오는 중...</p>
                </CardContent>
              </Card>
            ) : favoritePosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="size-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">관심 목록이 비어있습니다</p>
                  <p className="text-sm text-gray-400 mb-4">
                    공고 카드의 하트 아이콘을 클릭하여 관심 목록에 추가하세요
                  </p>
                  <Button onClick={() => (window.location.href = '/post')}>
                    공고 둘러보기
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* 검색 및 필터 */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                          <Input
                            placeholder="제목, 장소, 키워드로 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="w-full md:w-48">
                        <Select
                          value={sortOrder}
                          onValueChange={(value) => setSortOrder(value as SortOrder)}
                        >
                          <SelectTrigger>
                            <ArrowUpDown className="size-4 mr-2" />
                            <SelectValue placeholder="정렬 기준" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">최신순</SelectItem>
                            <SelectItem value="oldest">오래된순</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 공고 목록 */}
                {filteredAndSortedPosts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Search className="size-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">검색 결과가 없습니다</p>
                      <p className="text-sm text-gray-400">
                        다른 검색어를 입력해보세요
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredAndSortedPosts.map((post) => (
                      <JobCard key={post.id} item={postToJobItem(post)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="managers">
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="size-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">매니저 팔로우 기능</p>
                <p className="text-sm text-gray-400 mb-4">
                  향후 업데이트에서 관심있는 매니저를 팔로우하고<br />
                  새로운 공고 알림을 받을 수 있습니다
                </p>
                <p className="text-xs text-gray-400">
                  Coming Soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
