import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * 계정 삭제는 API 라우트로 처리합니다.
 * Server Action ID 불일치로 인한 "Failed to find Server Action" 오류를 피하기 위함.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = user.id;

    await supabase.from('personal_schedules').delete().eq('user_id', userId);
    await supabase.from('member_schedules').delete().eq('member_id', userId);
    await supabase.from('app_reviews').delete().eq('user_id', userId);
    await supabase.from('posts').delete().eq('author_id', userId);
    await supabase.from('profiles').delete().eq('user_id', userId);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, message: '서버 설정 오류입니다. 관리자에게 문의하세요.' },
        { status: 500 }
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: deleteUserError } =
      await adminClient.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('[delete-account] auth delete error:', deleteUserError);
      return NextResponse.json(
        { ok: false, message: '계정 삭제에 실패했습니다. 관리자에게 문의하세요.' },
        { status: 500 }
      );
    }

    await supabase.auth.signOut();

    return NextResponse.json({
      ok: true,
      message: '계정이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('[delete-account] unexpected error:', error);
    return NextResponse.json(
      { ok: false, message: '계정 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
