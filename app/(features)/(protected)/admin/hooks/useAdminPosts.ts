'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPostsAction, type AdminPostItem } from '../admin-data-actions';

export const useAdminPosts = () => {
  const [posts, setPosts] = useState<AdminPostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [deletedPostIds, setDeletedPostIds] = useState<string[]>([]);
  const [postSearch, setPostSearch] = useState('');
  const [postStatusFilter, setPostStatusFilter] = useState<
    'all' | 'recruiting' | 'completed' | 'urgent'
  >('all');
  const [selectedPost, setSelectedPost] = useState<AdminPostItem | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const data = await fetchPostsAction();
      setPosts(data);
    } catch (err) {
      console.error('Failed to load posts', err);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const visiblePosts = useMemo(
    () => posts.filter((post) => !deletedPostIds.includes(post.id)),
    [posts, deletedPostIds]
  );

  const filteredPosts = useMemo(
    () =>
      visiblePosts.filter((post) => {
        const matchSearch =
          !postSearch ||
          post.title.toLowerCase().includes(postSearch.toLowerCase()) ||
          post.location.toLowerCase().includes(postSearch.toLowerCase());
        const matchStatus =
          postStatusFilter === 'all' ? true : post.status === postStatusFilter;
        return matchSearch && matchStatus;
      }),
    [visiblePosts, postSearch, postStatusFilter]
  );

  const deletePost = (postId: string) => {
    setDeletedPostIds((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
  };

  return {
    loadingPosts,
    postSearch,
    setPostSearch,
    postStatusFilter,
    setPostStatusFilter,
    selectedPost,
    setSelectedPost,
    visiblePosts,
    filteredPosts,
    deletePost,
  };
};
