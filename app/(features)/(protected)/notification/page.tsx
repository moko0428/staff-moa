'use client';

import Hero from '@/app/components/Hero';
import { useNotifications } from './hooks/useNotifications';
import { NotificationCard } from './components/organisms/NotificationCard';

export default function NotificationPage() {
  const {
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
  } = useNotifications();

  if (isLoading) {
    return (
      <div>
        <Hero title="알림" description="새로운 소식을 확인하세요" />
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Hero title="알림" description="새로운 소식을 확인하세요" />
      <div className="mt-6">
        <NotificationCard
          notifications={notifications}
          unreadCount={unreadCount}
          isSelectMode={isSelectMode}
          selectedIds={selectedIds}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDelete={handleDelete}
          onToggleSelectMode={handleToggleSelectMode}
          onToggleSelected={handleToggleSelected}
          onDeleteSelected={handleDeleteSelected}
        />
      </div>
    </div>
  );
}
