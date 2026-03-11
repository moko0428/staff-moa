'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  type Notification,
} from '../actions';

const PAGE_SIZE = 20;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getNotificationsAction(0, PAGE_SIZE);
      if (result.ok && result.data) {
        setNotifications(result.data);
        setHasMore(result.data.length === PAGE_SIZE);
        setPage(1);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    try {
      const result = await getNotificationsAction(page, PAGE_SIZE);
      if (result.ok && result.data) {
        setNotifications((prev) => [...prev, ...result.data!]);
        setHasMore(result.data.length === PAGE_SIZE);
        setPage((p) => p + 1);
      }
    } catch (error) {
      console.error('Failed to load more notifications:', error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [page, isFetchingMore, hasMore]);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasMore || isFetchingMore) return;
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) loadMore();
      });
      observerRef.current.observe(node);
    },
    [hasMore, isFetchingMore, loadMore],
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const dispatchNotificationUpdate = useCallback(() => {
    window.dispatchEvent(new CustomEvent('notification-updated'));
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsReadAction(notificationId);
    if (result.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === notificationId ? { ...n, is_read: true } : n)),
      );
      setSelectedNotification((prev) =>
        prev?.notification_id === notificationId ? { ...prev, is_read: true } : prev,
      );
      dispatchNotificationUpdate();
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsReadAction();
    if (result.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      dispatchNotificationUpdate();
    }
  };

  const handleDelete = async (notificationId: string) => {
    const result = await deleteNotificationAction(notificationId);
    if (result.ok) {
      setNotifications((prev) => prev.filter((n) => n.notification_id !== notificationId));
      if (selectedNotification?.notification_id === notificationId) {
        setSelectedNotification(null);
      }
      dispatchNotificationUpdate();
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
        : [...prev, notificationId],
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const targets = [...selectedIds];
    const results = await Promise.all(targets.map((id) => deleteNotificationAction(id)));
    const deletedIds = targets.filter((_, idx) => results[idx]?.ok);
    if (deletedIds.length > 0) {
      setNotifications((prev) => prev.filter((n) => !deletedIds.includes(n.notification_id)));
      setSelectedIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
      dispatchNotificationUpdate();
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

  return {
    notifications,
    isLoading,
    isSelectMode,
    selectedIds,
    unreadCount,
    hasMore,
    isFetchingMore,
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
    refetch: fetchNotifications,
  };
}
