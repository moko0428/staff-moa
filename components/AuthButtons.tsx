'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { signOutAction } from '@/app/(service)/auth/action';

export default function AuthButtons({ isHome }: { isHome: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const syncAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setIsAuthenticated(Boolean(data.user));
      } catch {
        setIsAuthenticated(false);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      syncAuth();
    });

    syncAuth();

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    startTransition(async () => {
      try {
        await signOutAction();
      } finally {
        // 세션 쿠키 반영을 위해 전체 리로드
        window.location.href = '/';
      }
    });
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
            disabled={isPending}
          >
            <LogOut className="size-4" />
          </Button>
        </>
      ) : (
        <Button variant="outline" size="sm" type="button" asChild>
          <Link
            href="/auth/login"
            className={cn(
              'text-sm font-medium',
              isHome ? 'text-white' : 'text-primary'
            )}
          >
            로그인
          </Link>
        </Button>
      )}
    </div>
  );
}
