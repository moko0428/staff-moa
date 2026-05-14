'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  notificationTypeConfig,
  formatNotificationTime,
  actionLabelConfig,
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
  onOpenDetail,
}: Props) {
  const config = notificationTypeConfig[notification.type] ?? notificationTypeConfig.system;
  const IconComponent = config.icon;
  const actionLabel = actionLabelConfig[notification.type];

  const handleClick = () => {
    if (isSelectMode) {
      onToggleSelect(notification.notification_id);
      return;
    }
    onOpenDetail(notification);
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-4 cursor-pointer transition-colors',
        notification.is_read ? 'bg-background' : 'bg-background',
        isSelected && 'bg-accent/40'
      )}
      onClick={handleClick}
    >
      {isSelectMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(notification.notification_id)}
          className="mt-3 size-4 shrink-0"
          aria-label="알림 선택"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* 아이콘 + 안읽음 닷 */}
      <div className="relative shrink-0 mt-0.5">
        <div
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center',
            notification.is_read
              ? 'bg-muted'
              : config.className
          )}
        >
          <IconComponent
            className={cn(
              'size-5',
              notification.is_read ? 'text-muted-foreground' : config.iconClassName
            )}
          />
        </div>
        {!notification.is_read && (
          <span className="absolute -top-0.5 -right-0.5 size-2.5 bg-red-500 rounded-full border-2 border-background" />
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={cn(
              'text-xs font-semibold',
              notification.is_read ? 'text-muted-foreground' : config.iconClassName
            )}
          >
            {config.shortLabel}
          </span>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">
            {formatNotificationTime(notification.created_at)}
          </span>
        </div>

        <p
          className={cn(
            'text-sm leading-snug',
            notification.is_read
              ? 'font-medium text-muted-foreground'
              : 'font-bold text-foreground'
          )}
        >
          {notification.title}
        </p>

        {notification.message && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
            {notification.message}
          </p>
        )}

        {notification.link && actionLabel && (
          <Link
            href={notification.link}
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-semibold mt-1.5',
              notification.is_read ? 'text-muted-foreground' : 'text-primary'
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (!notification.is_read) onMarkAsRead(notification.notification_id);
            }}
          >
            {actionLabel} &rsaquo;
          </Link>
        )}
      </div>
    </div>
  );
}
