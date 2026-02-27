'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getMyPostsAction,
  deletePostAction,
  updatePostStatusAction,
} from '../actions';
import type { PostRow } from '../types';

export const useMyPosts = (isManager: boolean) => {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyPostsAction();
      if (result.ok && result.data) {
        setPosts(result.data as PostRow[]);
      } else {
        console.error('Failed to fetch posts:', result.message);
        setPosts([]);
      }
    } catch (err) {
      console.error('Unexpected error fetching posts', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isManager) {
      fetchPosts();
    }
  }, [isManager, fetchPosts]);

  useEffect(() => {
    const handleFocus = () => {
      if (isManager) fetchPosts();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isManager, fetchPosts]);

  const myPosts = useMemo(() => {
    let filtered = [...posts];

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [posts, searchTerm, sortOrder]);

  const handleDelete = async (postId: string) => {
    const result = await deletePostAction(postId);
    if (result.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('삭제되었습니다.');
    } else {
      toast.error(result.message);
    }
  };

  const handleStatusToggle = async (
    postId: string,
    newStatus: PostRow['status'],
  ) => {
    const prevPosts = posts;
    const prevStatus = posts.find((p) => p.id === postId)?.status;

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p)),
    );

    const result = await updatePostStatusAction(postId, newStatus);

    if (!result.ok) {
      toast.error(result.message || '공고 상태 변경에 실패했습니다.');
      if (prevStatus) {
        setPosts(prevPosts);
      }
      return;
    }

    fetchPosts();
  };

  return {
    posts,
    loading,
    showFilters,
    setShowFilters,
    sortOrder,
    setSortOrder,
    searchTerm,
    setSearchTerm,
    myPosts,
    handleDelete,
    handleStatusToggle,
    router,
  };
};
