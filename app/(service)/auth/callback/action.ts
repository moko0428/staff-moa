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

export async function handleAuthCallback(
  params: CallbackParams
): Promise<CallbackResult> {
  const supabase = (await createClient()) as unknown as SupabaseClient;

  try {
    if (params.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (!error) return { ok: true, redirectTo: '/post' };
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
