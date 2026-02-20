import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const visibility = body as ProfileVisibility;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ profile_visibility: visibility })
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to update profile visibility:', error);
      return NextResponse.json({ ok: false, message: '설정 저장에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: '설정이 저장되었습니다.' });
  } catch (e) {
    console.error('Update profile visibility error:', e);
    return NextResponse.json({ ok: false, message: '오류가 발생했습니다.' }, { status: 500 });
  }
}
