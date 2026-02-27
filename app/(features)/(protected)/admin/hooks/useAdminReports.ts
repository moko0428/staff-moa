'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  getReportedPostsAction,
  updateReportStatusAction,
  deleteReportedPostAction,
} from '../report-actions';
import type { ReportedPostSummary } from '../report-constants';

export const useAdminReports = () => {
  const [reportedPosts, setReportedPosts] = useState<ReportedPostSummary[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [handledReportPostIds, setHandledReportPostIds] = useState<string[]>([]);
  const [reportSearch, setReportSearch] = useState('');

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const result = await getReportedPostsAction();
      if (result.ok && result.data) {
        setReportedPosts(result.data);
      } else {
        console.error('Failed to load reports:', result.message);
        setReportedPosts([]);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
      setReportedPosts([]);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredReportedPosts = useMemo(
    () =>
      reportedPosts
        .filter((item) => !handledReportPostIds.includes(item.post_id.toString()))
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
    [reportedPosts, handledReportPostIds, reportSearch]
  );

  const handleReportDelete = async (postId: number) => {
    try {
      const result = await deleteReportedPostAction(postId);
      if (result.ok) {
        toast.success(result.message);
        setHandledReportPostIds((prev) =>
          prev.includes(postId.toString()) ? prev : [...prev, postId.toString()]
        );
        setReportedPosts((prev) => prev.filter((r) => r.post_id !== postId));
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
        setHandledReportPostIds((prev) =>
          prev.includes(postId.toString()) ? prev : [...prev, postId.toString()]
        );
        setReportedPosts((prev) => prev.filter((r) => r.post_id !== postId));
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
