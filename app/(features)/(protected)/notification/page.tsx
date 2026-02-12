'use client';

import { useState, useEffect, useCallback } from 'react';
import Hero from '@/app/components/Hero';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  Briefcase,
  AlertCircle,
  Info,
  Square,
  SquareCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseISO } from 'date-fns';
import Link from 'next/link';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  type Notification,
} from './actions';

const notificationTypeConfig = {
  application_accepted: {
    icon: Check,
    label: '지원 승인',
    className:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200',
    iconClassName: 'text-emerald-700 dark:text-emerald-200',
  },
  application_rejected: {
    icon: AlertCircle,
    label: '지원 거절',
    className: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-200',
    iconClassName: 'text-red-700 dark:text-red-200',
  },
  new_application: {
    icon: Briefcase,
    label: '새 지원',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200',
    iconClassName: 'text-blue-700 dark:text-blue-200',
  },
  schedule_reminder: {
    icon: Calendar,
    label: '스케줄 알림',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-200',
    iconClassName: 'text-orange-700 dark:text-orange-200',
  },
  system: {
    icon: Info,
    label: '시스템',
    className: 'bg-muted text-foreground',
    iconClassName: 'text-muted-foreground',
  },
};

export default function NotificationPage() {
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

  // 알림 상태 변경 시 HeaderNav에 알림
  const dispatchNotificationUpdate = useCallback(() => {
    window.dispatchEvent(new CustomEvent('notification-updated'));
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsReadAction(notificationId);
    if (result.ok) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        )
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
      setNotifications((prev) =>
        prev.filter((n) => n.notification_id !== notificationId)
      );
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
    const results = await Promise.all(
      targets.map((id) => deleteNotificationAction(id))
    );
    const deletedIds = targets.filter((_, idx) => results[idx]?.ok);

    if (deletedIds.length > 0) {
      setNotifications((prev) =>
        prev.filter((n) => !deletedIds.includes(n.notification_id))
      );
      setSelectedIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
      dispatchNotificationUpdate();
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const formatKoreanDateTime = (date: Date) => {
    const parts = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? '';

    return `${get('year')}년 ${get('month')}월 ${get('day')}일 ${get('hour')}:${get('minute')}`;
  };

  const formatNotificationTime = (createdAt: string) => {
    const created = parseISO(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();

    if (Number.isNaN(created.getTime()) || diffMs < 0) {
      return formatKoreanDateTime(created);
    }

    const minuteMs = 60 * 1000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;
    const monthMs = 30 * dayMs;

    if (diffMs < minuteMs) return '방금 전';
    if (diffMs < hourMs) return `${Math.floor(diffMs / minuteMs)}분 전`;
    if (diffMs < dayMs) return `${Math.floor(diffMs / hourMs)}시간 전`;
    if (diffMs < monthMs) return `${Math.floor(diffMs / dayMs)}일 전`;

    return formatKoreanDateTime(created);
  };

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
        <Card>
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
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1"
                  >
                    <CheckCheck className="size-4" />
                    모두 읽음
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={isSelectMode ? 'default' : 'outline'}
                  onClick={handleToggleSelectMode}
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
                    onClick={handleDeleteSelected}
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
          <CardContent className="max-h-[calc(100vh-280px)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="size-12 mx-auto mb-4 opacity-50" />
                <p>알림이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const config = notificationTypeConfig[notification.type];
                  const IconComponent = config.icon;

                  return (
                    <div
                      key={notification.notification_id}
                      className={cn(
                        'p-4 rounded-lg border transition-colors',
                        notification.is_read
                          ? 'bg-muted border-border'
                          : 'bg-card border-primary/30 shadow-sm'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {isSelectMode && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(
                              notification.notification_id
                            )}
                            onChange={() =>
                              handleToggleSelected(notification.notification_id)
                            }
                            className="mt-1 size-4"
                            aria-label="알림 선택"
                          />
                        )}
                        <div
                          className={cn(
                            'p-2 rounded-full',
                            notification.is_read ? 'bg-muted' : config.className
                          )}
                        >
                          <IconComponent
                            className={cn(
                              'size-4',
                              notification.is_read
                                ? 'text-muted-foreground'
                                : config.iconClassName
                            )}
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
                                    notification.is_read
                                      ? 'bg-muted text-muted-foreground'
                                      : config.className
                                  )}
                                >
                                  {config.label}
                                </Badge>
                                {!notification.is_read && (
                                  <span className="size-2 bg-red-500 rounded-full" />
                                )}
                              </div>
                              <h3
                                className={cn(
                                  'font-semibold text-sm',
                                  notification.is_read &&
                                    'text-muted-foreground'
                                )}
                              >
                                {notification.title}
                              </h3>
                              <p
                                className={cn(
                                  'text-sm mt-1',
                                  notification.is_read
                                    ? 'text-muted-foreground'
                                    : 'text-foreground'
                                )}
                              >
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
                                    if (!notification.is_read) {
                                      handleMarkAsRead(
                                        notification.notification_id
                                      );
                                    }
                                  }}
                                >
                                  <Link href={notification.link}>보기</Link>
                                </Button>
                              )}
                              {!notification.is_read && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleMarkAsRead(
                                      notification.notification_id
                                    )
                                  }
                                  title="읽음 처리"
                                >
                                  <Check className="size-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleDelete(notification.notification_id)
                                }
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
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
