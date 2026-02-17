'use server';

import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type CallbackParams = {
  code?: string | null;
  token_hash?: string | null;
  type?: string | null;
};

type CallbackResult = {
  ok: boolean;
  redirectTo: string;
  message?: string;
};

/**
 * OAuth 로그인 후 profiles 레코드가 없으면 자동 생성
 */
async function ensureProfile(supabase: SupabaseClient) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 이미 profile이 있는지 확인
    const { data: existing } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (existing) return; // 이미 존재

    // OAuth 메타데이터에서 이름, 이메일, 프로필 사진 추출
    const meta = user.user_metadata ?? {};
    const name =
      meta.full_name ||
      meta.name ||
      meta.preferred_username ||
      meta.user_name ||
      '사용자';
    const email = user.email || meta.email || '';
    const avatar = meta.avatar_url || meta.picture || null;

    const { error } = await supabase.from('profiles').insert({
      user_id: user.id,
      email,
      name,
      avatar,
      role: 'member',
      is_banned: false,
      attendance_score: 50,
    });

    if (error) {
      console.error('[ensureProfile] insert failed', error);
    }
  } catch (err) {
    console.error('[ensureProfile] unexpected error', err);
  }
}

export async function handleAuthCallback(
  params: CallbackParams
): Promise<CallbackResult> {
  const supabase = (await createClient()) as unknown as SupabaseClient;

  try {
    if (params.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (!error) {
        await ensureProfile(supabase);
        return { ok: true, redirectTo: '/post' };
      }
      return {
        ok: false,
        redirectTo: '/auth/login',
        message: error.message,
      };
    }

    if (params.token_hash) {
      const { error } = await supabase.auth.verifyOtp({
        type: params.type === 'magiclink' ? 'magiclink' : 'email',
        token_hash: params.token_hash,
      });
      if (!error) return { ok: true, redirectTo: '/post' };
      return {
        ok: false,
        redirectTo: '/auth/login',
        message: error.message,
      };
    }

    return {
      ok: false,
      redirectTo: '/auth/login',
      message: '유효하지 않은 인증 링크입니다.',
    };
  } catch {
    return {
      ok: false,
      redirectTo: '/auth/login',
      message: '인증을 처리할 수 없습니다. 다시 시도해주세요.',
    };
  }
}
