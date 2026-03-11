'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import type { Filters } from '../components/organisms/PostingFilter';
import type { JobItem } from '@/app/components/JobCard';
import { getAllPostsAction } from '../actions';
import { supabasePostToPostItem, postItemToJobItem, type SupabasePost, type PostItem } from '../utils/post-transform';

const STATUS_PRIORITY: Record<JobItem['status'], number> = {
  급구: 0,
  모집: 1,
  모집완료: 2,
};

export const usePostList = (filters: Filters) => {
  const [postItems, setPostItems] = useState<PostItem[]>([]);
  const [jobItems, setJobItems] = useState<JobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAllPostsAction();
      if (result.ok && result.data) {
        const converted = result.data.map((raw) =>
          supabasePostToPostItem(raw as SupabasePost)
        );
        setPostItems(converted);
        setJobItems(converted.map(postItemToJobItem));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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

  return { filtered, isLoading, allCategories, allLocations, allSalaries, activeDates, allItems: jobItems, refetch: fetchPosts };
};
