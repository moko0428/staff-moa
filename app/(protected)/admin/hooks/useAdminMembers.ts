'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMembersAction } from '../admin-data-actions';

export const useAdminMembers = () => {
  const [bannedUserIds, setBannedUserIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<
    'all' | 'member' | 'manager' | 'banned'
  >('all');

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['admin', 'members'],
    queryFn: fetchMembersAction,
  });

  const filteredMembers = useMemo(
    () =>
      members
        .filter((user) => {
          const matchSearch =
            !memberSearch ||
            (user.name?.toLowerCase().includes(memberSearch.toLowerCase()) ?? false) ||
            (user.email?.toLowerCase().includes(memberSearch.toLowerCase()) ?? false);
          const isBanned = bannedUserIds.includes(user.id);
          const matchRole =
            memberRoleFilter === 'all'
              ? true
              : memberRoleFilter === 'banned'
              ? isBanned
              : user.role === memberRoleFilter;
          return matchSearch && matchRole;
        })
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [members, memberSearch, memberRoleFilter, bannedUserIds]
  );

  const toggleBan = (userId: string) => {
    setBannedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return {
    members,
    loadingMembers,
    bannedUserIds,
    memberSearch,
    setMemberSearch,
    memberRoleFilter,
    setMemberRoleFilter,
    filteredMembers,
    toggleBan,
  };
};
