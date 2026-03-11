'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Bell, CheckCheck, Square, SquareCheck, Trash2 } from 'lucide-react';
import { NotificationItem } from '../molecules/NotificationItem';
import type { Notification } from '../../actions';

interface Props {
  notifications: Notification[];
  unreadCount: number;
  isSelectMode: boolean;
  selectedIds: string[];
  hasMore: boolean;
  isFetchingMore: boolean;
  sentinelRef: (node: HTMLDivElement | null) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onToggleSelectMode: () => void;
  onToggleSelected: (id: string) => void;
  onDeleteSelected: () => void;
  onOpenDetail: (notification: Notification) => void;
}

export function NotificationCard({
  notifications,
  unreadCount,
  isSelectMode,
  selectedIds,
  hasMore,
  isFetchingMore,
  sentinelRef,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onToggleSelectMode,
  onToggleSelected,
  onDeleteSelected,
  onOpenDetail,
}: Props) {
  return (
    <Card className="bg-background rounded-none h-screen">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            알림 목록
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1"
              >
                <CheckCheck className="size-4" />
                모두 읽음
              </Button>
            )}
            <Button
              size="sm"
              variant={isSelectMode ? 'default' : 'outline'}
              onClick={onToggleSelectMode}
              className="flex items-center gap-1"
            >
              {isSelectMode ? (
                <SquareCheck className="size-4" />
              ) : (
                <>
                  <Square className="size-4" />
                  선택
                </>
              )}
            </Button>
            {isSelectMode && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onDeleteSelected}
                disabled={selectedIds.length === 0}
                className="flex items-center gap-1"
              >
                <Trash2 className="size-4" />
                {selectedIds.length}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="size-12 mx-auto mb-4 opacity-50" />
            <p>알림이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.notification_id}
                notification={notification}
                isSelectMode={isSelectMode}
                isSelected={selectedIds.includes(notification.notification_id)}
                onToggleSelect={onToggleSelected}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                onOpenDetail={onOpenDetail}
              />
            ))}
            <div ref={sentinelRef} className="h-1" />
            {isFetchingMore && (
              <p className="text-center text-sm text-muted-foreground py-4">
                불러오는 중...
              </p>
            )}
            {!hasMore && (
              <p className="text-center text-xs text-muted-foreground py-4">
                모든 알림을 불러왔습니다
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
