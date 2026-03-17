'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/useUserStore';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import {
  getFavoritePostsAction,
  getFavoriteKeywordsAction,
  addFavoriteKeywordAction,
  removeFavoriteKeywordAction,
  getActivePostKeywordsAction,
  getFollowedManagersAction,
  followManagerAction,
  unfollowManagerAction,
  getMatchedPostsForFavoritesAction,
  getActiveManagersFromPostsAction,
  getProfileForModalAction,
} from '../actions';
import { supabasePostToPost } from '../utils/postConverters';
import type { SortOrder, SupabasePost, ManagerInfo, ProfileModalUser } from '../types';
import type { Post } from '@/types/mockData';

interface FavoritData {
  favoritePosts: Post[];
  matchedPosts: Post[];
  favoriteKeywords: string[];
  activeKeywords: string[];
  followedManagerIds: string[];
  activeManagers: ManagerInfo[];
  currentUserId: string | undefined;
}

async function fetchFavoritData(): Promise<FavoritData> {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();

  const [
    favResult,
    kwResult,
    activeKwResult,
    followedResult,
    activeManagersResult,
    matchedResult,
  ] = await Promise.all([
    getFavoritePostsAction(),
    getFavoriteKeywordsAction(),
    getActivePostKeywordsAction(),
    getFollowedManagersAction(),
    getActiveManagersFromPostsAction(),
    getMatchedPostsForFavoritesAction(),
  ]);

  return {
    currentUserId: authData.user?.id,
    favoritePosts:
      favResult.ok && favResult.data
        ? favResult.data.map((post) => supabasePostToPost(post as SupabasePost))
        : [],
    matchedPosts:
      matchedResult.ok && matchedResult.data
        ? matchedResult.data.map((post) => supabasePostToPost(post as SupabasePost))
        : [],
    favoriteKeywords: kwResult.ok ? (kwResult.data || []) : [],
    activeKeywords: activeKwResult.ok ? (activeKwResult.data || []) : [],
    followedManagerIds: followedResult.ok ? (followedResult.data || []) : [],
    activeManagers: activeManagersResult.ok ? (activeManagersResult.data || []) : [],
  };
}

export function useFavorit() {
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const isMember = role === 'member';
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [newKeyword, setNewKeyword] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<ProfileModalUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['favorit'],
    queryFn: fetchFavoritData,
    enabled: isMember && roleHydrated,
  });

  const favoritePosts = data?.favoritePosts ?? [];
  const matchedPosts = data?.matchedPosts ?? [];
  const favoriteKeywords = data?.favoriteKeywords ?? [];
  const activeKeywords = data?.activeKeywords ?? [];
  const followedManagerIds = data?.followedManagerIds ?? [];
  const activeManagers = data?.activeManagers ?? [];
  const currentUserId = data?.currentUserId;

  // 외부(JobCard 등)에서 즐겨찾기 변경 시 캐시 갱신
  useEffect(() => {
    const handleUpdate = () =>
      queryClient.invalidateQueries({ queryKey: ['favorit'] });
    window.addEventListener('favorites-updated', handleUpdate);
    return () => window.removeEventListener('favorites-updated', handleUpdate);
  }, [queryClient]);

  const updateCache = (updater: (old: FavoritData) => FavoritData) => {
    queryClient.setQueryData<FavoritData>(['favorit'], (old) =>
      old ? updater(old) : old
    );
  };

  const handleAddKeyword = async () => {
    const v = newKeyword.trim();
    if (!v) return;
    const result = await addFavoriteKeywordAction(v);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    updateCache((old) => ({
      ...old,
      favoriteKeywords: old.favoriteKeywords.includes(v)
        ? old.favoriteKeywords
        : [...old.favoriteKeywords, v],
    }));
    setNewKeyword('');
  };

  const handleRemoveKeyword = async (kw: string) => {
    const result = await removeFavoriteKeywordAction(kw);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    updateCache((old) => ({
      ...old,
      favoriteKeywords: old.favoriteKeywords.filter((k) => k !== kw),
    }));
  };

  const handleAddKeywordFromSuggestion = async (kw: string) => {
    const r = await addFavoriteKeywordAction(kw);
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    updateCache((old) => ({
      ...old,
      favoriteKeywords: old.favoriteKeywords.includes(kw)
        ? old.favoriteKeywords
        : [...old.favoriteKeywords, kw],
    }));
  };

  const handleFollowManager = async (managerId: string) => {
    const result = await followManagerAction(managerId);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    updateCache((old) => ({
      ...old,
      followedManagerIds: old.followedManagerIds.includes(managerId)
        ? old.followedManagerIds
        : [...old.followedManagerIds, managerId],
    }));
  };

  const handleUnfollowManager = async (managerId: string) => {
    const result = await unfollowManagerAction(managerId);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    updateCache((old) => ({
      ...old,
      followedManagerIds: old.followedManagerIds.filter((id) => id !== managerId),
    }));
  };

  const openManagerProfile = async (managerId: string) => {
    const result = await getProfileForModalAction(managerId);
    if (!result.ok || !result.data) {
      toast.error(result.message || '프로필을 불러오는데 실패했습니다.');
      return;
    }
    setProfileModalUser(result.data);
    setProfileModalOpen(true);
  };

  const filteredAndSortedPosts = useMemo(() => {
    let posts = [...favoritePosts];
    if (searchTerm) {
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.keywords?.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    posts.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return posts;
  }, [favoritePosts, searchTerm, sortOrder]);

  const filteredMatchedPosts = useMemo(() => {
    let posts = [...matchedPosts];
    if (searchTerm) {
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.keywords?.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    posts.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return posts;
  }, [matchedPosts, searchTerm, sortOrder]);

  const filteredActiveManagers = useMemo(() => {
    const s = managerSearch.trim().toLowerCase();
    if (!s) return activeManagers;
    return activeManagers.filter((m) => m.managerName.toLowerCase().includes(s));
  }, [activeManagers, managerSearch]);

  return {
    roleHydrated,
    isMember,
    favoritePosts,
    matchedPosts,
    isLoading,
    isLoadingMatched: isLoading,
    searchTerm,
    setSearchTerm,
    sortOrder,
    setSortOrder,
    favoriteKeywords,
    activeKeywords,
    newKeyword,
    setNewKeyword,
    isLoadingKeywords: isLoading,
    followedManagerIds,
    activeManagers,
    managerSearch,
    setManagerSearch,
    isLoadingManagers: isLoading,
    profileModalOpen,
    setProfileModalOpen,
    profileModalUser,
    currentUserId,
    filteredAndSortedPosts,
    filteredMatchedPosts,
    filteredActiveManagers,
    handleAddKeyword,
    handleRemoveKeyword,
    handleAddKeywordFromSuggestion,
    handleFollowManager,
    handleUnfollowManager,
    openManagerProfile,
  };
}
