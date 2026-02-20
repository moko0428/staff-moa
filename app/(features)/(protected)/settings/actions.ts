'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export type ProfileVisibility = {
  email?: boolean;
  phone?: boolean;
  kakaoId?: boolean;
  age?: boolean;
  gender?: boolean;
  experiences?: boolean;
  documents?: boolean;
  certificates?: boolean;
  languages?: boolean;
};

export type SubmitReviewInput = {
  rating: number;
  content: string;
};

export async function submitReviewAction(
  input: SubmitReviewInput
): Promise<{ ok: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: '로그인이 필요합니다.' };

    if (input.rating < 1 || input.rating > 5) {
      return { ok: false, message: '별점은 1~5점 사이여야 합니다.' };
    }
    if (!input.content.trim()) {
      return { ok: false, message: '리뷰 내용을 입력해주세요.' };
    }

    const { data: existingReview } = await supabase
      .from('app_reviews')
      .select('review_id')
      .eq('user_id', user.id)
      .single();

    if (existingReview) {
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
    }

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: '로그인이 필요합니다.' };

    const { data, error } = await supabase
      .from('app_reviews')
      .select('rating, content')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch review:', error);
      return { ok: false, message: '리뷰 조회에 실패했습니다.' };
    }

    return { ok: true, message: '조회 성공', data: data || null };
  } catch (error) {
    console.error('Get review error:', error);
    return { ok: false, message: '오류가 발생했습니다.' };
  }
}

export async function getProfileVisibilityAction(): Promise<{
  ok: boolean;
  message: string;
  data?: ProfileVisibility | null;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: '로그인이 필요합니다.' };

    const { data, error } = await supabase
      .from('profiles')
      .select('profile_visibility')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Failed to fetch profile visibility:', error);
      return { ok: false, message: '설정을 불러오는데 실패했습니다.' };
    }

    return { ok: true, message: '', data: data?.profile_visibility as ProfileVisibility | null };
  } catch (error) {
    console.error('Get profile visibility error:', error);
    return { ok: false, message: '오류가 발생했습니다.' };
  }
}

export async function updateProfileVisibilityAction(
  visibility: ProfileVisibility
): Promise<{ ok: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: '로그인이 필요합니다.' };

    const { error } = await supabase
      .from('profiles')
      .update({ profile_visibility: visibility })
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to update profile visibility:', error);
      return { ok: false, message: '설정 저장에 실패했습니다.' };
    }

    return { ok: true, message: '설정이 저장되었습니다.' };
  } catch (error) {
    console.error('Update profile visibility error:', error);
    return { ok: false, message: '오류가 발생했습니다.' };
  }
}

export async function deleteAccountAction(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: '로그인이 필요합니다.' };

    const userId = user.id;

    await supabase.from('personal_schedules').delete().eq('user_id', userId);
    await supabase.from('member_schedules').delete().eq('member_id', userId);
    await supabase.from('app_reviews').delete().eq('user_id', userId);
    await supabase.from('posts').delete().eq('author_id', userId);
    await supabase.from('profiles').delete().eq('user_id', userId);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return { ok: false, message: '서버 설정 오류입니다. 관리자에게 문의하세요.' };
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error('[deleteAccountAction] auth delete error:', deleteUserError);
      return { ok: false, message: '계정 삭제에 실패했습니다. 관리자에게 문의하세요.' };
    }

    await supabase.auth.signOut();

    return { ok: true, message: '계정이 삭제되었습니다.' };
  } catch (error) {
    console.error('[deleteAccountAction] unexpected error:', error);
    return { ok: false, message: '계정 삭제 중 오류가 발생했습니다.' };
  }
}
