'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { notifyAdminsNewUserAction } from '@/app/(protected)/notification/actions';

/**
 * profiles 테이블에 행이 없을 경우에만 INSERT.
 * @returns true = 신규 사용자 (방금 생성됨), false = 기존 사용자
 */
export const ensureProfile = async (supabase: SupabaseClient): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: existing } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (existing) return false;

    const meta = user.user_metadata ?? {};
    const name =
      meta.full_name ||
      meta.name ||
      meta.preferred_username ||
      meta.user_name ||
      '사용자';
    const email = user.email || meta.email || '';
    const avatar = meta.avatar_url || meta.picture || null;

    const isKakao = user.app_metadata?.provider === 'kakao';
    const kakao_id = isKakao && email ? email.split('@')[0] : null;
    const role = (meta.role as 'member' | 'pending_manager') ?? 'member';

    const { error } = await supabase.from('profiles').insert({
      user_id: user.id,
      email,
      name,
      avatar,
      kakao_id,
      role,
      is_banned: false,
      attendance_score: 0,
    });

    if (error) {
      console.error('[ensureProfile] insert failed', error);
      return false;
    }

    // 인증 완료 후 어드민 알림 (fire-and-forget)
    notifyAdminsNewUserAction({ userName: name, userRole: role })
      .catch((err) => console.error('[ensureProfile] admin notification error', err));

    return true;
  } catch (err) {
    console.error('[ensureProfile] unexpected error', err);
    return false;
  }
};
