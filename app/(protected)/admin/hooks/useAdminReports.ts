'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getReportedPostsAction,
  updateReportStatusAction,
  deleteReportedPostAction,
} from '../report-actions';
import type { ReportedPostSummary } from '../report-constants';

async function fetchReportedPosts(): Promise<ReportedPostSummary[]> {
  const result = await getReportedPostsAction();
  return result.ok && result.data ? result.data : [];
}

export const useAdminReports = () => {
  const queryClient = useQueryClient();
  const [reportSearch, setReportSearch] = useState('');

  const { data: reportedPosts = [], isLoading: loadingReports } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: fetchReportedPosts,
  });

  const filteredReportedPosts = useMemo(
    () =>
      reportedPosts
        .filter((item) => {
          if (!reportSearch) return true;
          const keyword = reportSearch.toLowerCase();
          return (
            item.post_title.toLowerCase().includes(keyword) ||
            item.post_location.toLowerCase().includes(keyword) ||
            item.post_author_name.toLowerCase().includes(keyword)
          );
        })
        .sort((a, b) => b.report_count - a.report_count),
    [reportedPosts, reportSearch]
  );

  const removeFromCache = (postId: number) => {
    queryClient.setQueryData<ReportedPostSummary[]>(
      ['admin', 'reports'],
      (old) => (old ? old.filter((r) => r.post_id !== postId) : [])
    );
  };

  const handleReportDelete = async (postId: number) => {
    try {
      const result = await deleteReportedPostAction(postId);
      if (result.ok) {
        toast.success(result.message);
        removeFromCache(postId);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error('Failed to delete reported post', err);
      toast.error('게시물 삭제에 실패했습니다.');
    }
  };

  const handleReportDismiss = async (postId: number) => {
    try {
      const result = await updateReportStatusAction(postId, 'dismissed');
      if (result.ok) {
        toast.success('신고가 기각되었습니다.');
        removeFromCache(postId);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error('Failed to dismiss report', err);
      toast.error('신고 기각에 실패했습니다.');
    }
  };

  return {
    loadingReports,
    reportSearch,
    setReportSearch,
    filteredReportedPosts,
    handleReportDelete,
    handleReportDismiss,
  };
};
