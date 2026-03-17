'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchAppReviewsAction,
  fetchReviewStatsAction,
  deleteAppReviewAction,
  toggleReviewFeaturedAction,
  type AppReview,
  type ReviewStats,
} from '../review-actions';

interface ReviewsData {
  reviews: AppReview[];
  reviewStats: ReviewStats | null;
}

async function fetchReviewsAndStats(): Promise<ReviewsData> {
  const [reviewsResult, statsResult] = await Promise.all([
    fetchAppReviewsAction(),
    fetchReviewStatsAction(),
  ]);
  return {
    reviews: reviewsResult.ok && reviewsResult.data ? reviewsResult.data : [],
    reviewStats: statsResult.ok && statsResult.data ? statsResult.data : null,
  };
}

export const useAdminReviews = () => {
  const queryClient = useQueryClient();
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<
    'all' | '1' | '2' | '3' | '4' | '5'
  >('all');

  const { data, isLoading: loadingReviews } = useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: fetchReviewsAndStats,
  });

  const reviews = data?.reviews ?? [];
  const reviewStats = data?.reviewStats ?? null;

  const filteredReviews = useMemo(
    () =>
      reviews
        .filter((review) => {
          const matchSearch =
            !reviewSearch ||
            (review.user_name?.toLowerCase().includes(reviewSearch.toLowerCase()) ?? false) ||
            review.content.toLowerCase().includes(reviewSearch.toLowerCase());
          const matchRating =
            reviewRatingFilter === 'all' || review.rating === parseInt(reviewRatingFilter);
          return matchSearch && matchRating;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [reviews, reviewSearch, reviewRatingFilter]
  );

  const featuredCount = useMemo(() => reviews.filter((r) => r.is_featured).length, [reviews]);

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const result = await deleteAppReviewAction(reviewId);
      if (result.ok) {
        toast.success(result.message);
        queryClient.setQueryData<ReviewsData>(['admin', 'reviews'], (old) =>
          old ? { ...old, reviews: old.reviews.filter((r) => r.review_id !== reviewId) } : old
        );
        const statsResult = await fetchReviewStatsAction();
        if (statsResult.ok && statsResult.data) {
          queryClient.setQueryData<ReviewsData>(['admin', 'reviews'], (old) =>
            old ? { ...old, reviewStats: statsResult.data! } : old
          );
        }
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error('Failed to delete review', err);
      toast.error('리뷰 삭제에 실패했습니다.');
    }
  };

  const handleToggleFeatured = async (reviewId: string, currentFeatured: boolean) => {
    try {
      const result = await toggleReviewFeaturedAction(reviewId, !currentFeatured);
      if (result.ok) {
        toast.success(result.message);
        queryClient.setQueryData<ReviewsData>(['admin', 'reviews'], (old) =>
          old
            ? {
                ...old,
                reviews: old.reviews.map((r) =>
                  r.review_id === reviewId ? { ...r, is_featured: !currentFeatured } : r
                ),
              }
            : old
        );
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error('Failed to toggle featured', err);
      toast.error('리뷰 상태 변경에 실패했습니다.');
    }
  };

  return {
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
  };
};
