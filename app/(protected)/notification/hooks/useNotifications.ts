'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  type Notification,
} from '../actions';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getNotificationsAction();
      if (result.ok && result.data) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        prev.map((n) => (n.notification_id === notificationId ? { ...n, is_read: true } : n))
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
        : [...prev, notificationId]
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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    isLoading,
    isSelectMode,
    selectedIds,
    unreadCount,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
    handleToggleSelectMode,
    handleToggleSelected,
    handleDeleteSelected,
  };
}
