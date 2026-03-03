'use client';

import { useState, useEffect, useMemo } from 'react';
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

export function useFavorit() {
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const isMember = role === 'member';

  const [favoritePosts, setFavoritePosts] = useState<Post[]>([]);
  const [matchedPosts, setMatchedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMatched, setIsLoadingMatched] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const [favoriteKeywords, setFavoriteKeywords] = useState<string[]>([]);
  const [activeKeywords, setActiveKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);

  const [followedManagerIds, setFollowedManagerIds] = useState<string[]>([]);
  const [activeManagers, setActiveManagers] = useState<ManagerInfo[]>([]);
  const [managerSearch, setManagerSearch] = useState('');
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<ProfileModalUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchFavoritePosts = async () => {
      if (!isMember || !roleHydrated) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const result = await getFavoritePostsAction();
        if (result.ok && result.data) {
          setFavoritePosts(result.data.map((post) => supabasePostToPost(post as SupabasePost)));
        } else {
          setFavoritePosts([]);
        }
      } catch (error) {
        console.error('Failed to fetch favorite posts:', error);
        setFavoritePosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoritePosts();

    const handleFavoritesUpdate = () => fetchFavoritePosts();
    window.addEventListener('favorites-updated', handleFavoritesUpdate);
    return () => window.removeEventListener('favorites-updated', handleFavoritesUpdate);
  }, [isMember, roleHydrated]);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        setCurrentUserId(data.user?.id);
      } catch {
        // noop
      }
    };
    fetchMe();
  }, []);

  useEffect(() => {
    const fetchExtras = async () => {
      if (!isMember || !roleHydrated) return;
      setIsLoadingKeywords(true);
      setIsLoadingManagers(true);
      setIsLoadingMatched(true);
      try {
        const [kwResult, activeKwResult, followedResult, activeManagersResult, matchedResult] =
          await Promise.all([
            getFavoriteKeywordsAction(),
            getActivePostKeywordsAction(),
            getFollowedManagersAction(),
            getActiveManagersFromPostsAction(),
            getMatchedPostsForFavoritesAction(),
          ]);

        if (kwResult.ok) setFavoriteKeywords(kwResult.data || []);
        if (activeKwResult.ok) setActiveKeywords(activeKwResult.data || []);
        if (followedResult.ok) setFollowedManagerIds(followedResult.data || []);
        if (activeManagersResult.ok) setActiveManagers(activeManagersResult.data || []);

        if (matchedResult.ok && matchedResult.data) {
          setMatchedPosts(matchedResult.data.map((post) => supabasePostToPost(post as SupabasePost)));
        } else {
          setMatchedPosts([]);
        }
      } catch (e) {
        console.error('Failed to fetch favorites extras:', e);
      } finally {
        setIsLoadingKeywords(false);
        setIsLoadingManagers(false);
        setIsLoadingMatched(false);
      }
    };

    fetchExtras();
  }, [isMember, roleHydrated]);

  const handleAddKeyword = async () => {
    const v = newKeyword.trim();
    if (!v) return;
    const result = await addFavoriteKeywordAction(v);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    const refreshed = await getFavoriteKeywordsAction();
    if (refreshed.ok) setFavoriteKeywords(refreshed.data || []);
    setNewKeyword('');
  };

  const handleRemoveKeyword = async (kw: string) => {
    const result = await removeFavoriteKeywordAction(kw);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setFavoriteKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const handleAddKeywordFromSuggestion = async (kw: string) => {
    const r = await addFavoriteKeywordAction(kw);
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    setFavoriteKeywords((prev) => (prev.includes(kw) ? prev : [...prev, kw]));
  };

  const handleFollowManager = async (managerId: string) => {
    const result = await followManagerAction(managerId);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setFollowedManagerIds((prev) => (prev.includes(managerId) ? prev : [...prev, managerId]));
  };

  const handleUnfollowManager = async (managerId: string) => {
    const result = await unfollowManagerAction(managerId);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setFollowedManagerIds((prev) => prev.filter((id) => id !== managerId));
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
    isLoadingMatched,
    searchTerm,
    setSearchTerm,
    sortOrder,
    setSortOrder,
    favoriteKeywords,
    activeKeywords,
    newKeyword,
    setNewKeyword,
    isLoadingKeywords,
    followedManagerIds,
    activeManagers,
    managerSearch,
    setManagerSearch,
    isLoadingManagers,
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
