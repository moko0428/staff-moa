import { parseISO, format, eachDayOfInterval } from 'date-fns';

/**
 * 날짜 문자열을 날짜 배열로 변환
 * - 단일 날짜: '2024-11-28'
 * - 기간: '2024-11-25~2024-12-01'
 * - 여러 날짜: '2024-11-28, 2024-11-29, 2024-11-30'
 */
export function parseDateString(dateStr: string): string[] {
  const trimmed = dateStr.trim();

  // 기간 스케줄 (시작일~종료일)
  if (trimmed.includes('~')) {
    const [startStr, endStr] = trimmed.split('~').map((d) => d.trim());
    try {
      const startDate = parseISO(startStr);
      const endDate = parseISO(endStr);
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const dates = eachDayOfInterval({ start: startDate, end: endDate });
        return dates.map((date) => format(date, 'yyyy-MM-dd'));
      }
    } catch {
      return [];
    }
    return [];
  }

  // 여러 날짜 스케줄 (쉼표로 구분)
  if (trimmed.includes(',')) {
    return trimmed
      .split(',')
      .map((d) => d.trim())
      .filter((d) => {
        try {
          const date = parseISO(d);
          return !isNaN(date.getTime());
        } catch {
          return false;
        }
      });
  }

  // 당일 스케줄
  try {
    const date = parseISO(trimmed);
    if (!isNaN(date.getTime())) {
      return [format(date, 'yyyy-MM-dd')];
    }
  } catch {
    return [];
  }

  return [];
}
