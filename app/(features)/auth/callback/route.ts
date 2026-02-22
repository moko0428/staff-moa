import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

async function ensureProfile(supabase: SupabaseClient) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (existing) return;

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

    const { error } = await supabase.from('profiles').insert({
      user_id: user.id,
      email,
      name,
      avatar,
      kakao_id,
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

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await ensureProfile(supabase as unknown as SupabaseClient);
      return NextResponse.redirect(`${origin}/post`);
    }
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({
      type: type === 'magiclink' ? 'magiclink' : 'email',
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}/post`);
    }
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  return NextResponse.redirect(`${origin}/auth/login`);
}
