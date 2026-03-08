import { parseISO } from 'date-fns';

export const formatKstDateTime = (input: string | Date): string => {
  const date = typeof input === 'string' ? parseISO(input) : input;
  if (Number.isNaN(date.getTime())) return '-';
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
  return `${get('year')}.${get('month')}.${get('day')} ${get('hour')}:${get('minute')}`;
};

export const formatNumberWithComma = (value: string | number | undefined): string => {
  if (!value) return '0';
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) return String(value);
  return numeric.toLocaleString('ko-KR');
};

export const getPayTypeLabel = (payType?: string): string => {
  switch (payType) {
    case 'hourly':
      return '시급';
    case 'daily':
      return '일급';
    case 'weekly':
      return '주급';
    case 'monthly':
      return '월급';
    default:
      return '';
  }
};

export const getStatusBadge = (status: string): { label: string; className: string } => {
  switch (status) {
    case 'urgent':
      return { label: '급구', className: 'bg-red-100 text-red-700 border-red-200' };
    case 'completed':
      return { label: '모집완료', className: 'bg-muted text-muted-foreground border-border' };
    default:
      return { label: '모집중', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  }
};
