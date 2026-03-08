'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  fetchPendingManagersAction,
  updateManagerStatusAction,
  type PendingManager,
} from '../manager-actions';

export const useAdminManagers = () => {
  const [pendingManagers, setPendingManagers] = useState<PendingManager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [approvedManagerIds, setApprovedManagerIds] = useState<string[]>([]);
  const [rejectedManagerIds, setRejectedManagerIds] = useState<string[]>([]);
  const [managerSearch, setManagerSearch] = useState('');

  const fetchPendingManagers = useCallback(async () => {
    setLoadingManagers(true);
    try {
      const mapped = await fetchPendingManagersAction();
      setPendingManagers(mapped);
    } catch (err) {
      console.error('Failed to load manager requests', err);
      setPendingManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingManagers();
  }, [fetchPendingManagers]);

  const filteredPendingManagers = useMemo(
    () =>
      pendingManagers
        .filter(
          (req) =>
            !approvedManagerIds.includes(req.id) && !rejectedManagerIds.includes(req.id)
        )
        .filter((req) => {
          if (!managerSearch) return true;
          const keyword = managerSearch.toLowerCase();
          return (
            req.name.toLowerCase().includes(keyword) ||
            req.email.toLowerCase().includes(keyword)
          );
        }),
    [pendingManagers, approvedManagerIds, rejectedManagerIds, managerSearch]
  );

  const handleManagerDecision = async (
    req: PendingManager,
    decision: 'approve' | 'reject'
  ) => {
    try {
      await updateManagerStatusAction(req.id, decision);
      if (decision === 'approve') {
        setApprovedManagerIds((prev) => (prev.includes(req.id) ? prev : [...prev, req.id]));
      } else {
        setRejectedManagerIds((prev) => (prev.includes(req.id) ? prev : [...prev, req.id]));
      }
      setPendingManagers((prev) => prev.filter((r) => r.id !== req.id));
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
