'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  type Notification,
} from '../actions';
import { type FilterType } from '../utils/notificationUtils';

const FETCH_LIMIT = 200;
export const DISPLAY_PAGE_SIZE = 10;

function filterNotifications(
  notifications: Notification[],
  filter: FilterType,
  search: string
): Notification[] {
  let filtered = notifications;

  switch (filter) {
    case 'unread':
      filtered = filtered.filter((n) => !n.is_read);
      break;
    case 'application':
      filtered = filtered.filter((n) =>
        ['application_accepted', 'application_rejected', 'new_application'].includes(n.type)
      );
      break;
    case 'post':
      filtered = filtered.filter((n) => n.type === 'event_briefing');
      break;
    case 'schedule':
      filtered = filtered.filter((n) => n.type === 'schedule_reminder');
      break;
    case 'evaluation':
    case 'payment':
      return [];
    default:
      break;
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.message?.toLowerCase().includes(q) ?? false)
    );
  }

  return filtered;
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const result = await getNotificationsAction(0, FETCH_LIMIT);
      return result.data ?? [];
    },
    staleTime: 1000 * 30,
  });

  const allNotifications = data ?? [];

  const updateCache = useCallback(
    (updater: (items: Notification[]) => Notification[]) => {
      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        old ? updater(old) : old
      );
    },
    [queryClient]
  );

  const dispatchUpdate = useCallback(() => {
    window.dispatchEvent(new CustomEvent('notification-updated'));
  }, []);

  const filteredNotifications = useMemo(
    () => filterNotifications(allNotifications, activeFilter, searchQuery),
    [allNotifications, activeFilter, searchQuery]
  );

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / DISPLAY_PAGE_SIZE));

  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * DISPLAY_PAGE_SIZE;
    return filteredNotifications.slice(start, start + DISPLAY_PAGE_SIZE);
  }, [filteredNotifications, currentPage]);

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsReadAction(notificationId);
    if (result.ok) {
      updateCache((items) =>
        items.map((n) =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n
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
      updateCache((items) => items.map((n) => ({ ...n, is_read: true })));
      dispatchUpdate();
    }
  };

  const handleDelete = async (notificationId: string) => {
    const result = await deleteNotificationAction(notificationId);
    if (result.ok) {
      updateCache((items) =>
        items.filter((n) => n.notification_id !== notificationId)
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
        setSelectedIds(paginatedNotifications.map((n) => n.notification_id));
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
      updateCache((items) =>
        items.filter((n) => !deletedIds.includes(n.notification_id))
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

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const unreadCount = allNotifications.filter((n) => !n.is_read).length;

  const refetch = () =>
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

  return {
    notifications: paginatedNotifications,
    filteredCount: filteredNotifications.length,
    isLoading,
    isSelectMode,
    selectedIds,
    unreadCount,
    searchQuery,
    activeFilter,
    currentPage,
    totalPages,
    selectedNotification,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
    handleToggleSelectMode,
    handleToggleSelected,
    handleDeleteSelected,
    handleOpenDetail,
    handleCloseDetail,
    handleFilterChange,
    handleSearchChange,
    handlePageChange,
    refetch,
  };
}
