'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Eye, Loader2, Star, Trash2 } from 'lucide-react';
import { useAdminReviews } from '../../hooks/useAdminReviews';

export const ReviewsTab = () => {
  const {
    reviews,
    reviewStats,
    loadingReviews,
    reviewSearch,
    setReviewSearch,
    reviewRatingFilter,
    setReviewRatingFilter,
    filteredReviews,
    featuredCount,
    handleDeleteReview,
    handleToggleFeatured,
  } = useAdminReviews();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span>리뷰 관리</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                랜딩 노출: {featuredCount}/10
              </Badge>
              <span className="text-sm text-muted-foreground">
                총 {filteredReviews.length}건
              </span>
            </div>
          </div>
          {reviewStats && reviewStats.totalCount > 0 && (
            <div className="flex flex-wrap items-center gap-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="size-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-lg">{reviewStats.averageRating}</span>
                <span className="text-sm text-muted-foreground">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <span key={rating} className="flex items-center gap-0.5">
                    {rating}
                    <Star className="size-3 fill-yellow-400 text-yellow-400" />
                    <span className="mr-2">({reviewStats.ratingCounts[rating] || 0})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Input
              placeholder="사용자 이름 또는 내용으로 검색"
              value={reviewSearch}
              onChange={(e) => setReviewSearch(e.target.value)}
              className="h-9 text-sm"
            />
            <Select
              value={reviewRatingFilter}
              onValueChange={(value) =>
                setReviewRatingFilter(value as 'all' | '1' | '2' | '3' | '4' | '5')
              }
            >
              <SelectTrigger className="h-9 w-full sm:w-40 text-xs">
                <SelectValue placeholder="별점 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="5">5점</SelectItem>
                <SelectItem value="4">4점</SelectItem>
                <SelectItem value="3">3점</SelectItem>
                <SelectItem value="2">2점</SelectItem>
                <SelectItem value="1">1점</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loadingReviews ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
            <Loader2 className="size-4 animate-spin" />
            불러오는 중...
          </div>
        ) : filteredReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {reviews.length === 0 ? '등록된 리뷰가 없습니다.' : '조건에 맞는 리뷰가 없습니다.'}
          </p>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.review_id}
              className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-lg border px-4 py-3 ${
                review.is_featured ? 'bg-primary/5 border-primary/30' : ''
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={review.user_avatar ?? undefined}
                    alt={review.user_name ?? '사용자'}
                  />
                  <AvatarFallback>{review.user_name?.at(0) ?? '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm">
                      {review.user_name ?? '알 수 없음'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`size-3 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    {review.is_featured && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0.5">
                        랜딩 노출
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3">
                    {review.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(review.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={review.is_featured ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleToggleFeatured(review.review_id, review.is_featured)}
                  disabled={!review.is_featured && featuredCount >= 10}
                  title={
                    !review.is_featured && featuredCount >= 10
                      ? '최대 10개까지만 노출 가능합니다'
                      : review.is_featured
                      ? '랜딩 페이지에서 제외'
                      : '랜딩 페이지에 노출'
                  }
                >
                  <Eye className="size-4" />
                  <span className="text-xs">{review.is_featured ? '노출중' : '노출'}</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteReview(review.review_id)}
                >
                  <Trash2 className="size-4" />
                  <span className="text-xs">삭제</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
