import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isAuthed(req: NextRequest) {
  // 쿠키에 userId 또는 authToken이 있으면 인증된 것으로 간주
  const userId = req.cookies.get('userId')?.value;
  const token = req.cookies.get('authToken')?.value;
  return Boolean(userId || token);
}

function getRole(req: NextRequest) {
  return req.cookies.get('userRole')?.value;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = isAuthed(req);
  const role = getRole(req);

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

  return NextResponse.next();
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
