'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getLandingStatsAction,
  getTopReviewsAction,
  type LandingStats,
  type LandingReview,
} from '../actions';
import { getActivePopupAction, type LandingPopup } from '../popup-actions';

export const useLandingData = () => {
  const router = useRouter();
  const [stats, setStats] = useState<LandingStats | null>(null);
  const [topReviews, setTopReviews] = useState<LandingReview[]>([]);
  const [activePopup, setActivePopup] = useState<LandingPopup | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 이미 로그인한 사용자는 공고 페이지로 리디렉션
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const authed =
      !!localStorage.getItem('userId') || !!localStorage.getItem('authToken');
    if (authed) router.replace('/post');
  }, [router]);

  // 통계, 후기, 팝업 병렬 fetch
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
const [statsResult, reviewsResult, popupResult] = await Promise.all([
        getLandingStatsAction(),
        getTopReviewsAction(),
        getActivePopupAction(),
      ]);
      if (statsResult.ok && statsResult.data) setStats(statsResult.data);
      if (reviewsResult.ok && reviewsResult.data) setTopReviews(reviewsResult.data);
      if (popupResult.ok && popupResult.data) setActivePopup(popupResult.data);
      setIsLoading(false);
    };
    load();
  }, []);

  return { stats, topReviews, activePopup, isLoading };
};
