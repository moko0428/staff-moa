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
import { usePathname } from 'next/navigation';
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

export default function HeaderNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(true);
  const [isWorker, setIsWorker] = useState(false);

  useEffect(() => {
    const updateHash = () => {
      setHash(window.location.hash);
    };

    updateHash();
    const handleHashChange = () => {
      updateHash();
    };

    window.addEventListener('hashchange', handleHashChange);
    const intervalId = setInterval(updateHash, 100);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      clearInterval(intervalId);
    };
  }, [pathname]);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* 로고 - 항상 표시 */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Briefcase className="size-4 text-primary" />
            <span className="text-sm font-medium text-primary">스탭알바</span>
          </Link>

          {/* 데스크톱 네비게이션 - md 이상에서만 표시 */}
          <NavigationMenu className="hidden md:flex justify-between items-center h-16">
            <NavigationMenuList className="flex items-center gap-2">
              {/* 관리자 페이지 */}
              {isAdmin && (
                <NavigationMenuItem>
                  <NavigationMenuLink
                    href="/#admin"
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    관리자
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}

              {/* 매니저 페이지 */}
              {isManager && (
                <>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="/my-post"
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      내 공고
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="/manager/worker"
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      지원자 관리
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="/manager/schedule"
                      className="text-foreground hover:text-primary transition-colors"
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
                      href="/#normal-member"
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      내 스케줄
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="/manager/worker"
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      관심 목록
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {/* 데스크톱 로그인 버튼 - md 이상에서만 표시 */}
          <div className="hidden md:block">
            <AuthButtons />
          </div>

          {/* 모바일 드롭다운 메뉴 - md 미만에서만 표시 */}
          <div className="block md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:text-primary transition-colors"
                  aria-label="메뉴 열기"
                >
                  <Menu className="size-5" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <User className="size-4" />
                  <span className="text-sm font-medium">프로필 관리</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* 관리자 페이지 */}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/#admin" className="flex items-center gap-2">
                      <ShieldCheck className="size-4" />
                      <span className="text-sm font-medium">관리자</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {/* 매니저 페이지 */}
                {isManager && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/my-post" className="flex items-center gap-2">
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
                        <span className="text-sm font-medium">지원자 관리</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/manager/schedule"
                        className="flex items-center gap-2"
                      >
                        <Calendar className="size-4" />
                        <span className="text-sm font-medium">스케줄 관리</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {/* 일반회원 페이지 */}
                {isWorker && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/#normal-member"
                        className="flex items-center gap-2"
                      >
                        <Calendar className="size-4" />
                        <span className="text-sm font-medium">내 스케줄</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/#my-posting"
                        className="flex items-center gap-2"
                      >
                        <Heart className="size-4" />
                        <span className="text-sm font-medium">관심 목록</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <div className="p-2">
                  <AuthButtons />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
