'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Filters } from '../components/organisms/PostingFilter';
import type { JobItem } from '@/app/components/JobCard';
import { getAllPostsAction, getUserPostStateAction } from '../actions';
import { supabasePostToPostItem, postItemToJobItem, type SupabasePost, type PostItem } from '../utils/post-transform';

const STATUS_PRIORITY: Record<JobItem['status'], number> = {
  급구: 0,
  모집: 1,
  모집완료: 2,
};

async function fetchPostsWithUserState() {
  const [postsResult, userStateResult] = await Promise.all([
    getAllPostsAction(),
    getUserPostStateAction(),
  ]);

  const userState = userStateResult.data ?? {
    userId: null,
    userName: null,
    favoriteIds: [],
    appliedIds: [],
  };

  const rawPosts = postsResult.ok && postsResult.data ? postsResult.data : [];
  const postItems: PostItem[] = rawPosts.map((raw) =>
    supabasePostToPostItem(raw as SupabasePost)
  );
  const jobItems: JobItem[] = postItems.map((item) => ({
    ...postItemToJobItem(item),
    applied: userState.appliedIds.includes(item.id),
    isFavorite: userState.favoriteIds.includes(item.id),
  }));

  return { postItems, jobItems, userState };
}

export const usePostList = (filters: Filters) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPostsWithUserState,
    staleTime: 1000 * 60 * 2, // 2분 캐시
  });

  const postItems = data?.postItems ?? [];
  const jobItems = data?.jobItems ?? [];
  const userState = data?.userState ?? { userId: null, userName: null, favoriteIds: [], appliedIds: [] };

  const preloadedUser = useMemo(() => {
    if (userState.userId && userState.userName) {
      return { id: userState.userId, name: userState.userName };
    }
    if (userState.userId) {
      return { id: userState.userId, name: '' };
    }
    return null;
  }, [userState.userId, userState.userName]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    jobItems.forEach((item) =>
      item.categories.forEach((c) => {
        if (c?.trim()) set.add(c.trim());
      })
    );
    return Array.from(set).sort();
  }, [jobItems]);

  const allLocations = useMemo(() => {
    const set = new Set<string>();
    jobItems.forEach((item) => {
      if (item.place) set.add(item.place);
    });
    return Array.from(set);
  }, [jobItems]);

  const allSalaries = useMemo(() => {
    const set = new Set<number>();
    jobItems.forEach((item) => {
      const n = Number(item.pay);
      if (!isNaN(n)) set.add(n);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [jobItems]);

  const filtered = useMemo(() => {
    return jobItems
      .filter((job) => {
        if (filters.searchTerm?.trim()) {
          const q = filters.searchTerm.trim().toLowerCase();
          const matched =
            job.title.toLowerCase().includes(q) ||
            (job.content ?? '').toLowerCase().includes(q) ||
            (job.place ?? '').toLowerCase().includes(q) ||
            job.categories.join(' ').toLowerCase().includes(q);
          if (!matched) return false;
        }

        if (filters.status && job.status !== filters.status) return false;
        if (filters.payMin && Number(job.pay ?? 0) < Number(filters.payMin)) return false;
        if (filters.payMax && Number(job.pay ?? 0) > Number(filters.payMax)) return false;

        if (filters.dateRange?.from) {
          const jobDate = new Date(job.date ?? '');
          const from = new Date(filters.dateRange.from);
          const to = new Date(filters.dateRange.to ?? filters.dateRange.from);

          if (jobDate.setHours(0, 0, 0, 0) < from.setHours(0, 0, 0, 0)) return false;
          if (jobDate > to) return false;
        }

        if (filters.toText && !(job.TO ?? '').includes(filters.toText)) return false;
        if (filters.placeText && !(job.place ?? '').includes(filters.placeText)) return false;
        if (
          filters.categories.length > 0 &&
          !filters.categories.every((c) => job.categories.includes(c))
        )
          return false;

        return true;
      })
      .sort((a, b) => {
        const statusDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
        if (statusDiff !== 0) return statusDiff;
        return (
          new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime()
        );
      });
  }, [jobItems, filters]);

  const activeDates = useMemo(() => {
    const dateSet = new Set<string>();
    postItems
      .filter((item) => item.status !== 'completed')
      .forEach((item) => {
        if (item.work_slots?.length) {
          item.work_slots.forEach((slot) => {
            if (slot.date) dateSet.add(slot.date);
          });
        } else if (item.date) {
          dateSet.add(item.date);
        }
      });
    return Array.from(dateSet);
  }, [postItems]);

  return {
    filtered,
    isLoading,
    allCategories,
    allLocations,
    allSalaries,
    activeDates,
    allItems: jobItems,
    refetch,
    preloadedUser,
  };
};
