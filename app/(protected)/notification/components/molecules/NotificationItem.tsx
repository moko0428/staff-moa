'use client';

import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  notificationTypeConfig,
  formatNotificationTime,
} from '../../utils/notificationUtils';
import type { Notification } from '../../actions';

interface Props {
  notification: Notification;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (notification: Notification) => void;
}

export function NotificationItem({
  notification,
  isSelectMode,
  isSelected,
  onToggleSelect,
  onMarkAsRead,
  onDelete,
  onOpenDetail,
}: Props) {
  const config =
    notificationTypeConfig[notification.type] ?? notificationTypeConfig.system;
  const IconComponent = config.icon;

  const handleCardClick = () => {
    if (isSelectMode) {
      onToggleSelect(notification.notification_id);
      return;
    }
    onOpenDetail(notification);
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-colors cursor-pointer',
        notification.is_read
          ? 'bg-muted border-border'
          : 'bg-card border-primary/30 shadow-sm',
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-3">
        {isSelectMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(notification.notification_id)}
            className="size-4 shrink-0"
            aria-label="알림 선택"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <div
          className={cn(
            'p-1.5 rounded-full shrink-0',
            notification.is_read ? 'bg-muted' : config.className,
          )}
        >
          <IconComponent
            className={cn(
              'size-3.5',
              notification.is_read ? 'text-muted-foreground' : config.iconClassName,
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Badge
              variant="outline"
              className={cn(
                'text-xs px-1.5 py-0 shrink-0',
                notification.is_read
                  ? 'bg-muted text-muted-foreground'
                  : config.className,
              )}
            >
              {config.label}
            </Badge>
            {!notification.is_read && (
              <span className="size-1.5 bg-red-500 rounded-full shrink-0" />
            )}
            <span className="text-xs text-muted-foreground ml-auto shrink-0">
              {formatNotificationTime(notification.created_at)}
            </span>
          </div>
          <p
            className={cn(
              'text-sm font-medium truncate',
              notification.is_read && 'text-muted-foreground',
            )}
          >
            {notification.title}
          </p>
          <p
            className={cn(
              'text-xs truncate',
              notification.is_read ? 'text-muted-foreground' : 'text-foreground/70',
            )}
          >
            {notification.message}
          </p>
        </div>
        {!isSelectMode && (
          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {notification.link && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                asChild
                onClick={() => {
                  if (!notification.is_read)
                    onMarkAsRead(notification.notification_id);
                }}
              >
                <Link href={notification.link}>보기</Link>
              </Button>
            )}
            {!notification.is_read && (
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={() => onMarkAsRead(notification.notification_id)}
                title="읽음 처리"
              >
                <Check className="size-3.5" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-red-500 hover:text-red-600"
              onClick={() => onDelete(notification.notification_id)}
              title="삭제"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
