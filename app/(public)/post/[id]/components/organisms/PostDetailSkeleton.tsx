import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/app/components/ui/card';

const PostDetailSkeleton = () => (
  <div className="pb-20">
    {/* Action bar skeleton */}
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-9 w-24" />
      <div className="flex gap-2">
        <Skeleton className="size-9 rounded-md" />
        <Skeleton className="size-9 rounded-md" />
        <Skeleton className="size-9 rounded-md" />
      </div>
    </div>

    {/* Header card skeleton */}
    <Card className="mb-6">
      <CardHeader>
        {/* 상태 배지 + 키워드 배지 */}
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        {/* 제목 */}
        <Skeleton className="h-8 w-3/4" />
        {/* 작성자 행 */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t">
          <Skeleton className="size-10 rounded-full shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="ml-auto h-3 w-32" />
        </div>
        {/* 담당자 연락처 행 */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </CardHeader>
    </Card>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column skeleton (lg:col-span-2) */}
      <div className="lg:col-span-2 space-y-6">
        {/* 근무 정보 카드 */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-5 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        {/* 상세 설명 카드 */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-16" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>

      {/* Right column skeleton */}
      <div className="space-y-6">
        {/* 모집 현황 카드 */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </CardContent>
        </Card>
      </div>
    </div>

    {/* BottomActionBar skeleton */}
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 px-4 py-3 flex items-center gap-3">
      <Skeleton className="size-10 rounded-md shrink-0" />
      <Skeleton className="h-11 flex-1 rounded-md" />
    </div>
  </div>
);

export default PostDetailSkeleton;
