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

export async function getLandingStatsAction(): Promise<{
  ok: boolean;
  message: string;
  data?: LandingStats;
}> {
  try {
    const supabase = await createClient();

    // 병렬로 모든 통계 조회
    const [memberResult, postResult, managerResult, reviewResult] =
      await Promise.all([
        // 등록 스탭 수 (member 역할)
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'member'),

        // 활성 공고 수 (recruiting 또는 urgent 상태)
        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .in('status', ['recruiting', 'urgent']),

        // 파트너 업체 수 (manager 역할)
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'manager'),

        // 평균 평점 조회
        supabase.from('app_reviews').select('rating'),
      ]);

    // 평균 평점 계산 (소수점 1자리)
    let averageRating: number | null = null;
    if (reviewResult.data && reviewResult.data.length > 0) {
      const sum = reviewResult.data.reduce(
        (acc, review) => acc + review.rating,
        0
      );
      averageRating =
        Math.round((sum / reviewResult.data.length) * 10) / 10;
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
    return {
      ok: false,
      message: '통계 조회 중 오류가 발생했습니다.',
    };
  }
}

// 관리자가 선택한 featured 리뷰 가져오기 (최대 10개)
export async function getTopReviewsAction(): Promise<{
  ok: boolean;
  message: string;
  data?: LandingReview[];
}> {
  try {
    const supabase = await createClient();

    // featured 리뷰만 최신순으로 최대 10개 조회
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

    // 사용자 정보 조회
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
    return {
      ok: false,
      message: '리뷰 조회 중 오류가 발생했습니다.',
      data: [],
    };
  }
}
