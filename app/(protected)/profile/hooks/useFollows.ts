'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { removeMyFollowerAction, removeMyFollowingAction } from '../actions';

type FollowUser = {
  userId: string;
  name: string | null;
  avatar: string | null;
  role: string;
};

export function useFollows(params: { isManager: boolean; isMember: boolean }) {
  const { isManager, isMember } = params;
  const supabase = useMemo(() => createClient(), []);

  const [followerCount, setFollowerCount] = useState(0);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [followerSearch, setFollowerSearch] = useState('');

  const [followingCount, setFollowingCount] = useState(0);
  const [followings, setFollowings] = useState<FollowUser[]>([]);
  const [isLoadingFollowings, setIsLoadingFollowings] = useState(false);
  const [followingSearch, setFollowingSearch] = useState('');

  useEffect(() => {
    if (!isManager) return;
    const fetch = async () => {
      setIsLoadingFollowers(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data: followRows, count } = await supabase
          .from('manager_follows')
          .select('follower_id', { count: 'exact' })
          .eq('manager_id', userData.user.id)
          .order('created_at', { ascending: false });

        const followerIds = (followRows || []).map((r) => r.follower_id as string).filter(Boolean);

        if (followerIds.length === 0) {
          setFollowerCount(count ?? 0);
          setFollowers([]);
          return;
        }

        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, avatar, role')
          .in('user_id', followerIds);

        const list = (profiles || []).map((p) => ({
          userId: p.user_id as string,
          name: p.name as string | null,
          avatar: p.avatar as string | null,
          role: (p.role as string) || 'member',
        }));

        setFollowerCount(count ?? list.length);
        setFollowers(list);
      } finally {
        setIsLoadingFollowers(false);
      }
    };
    fetch();
  }, [isManager, supabase]);

  useEffect(() => {
    if (!isMember) return;
    const fetch = async () => {
      setIsLoadingFollowings(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data: followRows, count } = await supabase
          .from('manager_follows')
          .select('manager_id', { count: 'exact' })
          .eq('follower_id', userData.user.id)
          .order('created_at', { ascending: false });

        const managerIds = (followRows || []).map((r) => r.manager_id as string).filter(Boolean);

        if (managerIds.length === 0) {
          setFollowingCount(count ?? 0);
          setFollowings([]);
          return;
        }

        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, avatar, role')
          .in('user_id', managerIds);

        const list = (profiles || []).map((p) => ({
          userId: p.user_id as string,
          name: p.name as string | null,
          avatar: p.avatar as string | null,
          role: (p.role as string) || 'member',
        }));

        setFollowingCount(count ?? list.length);
        setFollowings(list);
      } finally {
        setIsLoadingFollowings(false);
      }
    };
    fetch();
  }, [isMember, supabase]);

  const filteredFollowers = useMemo(() => {
    const q = followerSearch.trim().toLowerCase();
    if (!q) return followers;
    return followers.filter((f) => (f.name || '').toLowerCase().includes(q));
  }, [followers, followerSearch]);

  const filteredFollowings = useMemo(() => {
    const q = followingSearch.trim().toLowerCase();
    if (!q) return followings;
    return followings.filter((f) => (f.name || '').toLowerCase().includes(q));
  }, [followings, followingSearch]);

  const handleRemoveFollowing = async (managerId: string) => {
    if (!confirm('팔로잉을 삭제하시겠습니까?')) return;
    const result = await removeMyFollowingAction(managerId);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setFollowings((prev) => prev.filter((f) => f.userId !== managerId));
    setFollowingCount((prev) => Math.max(0, prev - 1));
  };

  const handleRemoveFollower = async (followerId: string) => {
    if (!confirm('팔로워를 삭제하시겠습니까?')) return;
    const result = await removeMyFollowerAction(followerId);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setFollowers((prev) => prev.filter((f) => f.userId !== followerId));
    setFollowerCount((prev) => Math.max(0, prev - 1));
  };

  return {
    followerCount,
    followers: filteredFollowers,
    isLoadingFollowers,
    followerSearch,
    setFollowerSearch,
    followingCount,
    followings: filteredFollowings,
    isLoadingFollowings,
    followingSearch,
    setFollowingSearch,
    handleRemoveFollowing,
    handleRemoveFollower,
  };
}
