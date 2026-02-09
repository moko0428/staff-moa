'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase service role 환경변수가 설정되지 않았습니다.');
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface AppReview {
  review_id: string;
  user_id: string;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_email: string | null;
  user_avatar: string | null;
  is_featured: boolean;
}

export interface ReviewStats {
  totalCount: number;
  averageRating: number;
  ratingCounts: Record<number, number>;
}

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

// 모든 앱 리뷰 가져오기 (관리자용)
export async function fetchAppReviewsAction(): Promise<
  ActionResult<AppReview[]>
> {
  try {
    const { data: reviews, error } = await adminClient
      .from('app_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[fetchAppReviewsAction] Error:', error);
      return { ok: false, message: '리뷰 조회 중 오류가 발생했습니다.', data: [] };
    }

    if (!reviews || reviews.length === 0) {
      return { ok: true, message: '', data: [] };
    }

    // 사용자 정보 조회
    const userIds = [...new Set(reviews.map((r) => r.user_id))];
    const { data: users } = await adminClient
      .from('profiles')
      .select('user_id, name, email, avatar')
      .in('user_id', userIds);

    const usersMap = new Map(users?.map((u) => [u.user_id, u]) || []);

    const result: AppReview[] = reviews.map((review) => {
      const user = usersMap.get(review.user_id);
      return {
        review_id: review.review_id,
        user_id: review.user_id,
        rating: review.rating,
        content: review.content,
        created_at: review.created_at,
        updated_at: review.updated_at,
        user_name: user?.name || null,
        user_email: user?.email || null,
        user_avatar: user?.avatar || null,
        is_featured: review.is_featured ?? false,
      };
    });

    return { ok: true, message: '', data: result };
  } catch (err) {
    console.error('[fetchAppReviewsAction] Unexpected error:', err);
    return { ok: false, message: '리뷰 조회 중 오류가 발생했습니다.', data: [] };
  }
}

// 랜딩 페이지 노출 여부 토글 (관리자용)
export async function toggleReviewFeaturedAction(
  reviewId: string,
  isFeatured: boolean
): Promise<ActionResult> {
  try {
    // 현재 featured 리뷰 개수 확인 (최대 10개)
    if (isFeatured) {
      const { data: featuredReviews, error: countError } = await adminClient
        .from('app_reviews')
        .select('review_id')
        .eq('is_featured', true);

      if (countError) {
        console.error('[toggleReviewFeaturedAction] Count error:', countError);
        return { ok: false, message: '리뷰 조회 중 오류가 발생했습니다.' };
      }

      if (featuredReviews && featuredReviews.length >= 10) {
        return { ok: false, message: '랜딩 페이지에 노출할 수 있는 리뷰는 최대 10개입니다.' };
      }
    }

    const { error } = await adminClient
      .from('app_reviews')
      .update({ is_featured: isFeatured })
      .eq('review_id', reviewId);

    if (error) {
      console.error('[toggleReviewFeaturedAction] Error:', error);
      return { ok: false, message: '리뷰 상태 변경 중 오류가 발생했습니다.' };
    }

    return {
      ok: true,
      message: isFeatured
        ? '리뷰가 랜딩 페이지에 노출됩니다.'
        : '리뷰가 랜딩 페이지에서 제외되었습니다.',
    };
  } catch (err) {
    console.error('[toggleReviewFeaturedAction] Unexpected error:', err);
    return { ok: false, message: '리뷰 상태 변경 중 오류가 발생했습니다.' };
  }
}

// 현재 featured 리뷰 개수 조회
export async function getFeaturedReviewCountAction(): Promise<
  ActionResult<number>
> {
  try {
    const { data, error } = await adminClient
      .from('app_reviews')
      .select('review_id')
      .eq('is_featured', true);

    if (error) {
      console.error('[getFeaturedReviewCountAction] Error:', error);
      return { ok: false, message: '조회 중 오류가 발생했습니다.', data: 0 };
    }

    return { ok: true, message: '', data: data?.length || 0 };
  } catch (err) {
    console.error('[getFeaturedReviewCountAction] Unexpected error:', err);
    return { ok: false, message: '조회 중 오류가 발생했습니다.', data: 0 };
  }
}

// 리뷰 통계 가져오기
export async function fetchReviewStatsAction(): Promise<
  ActionResult<ReviewStats>
> {
  try {
    const { data: reviews, error } = await adminClient
      .from('app_reviews')
      .select('rating');

    if (error) {
      console.error('[fetchReviewStatsAction] Error:', error);
      return {
        ok: false,
        message: '통계 조회 중 오류가 발생했습니다.',
        data: { totalCount: 0, averageRating: 0, ratingCounts: {} },
      };
    }

    if (!reviews || reviews.length === 0) {
      return {
        ok: true,
        message: '',
        data: { totalCount: 0, averageRating: 0, ratingCounts: {} },
      };
    }

    const totalCount = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = Math.round((sum / totalCount) * 10) / 10;

    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const review of reviews) {
      ratingCounts[review.rating] = (ratingCounts[review.rating] || 0) + 1;
    }

    return {
      ok: true,
      message: '',
      data: { totalCount, averageRating, ratingCounts },
    };
  } catch (err) {
    console.error('[fetchReviewStatsAction] Unexpected error:', err);
    return {
      ok: false,
      message: '통계 조회 중 오류가 발생했습니다.',
      data: { totalCount: 0, averageRating: 0, ratingCounts: {} },
    };
  }
}

// 리뷰 삭제 (관리자용)
export async function deleteAppReviewAction(
  reviewId: string
): Promise<ActionResult> {
  try {
    const { error } = await adminClient
      .from('app_reviews')
      .delete()
      .eq('review_id', reviewId);

    if (error) {
      console.error('[deleteAppReviewAction] Error:', error);
      return { ok: false, message: '리뷰 삭제 중 오류가 발생했습니다.' };
    }

    return { ok: true, message: '리뷰가 삭제되었습니다.' };
  } catch (err) {
    console.error('[deleteAppReviewAction] Unexpected error:', err);
    return { ok: false, message: '리뷰 삭제 중 오류가 발생했습니다.' };
  }
}
