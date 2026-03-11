'use client';

import {
  Search,
  Menu,
  User,
  Bell,
  LogOut,
  Calendar,
  ListChecks,
  Users,
  Heart,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AuthButtons from '@/app/components/AuthButtons';
import MobileSearchOverlay from './MobileSearchOverlay';
import { useUserStore } from '@/store/useUserStore';
import { type JobItem } from '@/app/components/JobCard';
import { signOutAction } from '@/app/auth/action';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';

export type Filters = {
  status: '' | '급구' | '모집' | '모집완료';
  payMin?: string;
  payMax?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
  toText?: string;
  placeText?: string;
  categories: string[];
  searchTerm?: string;
};

interface FilterBarProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  allCategories: string[];
  allLocations: string[];
  allSalaries: number[];
  allItems: JobItem[];
}

export default function PostingFilter({
  filters,
  onChange,
  allCategories,
  allLocations,
  allSalaries,
  allItems,
}: FilterBarProps) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const [filterOpen, setFilterOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const role = useUserStore((state) => state.role);
  const setRole = useUserStore((state) => state.setRole);
  const isAuthed = !!role;
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isPendingManager = role === 'pending_manager';
  const isManagerLike = isManager || isPendingManager;
  const isWorker = role === 'member';

  const handleLogout = async () => {
    try {
      await signOutAction();
    } finally {
      setRole(null);
      window.location.href = '/';
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative bg-background w-full border-b border-border px-4 py-2">
      <div className="flex gap-2 items-center">
        {scrolled && (
          <Link href="/" className="shrink-0">
            <Image
              src="/assets/primary_logo_512.png"
              alt="고인력"
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </Link>
        )}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={filters.searchTerm ?? ''}
            onChange={(e) => set({ searchTerm: e.target.value })}
            onFocus={(e) => {
              if (window.innerWidth < 640) {
                e.currentTarget.blur();
                setFilterOpen(true);
              }
            }}
            placeholder="원하는 공고를 검색해보세요"
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        {scrolled &&
          (isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1 text-primary hover:text-primary/80 transition-colors"
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
                <DropdownMenuLabel>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="size-4" />
                    <span className="text-sm font-medium">프로필 관리</span>
                  </Link>
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link
                    href="/notification"
                    className="flex items-center gap-2"
                  >
                    <Bell className="size-4" />
                    <span className="text-sm font-medium">알림</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    prefetch={false}
                    className="flex items-center gap-2"
                  >
                    <Settings className="size-4" />
                    <span className="text-sm font-medium">설정</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center gap-2">
                      <ShieldCheck className="size-4" />
                      <span className="text-sm font-medium">관리자</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {isManagerLike && (
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
                <div className="p-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    <LogOut className="size-4" />
                    로그아웃
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <AuthButtons isHome={false} />
          ))}
      </div>

      {filterOpen && (
        <MobileSearchOverlay
          initialFilters={filters}
          allCategories={allCategories}
          allLocations={allLocations}
          allSalaries={allSalaries}
          allItems={allItems}
          onClose={() => setFilterOpen(false)}
          onApply={(f) => {
            onChange(f);
            setFilterOpen(false);
          }}
        />
      )}
    </div>
  );
}
