'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  notificationTypeConfig,
  formatNotificationTime,
} from '../../utils/notificationUtils';
import type { Notification } from '../../actions';

interface Props {
  notification: Notification | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function NotificationDetailModal({ notification, onClose, onDelete }: Props) {
  if (!notification) return null;

  const config =
    notificationTypeConfig[notification.type] ?? notificationTypeConfig.system;
  const IconComponent = config.icon;

  return (
    <Dialog open={!!notification} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className={cn('p-1.5 rounded-full shrink-0', config.className)}>
              <IconComponent className={cn('size-4', config.iconClassName)} />
            </div>
            <span className="leading-snug">{notification.title}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', config.className)}>
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatNotificationTime(notification.created_at)}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {notification.message}
          </p>
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(notification.notification_id);
                onClose();
              }}
            >
              삭제
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                닫기
              </Button>
              {notification.link && (
                <Button size="sm" asChild>
                  <Link href={notification.link} onClick={onClose}>
                    보기
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
