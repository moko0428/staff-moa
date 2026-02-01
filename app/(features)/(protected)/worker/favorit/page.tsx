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
import { Heart, Search, ArrowUpDown, Loader2, FileText, Users, Tag, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  getFavoritePostsAction,
  getFavoriteKeywordsAction,
  addFavoriteKeywordAction,
  removeFavoriteKeywordAction,
  getActivePostKeywordsAction,
  getFollowedManagersAction,
  followManagerAction,
  unfollowManagerAction,
  getMatchedPostsForFavoritesAction,
  getActiveManagersFromPostsAction,
  getProfileForModalAction,
} from './actions';
import { useUserStore } from '@/store/useUserStore';
import { Post } from '@/types/mockData'; // 타입 정의만 사용 (실제 데이터는 Supabase에서 가져옴)
import ProfileModal from '@/app/components/profile-modal';
import { createClient } from '@/utils/supabase/client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';

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
  external_link?: string | null;
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
  external_link?: string;
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
    external_link: supabasePost.external_link || undefined,
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
  external_link?: string;
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
  const workSlotCount = Array.isArray(post.work_slots) && post.work_slots.length > 0 ? post.work_slots.length : 1;

  return {
    id: post.id,
    title: post.title,
    content: post.description,
    date: date,
    workSlotCount,
    time: time,
    need: need,
    place: place,
    pay: pay.toString(),
    TO: `${recruitCount - currentApplicants}명`,
    manager: managerName,
    managerPhone: managerPhone,
    etc: post.notes || '',
    externalLink: (post as { external_link?: string }).external_link || null,
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
  const [matchedPosts, setMatchedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMatched, setIsLoadingMatched] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // 키워드 탭 상태
  const [favoriteKeywords, setFavoriteKeywords] = useState<string[]>([]);
  const [activeKeywords, setActiveKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);

  // 매니저 탭 상태
  const [followedManagerIds, setFollowedManagerIds] = useState<string[]>([]);
  const [activeManagers, setActiveManagers] = useState<
    Array<{
      managerId: string;
      managerName: string;
      avatar: string | null;
      followerCount: number;
    }>
  >([]);
  const [managerSearch, setManagerSearch] = useState('');
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);

  // 프로필 모달
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<{
    id: string;
    name: string | null;
    email: string | null;
    photo: string | null;
    role: string;
    introduction: string | null;
    attendanceScore: number | null;
    followerCount: number;
  } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

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

  useEffect(() => {
    // ProfileModal에서 "내 프로필" 판단용
    const fetchMe = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        setCurrentUserId(data.user?.id);
      } catch {
        // noop
      }
    };
    fetchMe();
  }, []);

  const openManagerProfile = async (managerId: string) => {
    const result = await getProfileForModalAction(managerId);
    if (!result.ok || !result.data) {
      toast.error(result.message || '프로필을 불러오는데 실패했습니다.');
      return;
    }
    setProfileModalUser(result.data);
    setProfileModalOpen(true);
  };

  // 키워드/매니저/매칭 공고 데이터 로드
  useEffect(() => {
    const fetchExtras = async () => {
      if (!isMember || !roleHydrated) return;

      setIsLoadingKeywords(true);
      setIsLoadingManagers(true);
      setIsLoadingMatched(true);
      try {
        const [
          kwResult,
          activeKwResult,
          followedResult,
          activeManagersResult,
          matchedResult,
        ] = await Promise.all([
          getFavoriteKeywordsAction(),
          getActivePostKeywordsAction(),
          getFollowedManagersAction(),
          getActiveManagersFromPostsAction(),
          getMatchedPostsForFavoritesAction(),
        ]);

        if (kwResult.ok) setFavoriteKeywords(kwResult.data || []);
        if (activeKwResult.ok) setActiveKeywords(activeKwResult.data || []);
        if (followedResult.ok) setFollowedManagerIds(followedResult.data || []);
        if (activeManagersResult.ok) setActiveManagers(activeManagersResult.data || []);

        if (matchedResult.ok && matchedResult.data) {
          // posts (* ) 형태는 아니고 posts row라서 SupabasePost로 변환
          const converted = matchedResult.data.map((post) =>
            supabasePostToPost(post as SupabasePost),
          );
          setMatchedPosts(converted);
        } else {
          setMatchedPosts([]);
        }
      } catch (e) {
        console.error('Failed to fetch favorites extras:', e);
      } finally {
        setIsLoadingKeywords(false);
        setIsLoadingManagers(false);
        setIsLoadingMatched(false);
      }
    };

    fetchExtras();
  }, [isMember, roleHydrated]);

  const handleAddKeyword = async () => {
    const v = newKeyword.trim();
    if (!v) return;
    const result = await addFavoriteKeywordAction(v);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    const refreshed = await getFavoriteKeywordsAction();
    if (refreshed.ok) setFavoriteKeywords(refreshed.data || []);
    setNewKeyword('');
  };

  const handleRemoveKeyword = async (kw: string) => {
    const result = await removeFavoriteKeywordAction(kw);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setFavoriteKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const handleFollowManager = async (managerId: string) => {
    const result = await followManagerAction(managerId);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setFollowedManagerIds((prev) =>
      prev.includes(managerId) ? prev : [...prev, managerId],
    );
  };

  const handleUnfollowManager = async (managerId: string) => {
    const result = await unfollowManagerAction(managerId);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setFollowedManagerIds((prev) => prev.filter((id) => id !== managerId));
  };

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

  const filteredMatchedPosts = useMemo(() => {
    let posts = [...matchedPosts];
    if (searchTerm) {
      posts = posts.filter((post) => {
        return (
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.keywords?.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });
    }
    posts.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return posts;
  }, [matchedPosts, searchTerm, sortOrder]);

  const filteredActiveManagers = useMemo(() => {
    const s = managerSearch.trim().toLowerCase();
    if (!s) return activeManagers;
    return activeManagers.filter((m) => m.managerName.toLowerCase().includes(s));
  }, [activeManagers, managerSearch]);

  return (
    <div>
      <Hero
        title="관심 목록"
        description="관심있는 공고와 매니저를 저장하고 빠르게 확인하세요"
      />

      {!roleHydrated ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="size-12 text-muted-foreground/50 mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">역할 정보를 불러오는 중입니다...</p>
          </CardContent>
        </Card>
      ) : !isMember ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">스탭만 관심 목록을 사용할 수 있습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full max-w-xl mx-auto mb-6 grid-cols-3">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="size-4" />
              포스트
            </TabsTrigger>
            <TabsTrigger value="keywords" className="flex items-center gap-2">
              <Tag className="size-4" />
              키워드
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
                  <Loader2 className="size-12 text-muted-foreground/50 mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">관심 목록을 불러오는 중...</p>
                </CardContent>
              </Card>
            ) : favoritePosts.length === 0 && matchedPosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="size-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">관심 목록이 비어있습니다</p>
                  <p className="text-sm text-muted-foreground/80 mb-4">
                    관심 공고를 저장하거나, 관심 키워드/팔로우 매니저를 설정해보세요.
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
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground/80" />
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
                <div className="space-y-8">
                  {/* 매칭 공고 */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">맞춤 공고</h3>
                    {isLoadingMatched ? (
                      <Card>
                        <CardContent className="py-10 text-center">
                          <Loader2 className="size-10 text-muted-foreground/50 mx-auto mb-3 animate-spin" />
                          <p className="text-muted-foreground">맞춤 공고를 불러오는 중...</p>
                        </CardContent>
                      </Card>
                    ) : filteredMatchedPosts.length === 0 ? (
                      <Card>
                        <CardContent className="py-10 text-center">
                          <p className="text-sm text-muted-foreground">
                            아직 매칭된 공고가 없습니다. 키워드/매니저를 설정해보세요.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredMatchedPosts.map((post) => (
                          <JobCard key={`matched-${post.id}`} item={postToJobItem(post)} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 저장한 공고 */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">저장한 공고</h3>
                    {filteredAndSortedPosts.length === 0 ? (
                      <Card>
                        <CardContent className="py-10 text-center">
                          <p className="text-sm text-muted-foreground">
                            저장한 공고가 없습니다. 공고 카드의 하트를 눌러 저장하세요.
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
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="keywords">
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">관심 키워드</p>
                      <p className="text-sm text-muted-foreground">
                        키워드에 매칭되는 공고가 올라오면 알림을 받을 수 있습니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="키워드 입력 (예: 부산, 팝업, 행사)"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddKeyword();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddKeyword}>
                      <Plus className="size-4 mr-1" />
                      추가
                    </Button>
                  </div>

                  {isLoadingKeywords ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      키워드를 불러오는 중...
                    </div>
                  ) : favoriteKeywords.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      아직 관심 키워드가 없습니다.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {favoriteKeywords.map((kw) => (
                        <Button
                          key={kw}
                          type="button"
                          variant="secondary"
                          className="h-8 px-3"
                          onClick={() => handleRemoveKeyword(kw)}
                          title="클릭하면 삭제"
                        >
                          #{kw}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <p className="font-semibold">추천 키워드</p>
                  <p className="text-sm text-muted-foreground">
                    최근 공고에서 자주 보이는 키워드입니다. 클릭해서 추가할 수 있어요.
                  </p>
                  {activeKeywords.length === 0 ? (
                    <div className="py-6 text-sm text-muted-foreground">
                      추천 키워드가 없습니다.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {activeKeywords
                        .filter((kw) => !favoriteKeywords.includes(kw))
                        .slice(0, 40)
                        .map((kw) => (
                          <Button
                            key={`active-${kw}`}
                            type="button"
                            variant="outline"
                            className="h-8 px-3"
                            onClick={async () => {
                              const r = await addFavoriteKeywordAction(kw);
                              if (!r.ok) {
                                toast.error(r.message);
                                return;
                              }
                              setFavoriteKeywords((prev) =>
                                prev.includes(kw) ? prev : [...prev, kw],
                              );
                            }}
                          >
                            #{kw}
                          </Button>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="managers">
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <p className="font-semibold">팔로우한 매니저</p>
                  <p className="text-sm text-muted-foreground">
                    팔로우한 매니저가 공고를 올리면 알림을 받을 수 있습니다.
                  </p>
                  {followedManagerIds.length === 0 ? (
                    <div className="py-6 text-sm text-muted-foreground">
                      아직 팔로우한 매니저가 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[264px] overflow-y-auto pr-1">
                      {followedManagerIds.map((id) => {
                        const m = activeManagers.find((x) => x.managerId === id);
                        return (
                          <div
                            key={`followed-${id}`}
                            className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-accent"
                            onClick={() => openManagerProfile(id)}
                          >
                            <div className="min-w-0 flex items-center gap-3">
                              <Avatar className="size-10">
                                <AvatarImage src={m?.avatar ?? undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {(m?.managerName || '매니저').charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <p className="font-medium truncate">
                                {m?.managerName || '매니저'}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnfollowManager(id);
                              }}
                            >
                              언팔로우
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <p className="font-semibold">매니저 찾기</p>
                  <Input
                    placeholder="매니저 이름으로 검색"
                    value={managerSearch}
                    onChange={(e) => setManagerSearch(e.target.value)}
                  />

                  {isLoadingManagers ? (
                    <div className="py-6 text-sm text-muted-foreground">불러오는 중...</div>
                  ) : filteredActiveManagers.length === 0 ? (
                    <div className="py-6 text-sm text-muted-foreground">검색 결과가 없습니다.</div>
                  ) : (
                    <div className="space-y-2 max-h-[264px] overflow-y-auto pr-1">
                      {filteredActiveManagers.slice(0, 50).map((m) => {
                        const followed = followedManagerIds.includes(m.managerId);
                        return (
                          <div
                            key={m.managerId}
                            className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-accent"
                            onClick={() => openManagerProfile(m.managerId)}
                          >
                            <div className="min-w-0 flex items-center gap-3">
                              <Avatar className="size-10">
                                <AvatarImage src={m.avatar ?? undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {m.managerName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <p className="font-medium truncate">{m.managerName}</p>
                            </div>
                            {followed ? (
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnfollowManager(m.managerId);
                                }}
                              >
                                팔로잉
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFollowManager(m.managerId);
                                }}
                              >
                                팔로우
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {profileModalUser && (
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={profileModalUser}
          currentUserId={currentUserId}
          isFollowing={followedManagerIds.includes(profileModalUser.id)}
          onFollowToggle={async () => {
            const id = profileModalUser.id;
            if (followedManagerIds.includes(id)) {
              await handleUnfollowManager(id);
            } else {
              await handleFollowManager(id);
            }
          }}
        />
      )}
    </div>
  );
}
