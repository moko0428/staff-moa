'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  fetchAppReviewsAction,
  fetchReviewStatsAction,
  deleteAppReviewAction,
  toggleReviewFeaturedAction,
  type AppReview,
  type ReviewStats,
} from '../review-actions';

export const useAdminReviews = () => {
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<
    'all' | '1' | '2' | '3' | '4' | '5'
  >('all');

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const [reviewsResult, statsResult] = await Promise.all([
        fetchAppReviewsAction(),
        fetchReviewStatsAction(),
      ]);
      if (reviewsResult.ok && reviewsResult.data) setReviews(reviewsResult.data);
      if (statsResult.ok && statsResult.data) setReviewStats(statsResult.data);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

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
        setReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
        const statsResult = await fetchReviewStatsAction();
        if (statsResult.ok && statsResult.data) setReviewStats(statsResult.data);
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
        setReviews((prev) =>
          prev.map((r) =>
            r.review_id === reviewId ? { ...r, is_featured: !currentFeatured } : r
          )
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
