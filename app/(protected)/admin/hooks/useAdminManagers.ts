'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchPendingManagersAction,
  updateManagerStatusAction,
  type PendingManager,
} from '../manager-actions';

export const useAdminManagers = () => {
  const queryClient = useQueryClient();
  const [managerSearch, setManagerSearch] = useState('');

  const { data: pendingManagers = [], isLoading: loadingManagers } = useQuery({
    queryKey: ['admin', 'managers'],
    queryFn: fetchPendingManagersAction,
  });

  const filteredPendingManagers = useMemo(
    () =>
      pendingManagers.filter((req) => {
        if (!managerSearch) return true;
        const keyword = managerSearch.toLowerCase();
        return (
          req.name.toLowerCase().includes(keyword) ||
          req.email.toLowerCase().includes(keyword)
        );
      }),
    [pendingManagers, managerSearch]
  );

  const handleManagerDecision = async (
    req: PendingManager,
    decision: 'approve' | 'reject'
  ) => {
    try {
      await updateManagerStatusAction(req.id, decision);
      // 캐시에서 해당 매니저 즉시 제거
      queryClient.setQueryData<PendingManager[]>(
        ['admin', 'managers'],
        (old) => (old ? old.filter((r) => r.id !== req.id) : [])
      );
    } catch (err) {
      console.error('Failed to update manager status', err);
      toast.error('승인/거절 처리에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return {
    loadingManagers,
    managerSearch,
    setManagerSearch,
    filteredPendingManagers,
    handleManagerDecision,
  };
};
