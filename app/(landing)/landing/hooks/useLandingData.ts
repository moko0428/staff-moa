'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  getLandingStatsAction,
  getTopReviewsAction,
} from '../actions';
import { getActivePopupAction } from '../popup-actions';

async function fetchLandingData() {
  const [statsResult, reviewsResult, popupResult] = await Promise.all([
    getLandingStatsAction(),
    getTopReviewsAction(),
    getActivePopupAction(),
  ]);
  return {
    stats: statsResult.ok && statsResult.data ? statsResult.data : null,
    topReviews: reviewsResult.ok && reviewsResult.data ? reviewsResult.data : [],
    activePopup: popupResult.ok && popupResult.data ? popupResult.data : null,
  };
}

export const useLandingData = () => {
  const router = useRouter();

  // 이미 로그인한 사용자는 공고 페이지로 리디렉션
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const authed =
      !!localStorage.getItem('userId') || !!localStorage.getItem('authToken');
    if (authed) router.replace('/post');
  }, [router]);

  const { data, isLoading } = useQuery({
    queryKey: ['landing'],
    queryFn: fetchLandingData,
    staleTime: 1000 * 60 * 5, // 5분
  });

  return {
    stats: data?.stats ?? null,
    topReviews: data?.topReviews ?? [],
    activePopup: data?.activePopup ?? null,
    isLoading,
  };
};
