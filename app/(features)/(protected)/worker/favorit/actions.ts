'use server';

import { createClient } from '@/utils/supabase/server';

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

// 관심목록 추가
export async function addFavoriteAction(
  postId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    const postIdNum = Number(postId);
    if (isNaN(postIdNum)) {
      return { ok: false, message: '올바른 공고 ID가 아닙니다.' };
    }

    // 이미 관심목록에 있는지 확인
    const { data: existing } = await supabase
      .from('favorites_posts')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('post_id', postIdNum)
      .single();

    if (existing) {
      return { ok: false, message: '이미 관심목록에 추가된 공고입니다.' };
    }

    // 관심목록에 추가
    const { error } = await supabase
      .from('favorites_posts')
      .insert({
        user_id: userData.user.id,
        post_id: postIdNum,
      });

    if (error) {
      console.error('[addFavoriteAction] Supabase insert error', error);
      return {
        ok: false,
        message: '관심목록 추가에 실패했습니다. 다시 시도해주세요.',
      };
    }

    return { ok: true, message: '관심목록에 추가되었습니다.' };
  } catch (err) {
    console.error('[addFavoriteAction] Unexpected error', err);
    return {
      ok: false,
      message: '관심목록 추가 중 오류가 발생했습니다.',
    };
  }
}

// 관심목록 제거
export async function removeFavoriteAction(
  postId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    const postIdNum = Number(postId);
    if (isNaN(postIdNum)) {
      return { ok: false, message: '올바른 공고 ID가 아닙니다.' };
    }

    const { error } = await supabase
      .from('favorites_posts')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('post_id', postIdNum);

    if (error) {
      console.error('[removeFavoriteAction] Supabase delete error', error);
      return {
        ok: false,
        message: '관심목록 제거에 실패했습니다. 다시 시도해주세요.',
      };
    }

    return { ok: true, message: '관심목록에서 제거되었습니다.' };
  } catch (err) {
    console.error('[removeFavoriteAction] Unexpected error', err);
    return {
      ok: false,
      message: '관심목록 제거 중 오류가 발생했습니다.',
    };
  }
}

// 관심목록 조회 (사용자의 관심목록 post_id 목록)
export async function getFavoritesAction(): Promise<
  ActionResult<string[]>
> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    const { data, error } = await supabase
      .from('favorites_posts')
      .select('post_id')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getFavoritesAction] Supabase select error', error);
      return {
        ok: false,
        message: '관심목록을 불러오는데 실패했습니다.',
        data: [],
      };
    }

    const postIds = (data || []).map((item) => item.post_id.toString());
    return { ok: true, message: '', data: postIds };
  } catch (err) {
    console.error('[getFavoritesAction] Unexpected error', err);
    return {
      ok: false,
      message: '관심목록을 불러오는 중 오류가 발생했습니다.',
      data: [],
    };
  }
}

// 관심목록 공고 전체 조회 (JOIN으로 포스트 정보 포함)
export async function getFavoritePostsAction(): Promise<
  ActionResult<Array<Record<string, unknown>>>
> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    const { data, error } = await supabase
      .from('favorites_posts')
      .select(`
        post_id,
        created_at,
        posts (*)
      `)
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getFavoritePostsAction] Supabase select error', error);
      return {
        ok: false,
        message: '관심목록을 불러오는데 실패했습니다.',
        data: [],
      };
    }

    // posts 데이터 추출
    const posts = (data || [])
      .map((item) => {
        const post = item.posts as unknown;
        if (post && typeof post === 'object' && post !== null) {
          return post as Record<string, unknown>;
        }
        return null;
      })
      .filter((post): post is Record<string, unknown> => post !== null);

    return { ok: true, message: '', data: posts };
  } catch (err) {
    console.error('[getFavoritePostsAction] Unexpected error', err);
    return {
      ok: false,
      message: '관심목록을 불러오는 중 오류가 발생했습니다.',
      data: [],
    };
  }
}

// 특정 포스트가 관심목록에 있는지 확인
export async function checkFavoriteAction(
  postId: string
): Promise<ActionResult<boolean>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      return { ok: true, message: '', data: false };
    }

    const postIdNum = Number(postId);
    if (isNaN(postIdNum)) {
      return { ok: true, message: '', data: false };
    }

    const { data, error } = await supabase
      .from('favorites_posts')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('post_id', postIdNum)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116은 "no rows returned" 에러
      console.error('[checkFavoriteAction] Supabase select error', error);
      return { ok: true, message: '', data: false };
    }

    return { ok: true, message: '', data: !!data };
  } catch (err) {
    console.error('[checkFavoriteAction] Unexpected error', err);
    return { ok: true, message: '', data: false };
  }
}
