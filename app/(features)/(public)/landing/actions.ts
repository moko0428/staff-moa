'use server';

import { createClient } from '@/utils/supabase/server';

export type LandingStats = {
  memberCount: number;
  activePostCount: number;
  managerCount: number;
  averageRating: number | null;
};

export type LandingReview = {
  review_id: string;
  rating: number;
  content: string;
  created_at: string;
  user_name: string | null;
  user_avatar: string | null;
};

export const getLandingStatsAction = async (): Promise<{
  ok: boolean;
  message: string;
  data?: LandingStats;
}> => {
  try {
    const supabase = await createClient();

    const [memberResult, postResult, managerResult, reviewResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member'),
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .in('status', ['recruiting', 'urgent']),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'manager'),
      supabase.from('app_reviews').select('rating'),
    ]);

    let averageRating: number | null = null;
    if (reviewResult.data && reviewResult.data.length > 0) {
      const sum = reviewResult.data.reduce((acc, review) => acc + review.rating, 0);
      averageRating = Math.round((sum / reviewResult.data.length) * 10) / 10;
    }

    return {
      ok: true,
      message: '통계 조회 성공',
      data: {
        memberCount: memberResult.count ?? 0,
        activePostCount: postResult.count ?? 0,
        managerCount: managerResult.count ?? 0,
        averageRating,
      },
    };
  } catch (error) {
    console.error('Failed to fetch landing stats:', error);
    return { ok: false, message: '통계 조회 중 오류가 발생했습니다.' };
  }
};

export const getTopReviewsAction = async (): Promise<{
  ok: boolean;
  message: string;
  data?: LandingReview[];
}> => {
  try {
    const supabase = await createClient();

    const { data: reviews, error } = await supabase
      .from('app_reviews')
      .select('review_id, rating, content, created_at, user_id')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[getTopReviewsAction] Error:', error);
      return { ok: false, message: '리뷰 조회 중 오류가 발생했습니다.', data: [] };
    }

    if (!reviews || reviews.length === 0) {
      return { ok: true, message: '', data: [] };
    }

    const userIds = reviews.map((r) => r.user_id);
    const { data: users } = await supabase
      .from('profiles')
      .select('user_id, name, avatar')
      .in('user_id', userIds);

    const usersMap = new Map(users?.map((u) => [u.user_id, u]) || []);

    const result: LandingReview[] = reviews.map((review) => {
      const user = usersMap.get(review.user_id);
      return {
        review_id: review.review_id,
        rating: review.rating,
        content: review.content,
        created_at: review.created_at,
        user_name: user?.name || null,
        user_avatar: user?.avatar || null,
      };
    });

    return { ok: true, message: '', data: result };
  } catch (error) {
    console.error('Failed to fetch top reviews:', error);
    return { ok: false, message: '리뷰 조회 중 오류가 발생했습니다.', data: [] };
  }
};
