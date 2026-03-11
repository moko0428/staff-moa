'use client';

import { useNotifications } from './hooks/useNotifications';
import { NotificationCard } from './components/organisms/NotificationCard';
import { NotificationDetailModal } from './components/molecules/NotificationDetailModal';
import FloatingButtons from '@/app/components/FloatingButtons';

export default function NotificationPage() {
  const {
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
    refetch,
  } = useNotifications();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <NotificationCard
        notifications={notifications}
        unreadCount={unreadCount}
        isSelectMode={isSelectMode}
        selectedIds={selectedIds}
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        sentinelRef={sentinelRef}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDelete={handleDelete}
        onToggleSelectMode={handleToggleSelectMode}
        onToggleSelected={handleToggleSelected}
        onDeleteSelected={handleDeleteSelected}
        onOpenDetail={handleOpenDetail}
      />
      <NotificationDetailModal
        notification={selectedNotification}
        onClose={handleCloseDetail}
        onDelete={handleDelete}
      />
      <FloatingButtons onRefresh={refetch} isRefreshing={isLoading} />
    </div>
  );
}
