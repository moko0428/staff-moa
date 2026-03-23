import { Check, AlertCircle, Briefcase, Calendar, Info, MapPin } from 'lucide-react';
import { parseISO } from 'date-fns';

export const notificationTypeConfig = {
  application_accepted: {
    icon: Check,
    label: '지원 승인',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200',
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
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200',
    iconClassName: 'text-blue-700 dark:text-blue-200',
  },
  schedule_reminder: {
    icon: Calendar,
    label: '스케줄 알림',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-200',
    iconClassName: 'text-orange-700 dark:text-orange-200',
  },
  system: {
    icon: Info,
    label: '시스템',
    className: 'bg-muted text-foreground',
    iconClassName: 'text-muted-foreground',
  },
  event_briefing: {
    icon: MapPin,
    label: '현장 공지',
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-950/30 dark:text-violet-200',
    iconClassName: 'text-violet-700 dark:text-violet-200',
  },
} as const;

export type NotificationType = keyof typeof notificationTypeConfig;

function formatKoreanDateTime(date: Date): string {
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
}

export function formatNotificationTime(createdAt: string): string {
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
}
