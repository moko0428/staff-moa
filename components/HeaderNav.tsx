'use client';

import AuthButtons from '@/components/AuthButtons';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { Briefcase } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HeaderNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isWorker, setIsWorker] = useState(false);
  useEffect(() => {
    // 초기 해시 설정 및 pathname 변경 시 해시 업데이트
    const updateHash = () => {
      setHash(window.location.hash);
    };

    // 초기 해시 설정
    updateHash();

    // hashchange 이벤트 리스너
    const handleHashChange = () => {
      updateHash();
    };

    // pathname 변경 시 해시 업데이트 (다른 페이지로 이동 후 돌아올 때)
    window.addEventListener('hashchange', handleHashChange);

    // 주기적으로 해시 확인 (즉시 반영을 위해)
    const intervalId = setInterval(updateHash, 100);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      clearInterval(intervalId);
    };
  }, [pathname]);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 네비게이션 메뉴 */}
          <NavigationMenu className="flex justify-between items-center h-16">
            <NavigationMenuList className="flex items-center gap-2">
              <NavigationMenuItem className="mr-2">
                <NavigationMenuLink
                  href="/"
                  className="flex-row items-center gap-2"
                >
                  <Briefcase className="size-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    스탭알바
                  </span>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/#open"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  구인공고
                </NavigationMenuLink>
              </NavigationMenuItem>

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
                      href="/#my-posting"
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      내 공고
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="/#my-posting"
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      지원자 관리
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="/#my-posting"
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
                      href="/#my-posting"
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      관심 목록
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {/* 로그인 버튼 */}
          <AuthButtons />
        </div>
      </div>
    </nav>
  );
}
