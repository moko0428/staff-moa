import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from './utils/supabase/middleware';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Supabase 세션 기반으로 사용자/역할 확인
  const { supabase, response } = createClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const authed = Boolean(user);
  const role = (user?.user_metadata as { role?: string } | undefined)?.role;

  // 인증된 사용자는 랜딩 관련 경로 접근 시 /post로 이동
  if (authed && (pathname === '/' || pathname.startsWith('/landing'))) {
    const url = req.nextUrl.clone();
    url.pathname = '/post';
    return NextResponse.redirect(url);
  }

  // 역할 기반 접근 제어
  const requireManager =
    pathname.startsWith('/manager') || pathname.startsWith('/my-post');
  const requireAdmin = pathname.startsWith('/admin');
  const requireWorker = pathname.startsWith('/worker');

  if (requireAdmin && role !== 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (requireManager && role !== 'manager') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (requireWorker && role !== 'member') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/landing/:path*',
    '/post/:path*',
    '/admin/:path*',
    '/manager/:path*',
    '/my-post/:path*',
    '/worker/:path*',
  ],
};
