'use client';

import Hero from '@/components/Hero';
import MyPostCard from '@/components/MyPostCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockPosts } from '@/lib/mockData';
import { Post } from '@/types/mockData';
import { Plus, FilterIcon, Search } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

export default function MyPostPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState(mockPosts);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    try {
      const userId =
        typeof window !== 'undefined'
          ? localStorage.getItem('userId') || 'manager-1'
          : 'manager-1';
      setCurrentUserId(userId);
    } catch {
      setCurrentUserId('manager-1');
    }
  }, []);

  const myPosts = useMemo(() => {
    let filtered = posts.filter(
      (p) => currentUserId && p.authorId === currentUserId
    );

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 정렬
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [posts, currentUserId, searchTerm, sortOrder]);

  const handleEdit = (editedPost: Post) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === editedPost.id ? editedPost : p))
    );
  };

  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleStatusToggle = (postId: string, newStatus: Post['status']) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p))
    );
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2">
        <Hero title="내 공고 관리" description="작성한 구인공고를 관리하세요" />
        <div className="flex items-center gap-2">
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
          <Button variant="default" size="sm">
            <Plus className="size-4" />
            <span className="text-sm font-medium">새 공고 작성</span>
          </Button>
        </div>
      </div>

      {/* 필터 영역 */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="flex flex-col gap-4">
            {/* 검색바 */}
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

            {/* 정렬 옵션 */}
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
          </div>
        </div>
      )}

      {/* 개요 */}
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

      {/* 공고 목록 */}
      <div className="space-y-4">
        {myPosts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">작성한 공고가 없습니다.</p>
            <Button
              onClick={() => console.log('create-post')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              첫 공고 작성하기
            </Button>
          </div>
        ) : (
          myPosts.map((post) => (
            <MyPostCard
              key={post.id}
              post={post}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusToggle={handleStatusToggle}
            />
          ))
        )}
      </div>
    </div>
  );
}
