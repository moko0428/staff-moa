'use server';

import { createClient } from '@/utils/supabase/server';

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

function normalizeKeyword(input: string): string {
  return input.trim().toLowerCase();
}

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
      .select('post_id')
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
      .select('post_id')
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

// ===== 관심 키워드 =====

export async function getFavoriteKeywordsAction(): Promise<ActionResult<string[]>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    const { data, error } = await supabase
      .from('favorites_keywords')
      .select('keyword')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getFavoriteKeywordsAction] Supabase select error', error);
      return {
        ok: false,
        message: '관심 키워드를 불러오는데 실패했습니다.',
        data: [],
      };
    }

    return {
      ok: true,
      message: '',
      data: (data || []).map((d) => d.keyword as string).filter(Boolean),
    };
  } catch (err) {
    console.error('[getFavoriteKeywordsAction] Unexpected error', err);
    return {
      ok: false,
      message: '관심 키워드를 불러오는 중 오류가 발생했습니다.',
      data: [],
    };
  }
}

export async function addFavoriteKeywordAction(
  keyword: string
): Promise<ActionResult> {
  try {
    const normalized = normalizeKeyword(keyword);
    if (!normalized) return { ok: false, message: '키워드를 입력해주세요.' };

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    const { error } = await supabase
      .from('favorites_keywords')
      .upsert(
        { user_id: userData.user.id, keyword: normalized },
        { onConflict: 'user_id,keyword', ignoreDuplicates: true }
      );

    if (error) {
      console.error('[addFavoriteKeywordAction] Supabase upsert error', error);
      return { ok: false, message: '관심 키워드 추가에 실패했습니다.' };
    }

    return { ok: true, message: '관심 키워드가 추가되었습니다.' };
  } catch (err) {
    console.error('[addFavoriteKeywordAction] Unexpected error', err);
    return { ok: false, message: '관심 키워드 추가 중 오류가 발생했습니다.' };
  }
}

export async function removeFavoriteKeywordAction(
  keyword: string
): Promise<ActionResult> {
  try {
    const normalized = normalizeKeyword(keyword);
    if (!normalized) return { ok: false, message: '올바른 키워드가 아닙니다.' };

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    const { error } = await supabase
      .from('favorites_keywords')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('keyword', normalized);

    if (error) {
      console.error('[removeFavoriteKeywordAction] Supabase delete error', error);
      return { ok: false, message: '관심 키워드 삭제에 실패했습니다.' };
    }

    return { ok: true, message: '관심 키워드가 삭제되었습니다.' };
  } catch (err) {
    console.error('[removeFavoriteKeywordAction] Unexpected error', err);
    return { ok: false, message: '관심 키워드 삭제 중 오류가 발생했습니다.' };
  }
}

// 최근 공고에서 사용된 키워드(추천용)
export async function getActivePostKeywordsAction(): Promise<ActionResult<string[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('posts')
      .select('keywords, created_at')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) {
      console.error('[getActivePostKeywordsAction] Supabase select error', error);
      return { ok: false, message: '키워드를 불러오는데 실패했습니다.', data: [] };
    }

    const set = new Set<string>();
    for (const row of data || []) {
      const arr = (row as { keywords?: string[] | null }).keywords;
      if (Array.isArray(arr)) {
        arr.forEach((k) => {
          const nk = normalizeKeyword(String(k));
          if (nk) set.add(nk);
        });
      }
    }

    return { ok: true, message: '', data: Array.from(set).slice(0, 100) };
  } catch (err) {
    console.error('[getActivePostKeywordsAction] Unexpected error', err);
    return { ok: false, message: '키워드를 불러오는 중 오류가 발생했습니다.', data: [] };
  }
}

// ===== 매니저 팔로우 =====

