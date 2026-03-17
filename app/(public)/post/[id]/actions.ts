'use server';

import { createClient } from '@/utils/supabase/server';

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

export type PostInteraction = {
  isFavorite: boolean;
  hasApplied: boolean;
  hasReported: boolean;
};

/**
 * checkFavoriteAction + checkAppliedToPostAction + checkReportAction을
 * 단일 서버 액션 호출로 통합 (3콜 → 1콜)
 */
export async function getUserPostInteractionAction(
  postId: number
): Promise<ActionResult<PostInteraction>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return {
        ok: true,
        message: '',
        data: { isFavorite: false, hasApplied: false, hasReported: false },
      };
    }

    const userId = userData.user.id;

    const [favoriteResult, appliedResult, reportResult] = await Promise.all([
      supabase
        .from('favorites_posts')
        .select('post_id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle(),
      supabase
        .from('member_schedules')
        .select('member_schedule_id')
        .eq('post_id', postId)
        .eq('member_id', userId)
        .maybeSingle(),
      supabase
        .from('post_reports')
        .select('report_id')
        .eq('post_id', postId)
        .eq('reporter_id', userId)
        .maybeSingle(),
    ]);

    return {
      ok: true,
      message: '',
      data: {
        isFavorite: !!favoriteResult.data,
        hasApplied: !!appliedResult.data,
        hasReported: !!reportResult.data,
      },
    };
  } catch (err) {
    console.error('[getUserPostInteractionAction] Unexpected error', err);
    return {
      ok: true,
      message: '',
      data: { isFavorite: false, hasApplied: false, hasReported: false },
    };
  }
}
