'use client';

import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { notificationTypeConfig, formatNotificationTime } from '../../utils/notificationUtils';
import type { Notification } from '../../actions';

interface Props {
  notification: Notification;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationItem({
  notification,
  isSelectMode,
  isSelected,
  onToggleSelect,
  onMarkAsRead,
  onDelete,
}: Props) {
  const config = notificationTypeConfig[notification.type] ?? notificationTypeConfig.system;
  const IconComponent = config.icon;

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-colors',
        notification.is_read ? 'bg-muted border-border' : 'bg-card border-primary/30 shadow-sm'
      )}
    >
      <div className="flex items-start gap-3">
        {isSelectMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(notification.notification_id)}
            className="mt-1 size-4"
            aria-label="알림 선택"
          />
        )}
        <div className={cn('p-2 rounded-full', notification.is_read ? 'bg-muted' : config.className)}>
          <IconComponent
            className={cn('size-4', notification.is_read ? 'text-muted-foreground' : config.iconClassName)}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    notification.is_read ? 'bg-muted text-muted-foreground' : config.className
                  )}
                >
                  {config.label}
                </Badge>
                {!notification.is_read && <span className="size-2 bg-red-500 rounded-full" />}
              </div>
              <h3 className={cn('font-semibold text-sm', notification.is_read && 'text-muted-foreground')}>
                {notification.title}
              </h3>
              <p className={cn('text-sm mt-1', notification.is_read ? 'text-muted-foreground' : 'text-foreground')}>
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatNotificationTime(notification.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {notification.link && (
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                  onClick={() => {
                    if (!notification.is_read) onMarkAsRead(notification.notification_id);
                  }}
                >
                  <Link href={notification.link}>보기</Link>
                </Button>
              )}
              {!notification.is_read && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onMarkAsRead(notification.notification_id)}
                  title="읽음 처리"
                >
                  <Check className="size-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(notification.notification_id)}
                className="text-red-500 hover:text-red-600"
                title="삭제"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