export async function getFollowedManagersAction(): Promise<ActionResult<string[]>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    const { data, error } = await supabase
      .from('manager_follows')
      .select('manager_id')
      .eq('follower_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getFollowedManagersAction] Supabase select error', error);
      return { ok: false, message: '팔로우 목록을 불러오는데 실패했습니다.', data: [] };
    }

    return {
      ok: true,
      message: '',
      data: (data || []).map((d) => d.manager_id as string).filter(Boolean),
    };
  } catch (err) {
    console.error('[getFollowedManagersAction] Unexpected error', err);
    return { ok: false, message: '팔로우 목록을 불러오는 중 오류가 발생했습니다.', data: [] };
  }
}

export async function followManagerAction(managerId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }
    if (!managerId) return { ok: false, message: '올바른 매니저 ID가 아닙니다.' };
    if (managerId === userData.user.id) {
      return { ok: false, message: '본인은 팔로우할 수 없습니다.' };
    }

    const { error } = await supabase
      .from('manager_follows')
      .upsert(
        { follower_id: userData.user.id, manager_id: managerId },
        { onConflict: 'follower_id,manager_id', ignoreDuplicates: true }
      );

    if (error) {
      console.error('[followManagerAction] Supabase upsert error', error);
      return { ok: false, message: '팔로우에 실패했습니다.' };
    }

    return { ok: true, message: '매니저를 팔로우했습니다.' };
  } catch (err) {
    console.error('[followManagerAction] Unexpected error', err);
    return { ok: false, message: '팔로우 중 오류가 발생했습니다.' };
  }
}

export async function unfollowManagerAction(managerId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }
    if (!managerId) return { ok: false, message: '올바른 매니저 ID가 아닙니다.' };

    const { error } = await supabase
      .from('manager_follows')
      .delete()
      .eq('follower_id', userData.user.id)
      .eq('manager_id', managerId);

    if (error) {
      console.error('[unfollowManagerAction] Supabase delete error', error);
      return { ok: false, message: '언팔로우에 실패했습니다.' };
    }

    return { ok: true, message: '팔로우를 취소했습니다.' };
  } catch (err) {
    console.error('[unfollowManagerAction] Unexpected error', err);
    return { ok: false, message: '언팔로우 중 오류가 발생했습니다.' };
  }
}

// 팔로우/키워드 기반 추천 공고 조회 (포스트 탭용)
export async function getMatchedPostsForFavoritesAction(): Promise<
  ActionResult<Array<Record<string, unknown>>>
> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    // 1) 관심 키워드
    const { data: kwRows } = await supabase
      .from('favorites_keywords')
      .select('keyword')
      .eq('user_id', userData.user.id);
    const keywords = (kwRows || [])
      .map((r) => normalizeKeyword(String(r.keyword)))
      .filter(Boolean);

    // 2) 팔로우 매니저
    const { data: followRows } = await supabase
      .from('manager_follows')
      .select('manager_id')
      .eq('follower_id', userData.user.id);
    const managerIds = (followRows || [])
      .map((r) => r.manager_id as string)
      .filter(Boolean);

    const results: Array<Record<string, unknown>> = [];

    // 키워드 매칭 공고
    if (keywords.length > 0) {
      const { data: byKeywords } = await supabase
        .from('posts')
        .select('*')
        .overlaps('keywords', keywords)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(100);
      if (byKeywords) results.push(...(byKeywords as Array<Record<string, unknown>>));
    }

    // 팔로우 매니저 공고
    if (managerIds.length > 0) {
      const { data: byManagers } = await supabase
        .from('posts')
        .select('*')
        .in('author_id', managerIds)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(100);
      if (byManagers) results.push(...(byManagers as Array<Record<string, unknown>>));
    }

    // post_id 기준 dedupe
    const seen = new Set<string>();
    const deduped = results.filter((p) => {
      const id = String((p as { post_id?: unknown }).post_id ?? '');
      if (!id) return false;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return { ok: true, message: '', data: deduped };
  } catch (err) {
    console.error('[getMatchedPostsForFavoritesAction] Unexpected error', err);
    return { ok: false, message: '매칭 공고를 불러오는 중 오류가 발생했습니다.', data: [] };
  }
}

