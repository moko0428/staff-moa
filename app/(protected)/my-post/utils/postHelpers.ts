import type { WorkPart, WorkType } from '../types';

export const inferWorkType = (parts: WorkPart[]): WorkType => {
  if (!parts || parts.length === 0) return 'single';

  const allShifts = parts.flatMap((p) => p.shifts ?? []);

  // date_end가 있는 shift가 하나라도 있으면 기간 근무 → range
  if (allShifts.some((s) => s.date_end !== undefined)) return 'range';

  // 모든 파트의 모든 shift 날짜 수집
  const allDates = allShifts.map((s) => s.date).filter(Boolean);

  const uniqueDates = Array.from(new Set(allDates));

  if (uniqueDates.length <= 1) return 'single';

  const sortedDates = uniqueDates
    .map((d) => new Date(`${d}T00:00:00`))
    .sort((a, b) => a.getTime() - b.getTime());

  let isContinuous = true;
  for (let i = 1; i < sortedDates.length; i += 1) {
    const diffDays =
      (sortedDates[i]!.getTime() - sortedDates[i - 1]!.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays !== 1) {
      isContinuous = false;
      break;
    }
  }
  return isContinuous ? 'range' : 'multi';
};
