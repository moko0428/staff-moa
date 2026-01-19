'use client';

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/app/components/ui/navigation-menu';
import {
  Briefcase,
  Calendar,
  Heart,
  ListChecks,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

import { useUserStore } from '@/store/useUserStore';
import { signOutAction } from '../(features)/auth/action';
import AuthButtons from './AuthButtons';

export default function HeaderNav() {
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const setRole = useUserStore((state) => state.setRole);
  const hydrateRole = useUserStore((state) => state.hydrateRole);
  const refreshRole = useUserStore((state) => state.refreshRole);
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isAuthPage =
    pathname.startsWith('/auth/login') || pathname.startsWith('/auth/join');
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isPendingManager = role === 'pending_manager';
  const isManagerLike = isManager || isPendingManager;
  const isWorker = role === 'member';
  const isAuthed = !!role;
  const linkClass = isHome
    ? 'text-white hover:text-white/80 transition-colors'
    : 'text-foreground hover:text-primary/80 transition-colors';

  const roleGetter = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        return null;
      }

      // profiles 테이블에서 role 조회 (단일 진실 공급원)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      if (error) {
        console.error('Failed to fetch user role from profiles:', error);
        return null;
      }

      const nextRole = profile?.role;
      return nextRole === 'admin' ||
        nextRole === 'manager' ||
        nextRole === 'pending_manager' ||
        nextRole === 'member'
        ? nextRole
        : null;
    } catch (error) {
      console.error('Failed to fetch user role:', error);
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    hydrateRole(roleGetter);
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refreshRole(roleGetter);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [hydrateRole, refreshRole, roleGetter, supabase]);

  const handleLogout = async () => {
    try {
      await signOutAction();
    } finally {
      setRole(null);
      window.location.href = '/';
    }
  };

  return (
    <nav
      className={cn(
        'sticky top-0 z-50',
        isHome
          ? 'bg-primary text-white'
          : 'bg-white text-primary border-b border-gray-200'
      )}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* 로고 - 항상 표시 */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Briefcase
              className={cn('size-4', isHome ? 'text-white' : 'text-primary')}
            />
            <span
              className={cn(
                'text-sm font-medium',
                isHome ? 'text-white' : 'text-primary'
              )}
            >
              스탭알바
            </span>
          </Link>

          {/* 데스크톱 네비게이션 - md 이상 (공고는 항상 노출) */}
          <NavigationMenu
            className={cn(
              'hidden md:flex justify-between items-center h-16',
              isHome ? 'text-white' : 'text-foreground'
            )}
          >
            <NavigationMenuList className="flex items-center gap-2">
              {/* 관리자 페이지 */}
              {isAdmin && (
                <NavigationMenuItem>
                  <NavigationMenuLink href="/admin" className={linkClass}>
                    관리자
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}

              {/* 매니저 페이지 */}
              {isManagerLike && (
                <>
                  <NavigationMenuItem>
                    <NavigationMenuLink href="/my-post" className={linkClass}>
                      내 공고
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="/manager/worker"
                      className={linkClass}
                    >
                      지원자 관리
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="/manager/schedule"
                      className={linkClass}
                    >
                      스케줄 관리
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </>
              )}

              {/* 일반회원 페이지 */}
              {isWorker && (
                <>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="/worker/schedule"
                      className={linkClass}
                    >
                      내 스케줄
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="/worker/favorit"
                      className={linkClass}
                    >
                      관심 목록
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {/* 데스크톱 로그인/프로필 - md 이상 (auth 페이지에서는 숨김) */}
          {!isAuthPage && roleHydrated && (
            <div className="hidden md:flex items-center gap-2">
              {isAuthed ? (
                <>
                  <Link
                    href="/profile"
                    className={cn(
                      'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isHome
                        ? 'text-white hover:text-white/80'
                        : 'text-primary hover:text-primary/80'
                    )}
                    aria-label="프로필 관리"
                  >
                    <User className="size-4" />
                    프로필 관리
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                      isHome
                        ? 'text-white hover:text-white/80'
                        : 'text-primary hover:text-primary/80'
                    )}
                    aria-label="로그아웃"
                    title="로그아웃"
                  >
                    <LogOut className="size-4" />
                  </button>
                </>
              ) : !isHome ? (
                <AuthButtons isHome={isHome} />
              ) : null}
            </div>
          )}

          {/* 모바일 - 인증 시 드롭다운, 미인증 시 버튼 (auth 페이지에서는 숨김) */}
          {roleHydrated && (
            <div className="block md:hidden">
              {isAuthed ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'inline-flex items-center justify-center rounded-md p-2 transition-colors',
                        isHome
                          ? 'text-white hover:text-white/80'
                          : 'text-primary hover:text-primary/80'
                      )}
                      aria-label="메뉴 열기"
                    >
                      <Menu className="size-5" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-56 z-[60]"
                  >
                    {/* 프로필은 로그인 시에만 */}
                    {(isAdmin || isManagerLike || isWorker) && (
                      <>
                        <DropdownMenuLabel className="flex items-center gap-2">
                          <Link
                            href="/profile"
                            className="flex items-center gap-2"
                          >
                            <User className="size-4" />
                            <span className="text-sm font-medium">
                              프로필 관리
                            </span>
                          </Link>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {/* 관리자 페이지 */}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2">
                          <ShieldCheck className="size-4" />
                          <span className="text-sm font-medium">관리자</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {/* 매니저 페이지 */}
                    {isManagerLike && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/my-post"
                            className="flex items-center gap-2"
                          >
                            <ListChecks className="size-4" />
                            <span className="text-sm font-medium">내 공고</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/manager/worker"
                            className="flex items-center gap-2"
                          >
                            <Users className="size-4" />
                            <span className="text-sm font-medium">
                              지원자 관리
                            </span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/manager/schedule"
                            className="flex items-center gap-2"
                          >
                            <Calendar className="size-4" />
                            <span className="text-sm font-medium">
                              스케줄 관리
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    {/* 일반회원 페이지 */}
                    {isWorker && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/worker/schedule"
                            className="flex items-center gap-2"
                          >
                            <Calendar className="size-4" />
                            <span className="text-sm font-medium">
                              내 스케줄
                            </span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/worker/favorit"
                            className="flex items-center gap-2"
                          >
                            <Heart className="size-4" />
                            <span className="text-sm font-medium">
                              관심 목록
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />

                    {/* 로그인/회원가입 버튼 (auth 페이지에서는 숨김) */}
                    {!isAuthPage && !isHome && (
                      <div className="p-2 space-y-2">
                        {isAuthed ? (
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50"
                          >
                            로그아웃
                          </button>
                        ) : (
                          <Link
                            href="/auth/login"
                            className="block w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-primary hover:bg-gray-50"
                          >
                            로그인
                          </Link>
                        )}
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                !isAuthPage && !isHome && <AuthButtons isHome={isHome} />
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
