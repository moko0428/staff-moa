import { Check, AlertCircle, Briefcase, Calendar, Info, MapPin } from 'lucide-react';

export const notificationTypeConfig = {
  application_accepted: {
    icon: Check,
    label: '지원 승인',
    shortLabel: '지원',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
  },
  application_rejected: {
    icon: AlertCircle,
    label: '지원 거절',
    shortLabel: '지원',
    className: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-200',
    iconClassName: 'text-red-600 dark:text-red-400',
  },
  new_application: {
    icon: Briefcase,
    label: '새 지원',
    shortLabel: '지원',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200',
    iconClassName: 'text-blue-600 dark:text-blue-400',
  },
  schedule_reminder: {
    icon: Calendar,
    label: '스케줄 알림',
    shortLabel: '스케줄',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
  },
  system: {
    icon: Info,
    label: '시스템',
    shortLabel: '시스템',
    className: 'bg-muted text-foreground',
    iconClassName: 'text-muted-foreground',
  },
  event_briefing: {
    icon: MapPin,
    label: '공고',
    shortLabel: '공고',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200',
    iconClassName: 'text-blue-600 dark:text-blue-400',
  },
} as const;

export type NotificationType = keyof typeof notificationTypeConfig;

export type FilterType = 'all' | 'unread' | 'application' | 'post' | 'schedule' | 'evaluation' | 'payment';

export const filterConfig: Array<{ id: FilterType; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'unread', label: '안읽음' },
  { id: 'application', label: '지원' },
  { id: 'post', label: '공고' },
  { id: 'schedule', label: '스케줄' },
  { id: 'evaluation', label: '평가' },
  { id: 'payment', label: '결제' },
];

export const actionLabelConfig: Partial<Record<string, string>> = {
  application_accepted: '스케줄 확인하기',
  application_rejected: '지원 내역 보기',
  new_application: '지원자 보기',
  schedule_reminder: '일정 보기',
  system: '자세히 보기',
  event_briefing: '공고 보기',
};

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
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();

  if (Number.isNaN(created.getTime()) || diffMs < 0) {
    return formatKoreanDateTime(created);
  }

  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;

  if (diffMs < minuteMs) return '방금';
  if (diffMs < hourMs) return `${Math.floor(diffMs / minuteMs)}분 전`;

  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const createdMidnight = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const dayDiff = Math.round(
    (nowMidnight.getTime() - createdMidnight.getTime()) / (24 * hourMs)
  );

  if (dayDiff === 0) {
    const h = String(created.getHours()).padStart(2, '0');
    const m = String(created.getMinutes()).padStart(2, '0');
    return `오늘 ${h}:${m}`;
  }
  if (dayDiff === 1) return '어제';
  if (dayDiff < 30) return `${dayDiff}일 전`;

  return formatKoreanDateTime(created);
}

export function getTimeGroup(createdAt: string): '오늘' | '어제' | '이전' {
  const created = new Date(createdAt);
  const now = new Date();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const createdMidnight = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const dayDiff = Math.round(
    (nowMidnight.getTime() - createdMidnight.getTime()) / (24 * 60 * 60 * 1000)
  );
  if (dayDiff === 0) return '오늘';
  if (dayDiff === 1) return '어제';
  return '이전';
}
