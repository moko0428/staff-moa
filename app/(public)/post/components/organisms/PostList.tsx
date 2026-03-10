'use client';

import { useEffect, useRef, useState } from 'react';
import JobCard, { type JobItem } from '@/app/components/JobCard';
import { Card, CardContent } from '@/app/components/ui/card';
import PostListSkeleton from './PostListSkeleton';
import PostCardSkeleton from '../molecules/PostCardSkeleton';

const PAGE_SIZE = 12;

interface PostListProps {
  items: JobItem[];
  isLoading: boolean;
}

const PostList = ({ items, isLoading }: PostListProps) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 필터 변경 시 처음부터 다시
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [items]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length));
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items.length]);

  if (isLoading) return <PostListSkeleton />;

  if (items.length === 0) {
    return (
      <Card className="mb-3">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            조건에 맞는 공고가 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 p-2">
        {visibleItems.map((item) => (
          <JobCard key={item.id} item={item} />
        ))}
      </div>

      {/* 센티널: 화면에 들어오면 다음 페이지 로드 */}
      <div ref={sentinelRef}>
        {hasMore && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 p-2">
            {Array.from({
              length: Math.min(2, items.length - visibleCount),
            }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PostList;
