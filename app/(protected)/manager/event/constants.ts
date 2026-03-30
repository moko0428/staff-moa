import type { MovementStatus, StaffPosition, CoManagerRole, ScheduleStatus } from './types';

export const POSITION_CONFIG: Record<
  StaffPosition,
  { label: string; dot: string; showDot: boolean; badge: string; cardBg: string }
> = {
  waiting: {
    label: '대기',
    dot: 'bg-gray-400',
    showDot: true,
    badge:
      'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    cardBg: '',
  },
  assigned: {
    label: '배치완료',
    dot: 'bg-green-400',
    showDot: false,
    badge:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    cardBg: 'bg-green-50/60 dark:bg-green-900/10',
  },
};

export const MOVEMENT_CONFIG: Record<
  MovementStatus,
  { label: string; dot: string; showDot: boolean; badge: string }
> = {
  departing: {
    label: '출발',
    dot: 'bg-amber-400',
    showDot: true,
    badge:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  },
  arrived: {
    label: '도착',
    dot: 'bg-blue-400',
    showDot: false,
    badge:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  },
  checked_in: {
    label: '출근',
    dot: 'bg-emerald-400',
    showDot: true,
    badge:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  },
  checked_out: {
    label: '퇴근',
    dot: 'bg-gray-400',
    showDot: true,
    badge:
      'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  },
};

export const CO_MANAGER_ROLE_COLORS: Record<CoManagerRole, string> = {
  팀장: 'bg-primary/10 text-primary border-primary/20',
  '보조 매니저': 'bg-muted text-muted-foreground border-border',
};

export const CO_MANAGER_ROLES: CoManagerRole[] = ['팀장', '보조 매니저'];

export const SCHEDULE_STATUS_DOT: Record<ScheduleStatus, { dot: string; label: string }> = {
  upcoming: { dot: 'bg-blue-400', label: '예정' },
  ongoing:  { dot: 'bg-green-400', label: '진행중' },
  completed: { dot: 'bg-gray-400', label: '종료' },
};

export const QUICK_TEMPLATES = [
  '곧 행사가 시작됩니다',
  '배치 장소로 이동해주세요',
  '잠시 대기해주세요',
  '수고 많으셨습니다',
];
