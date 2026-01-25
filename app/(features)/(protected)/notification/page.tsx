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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
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
    className: 'bg-green-100 text-green-700',
    iconClassName: 'text-green-600',
  },
  application_rejected: {
    icon: AlertCircle,
    label: '지원 거절',
    className: 'bg-red-100 text-red-700',
    iconClassName: 'text-red-600',
  },
  new_application: {
    icon: Briefcase,
    label: '새 지원',
    className: 'bg-blue-100 text-blue-700',
    iconClassName: 'text-blue-600',
  },
  schedule_reminder: {
    icon: Calendar,
    label: '스케줄 알림',
    className: 'bg-orange-100 text-orange-700',
    iconClassName: 'text-orange-600',
  },
  system: {
    icon: Info,
    label: '시스템',
    className: 'bg-gray-100 text-gray-700',
    iconClassName: 'text-gray-600',
  },
};

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsReadAction(notificationId);
    if (result.ok) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        )
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsReadAction();
    if (result.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const handleDelete = async (notificationId: string) => {
    const result = await deleteNotificationAction(notificationId);
    if (result.ok) {
      setNotifications((prev) =>
        prev.filter((n) => n.notification_id !== notificationId)
      );
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <div>
        <Hero title="알림" description="새로운 소식을 확인하세요" />
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-gray-500">로딩 중...</p>
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
                  <Badge className="bg-red-500 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
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
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
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
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-white border-primary/20 shadow-sm'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-full',
                            notification.is_read ? 'bg-gray-200' : config.className
                          )}
                        >
                          <IconComponent
                            className={cn(
                              'size-4',
                              notification.is_read ? 'text-gray-500' : config.iconClassName
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
                                      ? 'bg-gray-100 text-gray-600'
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
                                  notification.is_read && 'text-gray-600'
                                )}
                              >
                                {notification.title}
                              </h3>
                              <p
                                className={cn(
                                  'text-sm mt-1',
                                  notification.is_read
                                    ? 'text-gray-500'
                                    : 'text-gray-700'
                                )}
                              >
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {format(
                                  parseISO(notification.created_at),
                                  'yyyy년 MM월 dd일 HH:mm',
                                  { locale: ko }
                                )}
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
                                      handleMarkAsRead(notification.notification_id);
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
                                    handleMarkAsRead(notification.notification_id)
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
