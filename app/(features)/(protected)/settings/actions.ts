'use server';

import { createClient } from '@/utils/supabase/server';

export type SubmitReviewInput = {
  rating: number;
  content: string;
};

export async function submitReviewAction(
  input: SubmitReviewInput
): Promise<{ ok: boolean; message: string }> {
  try {
    const supabase = await createClient();

    // 인증된 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 별점 유효성 검사
    if (input.rating < 1 || input.rating > 5) {
      return { ok: false, message: '별점은 1~5점 사이여야 합니다.' };
    }

    // 내용 유효성 검사
    if (!input.content.trim()) {
      return { ok: false, message: '리뷰 내용을 입력해주세요.' };
    }

    // 기존 리뷰가 있는지 확인 (사용자당 1개 리뷰만 허용)
    const { data: existingReview } = await supabase
      .from('app_reviews')
      .select('review_id')
      .eq('user_id', user.id)
      .single();

    if (existingReview) {
      // 기존 리뷰 업데이트
      const { error } = await supabase
        .from('app_reviews')
        .update({
          rating: input.rating,
          content: input.content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to update review:', error);
        return { ok: false, message: '리뷰 수정에 실패했습니다.' };
      }

      return { ok: true, message: '리뷰가 수정되었습니다.' };
    } else {
      // 새 리뷰 생성
      const { error } = await supabase.from('app_reviews').insert({
        user_id: user.id,
        rating: input.rating,
        content: input.content.trim(),
      });

      if (error) {
        console.error('Failed to submit review:', error);
        return { ok: false, message: '리뷰 제출에 실패했습니다.' };
      }

      return { ok: true, message: '리뷰가 제출되었습니다.' };
    }
  } catch (error) {
    console.error('Submit review error:', error);
    return { ok: false, message: '오류가 발생했습니다.' };
  }
}

export async function getMyReviewAction(): Promise<{
  ok: boolean;
  message: string;
  data?: { rating: number; content: string } | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('app_reviews')
      .select('rating, content')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Failed to fetch review:', error);
      return { ok: false, message: '리뷰 조회에 실패했습니다.' };
    }

    return {
      ok: true,
      message: '조회 성공',
      data: data || null,
    };
  } catch (error) {
    console.error('Get review error:', error);
    return { ok: false, message: '오류가 발생했습니다.' };
  }
}
