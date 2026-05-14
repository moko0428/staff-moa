import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ensureProfile } from '@/app/auth/utils/ensure-profile';

export const GET = async (request: NextRequest) => {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const isNewUser = await ensureProfile(supabase as unknown as SupabaseClient);
      const returnCookie = request.cookies.get('auth_return_url')?.value;
      const safeReturn =
        returnCookie &&
        returnCookie.startsWith('/') &&
        !returnCookie.includes('://')
          ? decodeURIComponent(returnCookie)
          : '/post';
      const redirectUrl = isNewUser ? `${origin}/profile?welcome=1` : `${origin}${safeReturn}`;
      const res = NextResponse.redirect(redirectUrl);
      res.cookies.delete('auth_return_url');
      return res;
    }
    return NextResponse.redirect(`${origin}/auth`);
  }

  if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({
      type: type === 'magiclink' ? 'magiclink' : 'email',
      token_hash,
    });
    if (!error) {
      const isNewUser = await ensureProfile(supabase as unknown as SupabaseClient);
      return NextResponse.redirect(`${origin}${isNewUser ? '/profile?welcome=1' : '/post'}`);
    }
    return NextResponse.redirect(`${origin}/auth`);
  }

  return NextResponse.redirect(`${origin}/auth`);
};
