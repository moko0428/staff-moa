'use client';

import { useState, useEffect } from 'react';
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
import JobCard from '@/app/components/JobCard';
import {
  Heart,
  Search,
  ArrowUpDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { postToJobItem } from '../../utils/postConverters';
import type { SortOrder, ConvertedPost } from '../../types';
import type { Post } from '@/types/mockData';

const DESKTOP_PAGE_SIZE = 9;

type Props = {
  isLoading: boolean;
  isLoadingMatched: boolean;
  favoritePosts: Post[];
  matchedPosts: Post[];
  filteredAndSortedPosts: Post[];
  filteredMatchedPosts: Post[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  sortOrder: SortOrder;
  setSortOrder: (v: SortOrder) => void;
};

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="hidden md:flex items-center justify-center gap-3 mt-4">
      <Button
        variant="outline"
        size="icon"
        onClick={onPrev}
        disabled={page === 0}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-sm text-muted-foreground">
        {page + 1} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={onNext}
        disabled={page === totalPages - 1}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

export function PostsTab({
  isLoading,
  isLoadingMatched,
  favoritePosts,
  matchedPosts,
  filteredAndSortedPosts,
  filteredMatchedPosts,
  searchTerm,
  setSearchTerm,
  sortOrder,
  setSortOrder,
}: Props) {
  const [matchedPage, setMatchedPage] = useState(0);
  const [savedPage, setSavedPage] = useState(0);

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setMatchedPage(0);
  }, [filteredMatchedPosts.length]);

  useEffect(() => {
    setSavedPage(0);
  }, [filteredAndSortedPosts.length]);

  const matchedTotalPages = Math.max(
    1,
    Math.ceil(filteredMatchedPosts.length / DESKTOP_PAGE_SIZE),
  );
  const savedTotalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedPosts.length / DESKTOP_PAGE_SIZE),
  );

  const pagedMatchedPosts = filteredMatchedPosts.slice(
    matchedPage * DESKTOP_PAGE_SIZE,
    (matchedPage + 1) * DESKTOP_PAGE_SIZE,
  );
  const pagedSavedPosts = filteredAndSortedPosts.slice(
    savedPage * DESKTOP_PAGE_SIZE,
    (savedPage + 1) * DESKTOP_PAGE_SIZE,
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="size-12 text-muted-foreground/50 mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">관심 목록을 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (favoritePosts.length === 0 && matchedPosts.length === 0) {
    return (
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
    );
  }

  return (
    <>
      {/* 검색 및 필터 - 모바일 전용 */}
      <Card className="mb-6 md:hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/80" />
              <Input
                placeholder="제목, 장소, 키워드로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
        </CardContent>
      </Card>

      <div className="space-y-8">
        {/* 맞춤 공고 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">맞춤 공고</h3>
          {isLoadingMatched ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Loader2 className="size-10 text-muted-foreground/50 mx-auto mb-3 animate-spin" />
                <p className="text-muted-foreground">
                  맞춤 공고를 불러오는 중...
                </p>
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
            <>
              {/* 모바일: 가로 스크롤 2개 */}
              <div className="flex gap-3 overflow-x-auto scroll-none snap-x snap-mandatory py-2 md:hidden">
                {filteredMatchedPosts.map((post) => (
                  <div
                    key={`matched-${post.id}`}
                    className="w-[calc(50%-6px)] shrink-0 snap-start"
                  >
                    <JobCard item={postToJobItem(post as ConvertedPost)} />
                  </div>
                ))}
              </div>
              {/* 데스크톱: 3열 그리드 + 페이지네이션 */}
              <div className="hidden md:grid md:grid-cols-3 md:gap-4">
                {pagedMatchedPosts.map((post) => (
                  <JobCard
                    key={`matched-${post.id}`}
                    item={postToJobItem(post as ConvertedPost)}
                  />
                ))}
              </div>
              <Pagination
                page={matchedPage}
                totalPages={matchedTotalPages}
                onPrev={() => setMatchedPage((p) => Math.max(0, p - 1))}
                onNext={() =>
                  setMatchedPage((p) => Math.min(matchedTotalPages - 1, p + 1))
                }
              />
            </>
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
            <>
              {/* 모바일: 가로 스크롤 2개 */}
              <div className="flex gap-3 overflow-x-auto scroll-none snap-x snap-mandatory py-2 md:hidden">
                {filteredAndSortedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="w-[calc(50%-6px)] shrink-0 snap-start"
                  >
                    <JobCard item={postToJobItem(post as ConvertedPost)} />
                  </div>
                ))}
              </div>
              {/* 데스크톱: 3열 그리드 + 페이지네이션 */}
              <div className="hidden md:grid md:grid-cols-3 md:gap-4">
                {pagedSavedPosts.map((post) => (
                  <JobCard
                    key={post.id}
                    item={postToJobItem(post as ConvertedPost)}
                  />
                ))}
              </div>
              <Pagination
                page={savedPage}
                totalPages={savedTotalPages}
                onPrev={() => setSavedPage((p) => Math.max(0, p - 1))}
                onNext={() =>
                  setSavedPage((p) => Math.min(savedTotalPages - 1, p + 1))
                }
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
