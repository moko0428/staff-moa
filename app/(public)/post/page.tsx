'use client';

import { useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import PostingFilter, {
  type Filters,
} from './components/organisms/PostingFilter';
import DesktopFilterSidebar from './components/organisms/DesktopFilterSidebar';
import { usePostList } from './hooks/usePostList';
import PostList from './components/organisms/PostList';
import { PlusIcon } from 'lucide-react';
import FloatingButtons from '@/app/components/FloatingButtons';

const DEFAULT_FILTERS: Filters = {
  status: '',
  payMin: '',
  payMax: '',
  dateRange: undefined,
  toText: '',
  placeText: '',
  categories: [],
  searchTerm: '',
};

const PostPage = () => {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const {
    filtered,
    isLoading,
    allCategories,
    allLocations,
    allSalaries,
    allItems,
    refetch,
  } = usePostList(filters);

  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const isManager = role === 'manager';

  return (
    <div className="flex flex-col gap-2">
      <div className="sticky top-0 z-40">
        <PostingFilter
          filters={filters}
          onChange={setFilters}
          allCategories={allCategories}
          allLocations={allLocations}
          allSalaries={allSalaries}
          allItems={allItems}
        />
      </div>
      <div className="flex gap-4 px-2">
        <DesktopFilterSidebar
          filters={filters}
          onChange={setFilters}
          allCategories={allCategories}
          allLocations={allLocations}
          allSalaries={allSalaries}
          allItems={allItems}
        />
        <div className="flex-1 min-w-0">
          <PostList items={filtered} isLoading={isLoading} />
        </div>
      </div>

      <FloatingButtons
        onRefresh={refetch}
        isRefreshing={isLoading}
        className={roleHydrated && isManager ? 'bottom-24' : undefined}
      />

      {roleHydrated && isManager && (
        <Button
          asChild
          size="icon"
          className="fixed bottom-6 right-6 z-30 size-14 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.25)] text-2xl flex items-center justify-center"
        >
          <Link href="/my-post/create">
            <PlusIcon className="size-4" />
          </Link>
        </Button>
      )}
    </div>
  );
};

export default PostPage;
