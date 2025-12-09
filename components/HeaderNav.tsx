'use client';

import AuthButtons from '@/components/AuthButtons';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';
import {
  Briefcase,
  Calendar,
  Heart,
  ListChecks,
  Menu,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function HeaderNav() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isWorker, setIsWorker] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isAuthPage =
    pathname.startsWith('/auth/login') || pathname.startsWith('/auth/join');
  const isAuthed = isAdmin || isManager || isWorker;
  const linkClass = isHome
    ? 'text-white hover:text-white/80 transition-colors'
    : 'text-foreground hover:text-primary/80 transition-colors';

  useEffect(() => {
    const syncRole = () => {
      try {
        if (typeof window === 'undefined') return;
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        setIsAdmin(!!userId && userRole === 'admin');
        setIsManager(!!userId && userRole === 'manager');
        setIsWorker(!!userId && userRole === 'member');
      } catch (error) {
        console.error('Failed to check user role:', error);
      }
    };

    syncRole();
    window.addEventListener('storage', syncRole);
    window.addEventListener('auth-changed', syncRole);

    return () => {
      window.removeEventListener('storage', syncRole);
      window.removeEventListener('auth-changed', syncRole);
    };
  }, []);

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
              {isManager && (
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

          {/* 데스크톱 로그인 버튼 - md 이상에서만 표시 (auth 페이지에서는 숨김) */}
          {!isAuthPage && (
            <div className="hidden md:block">
              <AuthButtons />
            </div>
          )}

          {/* 모바일 - 인증 시 드롭다운, 미인증 시 버튼 (auth 페이지에서는 숨김) */}
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

                <DropdownMenuContent align="end" className="w-56">
                  {/* 프로필은 로그인 시에만 */}
                  {(isAdmin || isManager || isWorker) && (
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
                  {isManager && (
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
                          <span className="text-sm font-medium">내 스케줄</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/worker/favorit"
                          className="flex items-center gap-2"
                        >
                          <Heart className="size-4" />
                          <span className="text-sm font-medium">관심 목록</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />

                  {/* 로그인/회원가입 버튼 (auth 페이지에서는 숨김) */}
                  {!isAuthPage && (
                    <div className="p-2">
                      <AuthButtons />
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              !isAuthPage && <AuthButtons />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
