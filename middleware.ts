import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from '@/utils/middleware/updateSession'; 

export async function middleware(req: NextRequest) {
  const [response, user] = await updateSession(req);

  const { pathname } = req.nextUrl;
  const authed = Boolean(user);
  const user_role = user?.role || user?.app_metadata?.role || user?.user_metadata?.role; 

  if (authed && pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/post'; 
    
    const redirectResponse = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie); 
    }
    return redirectResponse;
  }

  const requireAuthPaths = [
     '/manager', '/my-post', '/admin', '/worker', '/settings', '/profile'
  ];
  const isProtectedPath = requireAuthPaths.some(path => pathname.startsWith(path));

  if (!authed && isProtectedPath) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login'; 
    const redirectResponse = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  const requireManagerRole = pathname.startsWith('/manager') || pathname.startsWith('/my-post');
  const requireAdminRole = pathname.startsWith('/admin');
  const requireWorkerRole = pathname.startsWith('/worker'); 

  if (requireAdminRole && user_role !== 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = '/'; 
    const redirectResponse = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  if (requireManagerRole && user_role !== 'manager') {
    const url = req.nextUrl.clone();
    url.pathname = '/'; 
    const redirectResponse = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  // 워커(멤버) 전용 경로 체크
  if (requireWorkerRole && (user_role !== 'member' && user_role !== 'pending_manager')) {
    const url = req.nextUrl.clone();
    url.pathname = '/'; 
    const redirectResponse = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/manager/:path*',
    '/my-post/:path*',
    '/worker/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/auth/login',
  ],
};