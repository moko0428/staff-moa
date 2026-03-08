import { Skeleton } from '@/components/ui/skeleton';

const PostCardSkeleton = () => (
  <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
    {/* 상태 배지 + 카테고리 */}
    <div className="flex items-center gap-2">
      <Skeleton className="h-5 w-12" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>

    {/* 제목 + 설명 */}
    <div className="space-y-1.5">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>

    {/* 정보 그리드 */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-24" />
    </div>

    {/* 구분선 + 푸터 */}
    <div className="border-t pt-3 flex items-center justify-between">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  </div>
);

export default PostCardSkeleton;