// 추천 매니저 목록(최근 공고 기준)
export async function getActiveManagersFromPostsAction(): Promise<
  ActionResult<
    Array<{
      managerId: string;
      managerName: string;
      avatar: string | null;
      followerCount: number;
    }>
  >
> {
  try {
    const supabase = await createClient();
    // profiles 기반으로 "role=manager" 유저만 노출
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, name, avatar, role')
      .eq('role', 'manager')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('[getActiveManagersFromPostsAction] Supabase select error', error);
      return { ok: false, message: '매니저 목록을 불러오는데 실패했습니다.', data: [] };
    }

    // 팔로워 수 집계 (manager_follows 기준)
    const { data: followRows, error: followError } = await supabase
      .from('manager_follows')
      .select('manager_id');

    if (followError) {
      console.error('[getActiveManagersFromPostsAction] Follow select error', followError);
    }

    const followerCountMap = new Map<string, number>();
    for (const row of followRows || []) {
      const managerId = String((row as { manager_id?: unknown }).manager_id ?? '');
      if (!managerId) continue;
      followerCountMap.set(managerId, (followerCountMap.get(managerId) || 0) + 1);
    }

    const map = new Map<string, { managerName: string; avatar: string | null; followerCount: number }>();
    for (const row of data || []) {
      const r = row as { user_id: string; name: string | null; avatar: string | null; role: string };
      if (!r.user_id) continue;
      if (!map.has(r.user_id)) {
        map.set(r.user_id, {
          managerName: r.name || '매니저',
          avatar: r.avatar ?? null,
          followerCount: followerCountMap.get(r.user_id) || 0,
        });
      }
    }

    return {
      ok: true,
      message: '',
      data: Array.from(map.entries())
        .map(([managerId, v]) => ({
          managerId,
          managerName: v.managerName,
          avatar: v.avatar,
          followerCount: v.followerCount,
        }))
        .sort((a, b) => b.followerCount - a.followerCount),
    };
  } catch (err) {
    console.error('[getActiveManagersFromPostsAction] Unexpected error', err);
    return { ok: false, message: '매니저 목록을 불러오는 중 오류가 발생했습니다.', data: [] };
  }
}

export async function getProfileForModalAction(
  userId: string
): Promise<
  ActionResult<{
    id: string;
    name: string | null;
    email: string | null;
    photo: string | null;
    role: string;
    introduction: string | null;
    attendanceScore: number | null;
    followerCount: number;
    companyName: string | null;
    companyVerifyStatus: string | null;
    coverImage: string | null;
  }>
> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, name, email, avatar, role, bio, attendance_score, company_name, company_verify_status, cover_image')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[getProfileForModalAction] Supabase select error', error);
      return { ok: false, message: '프로필을 불러오는데 실패했습니다.' };
    }

    // 팔로워 수 (manager_follows 기준)
    const { count: followerCount, error: countError } = await supabase
      .from('manager_follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('manager_id', userId);

    if (countError) {
      console.error('[getProfileForModalAction] Count error', countError);
    }

    return {
      ok: true,
      message: '',
      data: {
        id: data.user_id as string,
        name: (data.name as string | null) ?? null,
        email: (data.email as string | null) ?? null,
        photo: (data.avatar as string | null) ?? null,
        role: (data.role as string) ?? 'member',
        introduction: (data.bio as string | null) ?? null,
        attendanceScore: (data.attendance_score as number | null) ?? null,
        followerCount: followerCount ?? 0,
        companyName: (data.company_name as string | null) ?? null,
        companyVerifyStatus: (data.company_verify_status as string | null) ?? null,
        coverImage: (data.cover_image as string | null) ?? null,
      },
    };
  } catch (err) {
    console.error('[getProfileForModalAction] Unexpected error', err);
    return { ok: false, message: '프로필을 불러오는 중 오류가 발생했습니다.' };
  }
}
