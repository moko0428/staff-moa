'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getMyPostsAction,
  deletePostAction,
  updatePostStatusAction,
} from '../actions';
import type { PostRow } from '../types';

async function fetchMyPosts(): Promise<PostRow[]> {
  const result = await getMyPostsAction();
  return result.ok && result.data ? (result.data as PostRow[]) : [];
}

export const useMyPosts = (isManager: boolean) => {
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const { data: posts = [], isLoading: loading } = useQuery({
    queryKey: ['my-posts'],
    queryFn: fetchMyPosts,
    enabled: isManager,
    staleTime: 0,              // 항상 stale로 처리
    refetchOnWindowFocus: true, // 탭 복귀 시 자동 갱신
  });

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
      queryClient.setQueryData<PostRow[]>(
        ['my-posts'],
        (old) => (old ? old.filter((p) => p.id !== postId) : [])
      );
      toast.success('삭제되었습니다.');
    } else {
      toast.error(result.message);
    }
  };

  const handleStatusToggle = async (
    postId: string,
    newStatus: PostRow['status'],
  ) => {
    // 낙관적 업데이트
    queryClient.setQueryData<PostRow[]>(
      ['my-posts'],
      (old) => (old ? old.map((p) => (p.id === postId ? { ...p, status: newStatus } : p)) : [])
    );

    const result = await updatePostStatusAction(postId, newStatus);

    if (!result.ok) {
      toast.error(result.message || '공고 상태 변경에 실패했습니다.');
      queryClient.invalidateQueries({ queryKey: ['my-posts'] }); // 롤백
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['my-posts'] });
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
