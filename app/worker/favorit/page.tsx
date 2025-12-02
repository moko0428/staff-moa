'use client';

import { useState, useEffect, useMemo } from 'react';
import Hero from '@/components/Hero';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockPosts, mockFavorites } from '@/lib/mockData';
import JobCard, { type JobItem } from '@/components/JobCard';
import { Post } from '@/types/mockData';
import { Heart, Search, ArrowUpDown } from 'lucide-react';

type SortOrder = 'newest' | 'oldest';

// Post를 JobItem으로 변환하는 함수
function postToJobItem(post: Post): JobItem {
  const statusMap: Record<Post['status'], JobItem['status']> = {
    urgent: '급구',
    recruiting: '모집',
    completed: '모집완료',
  };

  return {
    id: post.id,
    title: post.title,
    content: post.description,
    date: post.date,
    time: post.time,
    need: post.preparation,
    place: post.location,
    pay: post.salary.toString(),
    TO: `${post.recruitCount - post.currentApplicants}명`,
    manager: post.managerInfo.name,
    managerPhone: post.managerInfo.phone,
    etc: post.notes,
    categories: post.keywords,
    qualifications: post.requirements ? [post.requirements] : [],
    status: statusMap[post.status],
  };
}

export default function WorkerFavoritePage() {
  const [currentUserId, setCurrentUserId] = useState<string>('member-1');
  const [favoritePostIds, setFavoritePostIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  useEffect(() => {
    const loadFavorites = (userId: string) => {
      // 1. localStorage에서 데이터 확인
      const saved = localStorage.getItem(`favorites_${userId}`);
      if (saved) {
        setFavoritePostIds(JSON.parse(saved));
        return;
      }

      // 2. localStorage에 없으면 mockFavorites에서 초기 데이터 로드
      const userFavorite = mockFavorites.find((fav) => fav.userId === userId);
      if (userFavorite) {
        setFavoritePostIds(userFavorite.postIds);
        // localStorage에도 저장
        localStorage.setItem(
          `favorites_${userId}`,
          JSON.stringify(userFavorite.postIds)
        );
      } else {
        setFavoritePostIds([]);
      }
    };

    try {
      const userId =
        typeof window !== 'undefined'
          ? localStorage.getItem('userId') || 'member-1'
          : 'member-1';
      setCurrentUserId(userId);
      loadFavorites(userId);

      // 관심 목록 변경 감지를 위한 커스텀 이벤트 리스너
      const handleFavoritesUpdate = () => {
        loadFavorites(userId);
      };

      window.addEventListener('favorites-updated', handleFavoritesUpdate);

      return () => {
        window.removeEventListener('favorites-updated', handleFavoritesUpdate);
      };
    } catch {
      setCurrentUserId('member-1');
    }
  }, []);

  // 관심 목록 공고 필터링 및 정렬
  const filteredAndSortedPosts = useMemo(() => {
    let posts = mockPosts.filter((post) => favoritePostIds.includes(post.id));

    // 검색어 필터링
    if (searchTerm) {
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.keywords?.some((k) =>
            k.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // 정렬
    posts.sort((a, b) => {
      const dateA = new Date(a.createdAt || '').getTime();
      const dateB = new Date(b.createdAt || '').getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return posts;
  }, [favoritePostIds, searchTerm, sortOrder]);

  return (
    <div>
      <Hero
        title="관심 목록"
        description="관심있는 공고를 저장하고 빠르게 확인하세요"
      />

      {favoritePostIds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="size-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">관심 목록이 비어있습니다</p>
            <p className="text-sm text-gray-400 mb-4">
              공고 카드의 하트 아이콘을 클릭하여 관심 목록에 추가하세요
            </p>
            <Button onClick={() => (window.location.href = '/')}>
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
            <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
              {filteredAndSortedPosts.map((post) => (
                <JobCard key={post.id} item={postToJobItem(post)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
