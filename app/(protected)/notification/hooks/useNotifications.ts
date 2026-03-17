'use client';

import { useCallback, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  type Notification,
} from '../actions';

const PAGE_SIZE = 20;

export function useNotifications() {
  const queryClient = useQueryClient();
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const result = await getNotificationsAction(pageParam, PAGE_SIZE);
      return result.data ?? [];
    },
    getNextPageParam: (lastPage: Notification[], allPages: Notification[][]) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 30, // 30초
  });

  const notifications = data?.pages.flat() ?? [];

  // 캐시 내 알림 업데이트 헬퍼
  const updateCache = useCallback(
    (updater: (pages: Notification[][]) => Notification[][]) => {
      queryClient.setQueryData<{ pages: Notification[][]; pageParams: number[] }>(
        ['notifications'],
        (old) => (old ? { ...old, pages: updater(old.pages) } : old)
      );
    },
    [queryClient]
  );

  const dispatchUpdate = useCallback(() => {
    window.dispatchEvent(new CustomEvent('notification-updated'));
  }, []);

  // IntersectionObserver로 무한스크롤
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasNextPage || isFetchingNextPage) return;
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      });
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsReadAction(notificationId);
    if (result.ok) {
      updateCache((pages) =>
        pages.map((page) =>
          page.map((n) =>
            n.notification_id === notificationId ? { ...n, is_read: true } : n
          )
        )
      );
      setSelectedNotification((prev) =>
        prev?.notification_id === notificationId ? { ...prev, is_read: true } : prev
      );
      dispatchUpdate();
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsReadAction();
    if (result.ok) {
      updateCache((pages) =>
        pages.map((page) => page.map((n) => ({ ...n, is_read: true })))
      );
      dispatchUpdate();
    }
  };

  const handleDelete = async (notificationId: string) => {
    const result = await deleteNotificationAction(notificationId);
    if (result.ok) {
      updateCache((pages) =>
        pages.map((page) =>
          page.filter((n) => n.notification_id !== notificationId)
        )
      );
      if (selectedNotification?.notification_id === notificationId) {
        setSelectedNotification(null);
      }
      dispatchUpdate();
    }
  };

  const handleToggleSelectMode = () => {
    setIsSelectMode((prev) => {
      const next = !prev;
      if (next) {
        setSelectedIds(notifications.map((n) => n.notification_id));
      } else {
        setSelectedIds([]);
      }
      return next;
    });
  };

  const handleToggleSelected = (notificationId: string) => {
    setSelectedIds((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const targets = [...selectedIds];
    const results = await Promise.all(targets.map((id) => deleteNotificationAction(id)));
    const deletedIds = targets.filter((_, idx) => results[idx]?.ok);
    if (deletedIds.length > 0) {
      updateCache((pages) =>
        pages.map((page) =>
          page.filter((n) => !deletedIds.includes(n.notification_id))
        )
      );
      setSelectedIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
      dispatchUpdate();
    }
  };

  const handleOpenDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.is_read) {
      handleMarkAsRead(notification.notification_id);
    }
  };

  const handleCloseDetail = () => {
    setSelectedNotification(null);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const refetch = () =>
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

  return {
    notifications,
    isLoading,
    isSelectMode,
    selectedIds,
    unreadCount,
    hasMore: !!hasNextPage,
    isFetchingMore: isFetchingNextPage,
    sentinelRef,
    selectedNotification,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
    handleToggleSelectMode,
    handleToggleSelected,
    handleDeleteSelected,
    handleOpenDetail,
    handleCloseDetail,
    refetch,
  };
}
