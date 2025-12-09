'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

export default function AuthButtons() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const syncAuth = () => {
      try {
        if (typeof window === 'undefined') return;
        const userId = localStorage.getItem('userId');
        setIsAuthenticated(!!userId);
      } catch {
        setIsAuthenticated(false);
      }
    };

    syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener('auth-changed', syncAuth);

    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('auth-changed', syncAuth);
    };
  }, []);

  const clearAuthCookies = () => {
    const expire = 'Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = `userId=; path=/; expires=${expire}`;
    document.cookie = `authToken=; path=/; expires=${expire}`;
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      // 기존 auth 플래그가 있다면 제거
      localStorage.removeItem('auth');
      clearAuthCookies();
      setIsAuthenticated(false);
      // 동일 탭 실시간 반영
      window.dispatchEvent(new Event('auth-changed'));
      window.location.href = '/';
    } catch {
      // noop
    }
  };

  return (
    <div className="shrink-0 flex items-center gap-2">
      {isAuthenticated ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            asChild
            className="hidden md:inline-flex"
          >
            <Link href="/profile">프로필 관리</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" size="sm" type="button" asChild>
            <Link href="/auth/login" className="text-white">
              로그인
            </Link>
          </Button>
          <Button variant="outline" size="sm" type="button" asChild>
            <Link href="/auth/join" className="text-primary">
              회원가입
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
