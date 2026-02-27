import type { WorkType } from '../types';

export const inferWorkType = (
  slots: Array<{ date: string; work_type?: WorkType }>,
): WorkType => {
  if (!slots || slots.length <= 1) return 'single';

  const explicit = slots.find((s) => s.work_type)?.work_type;
  if (explicit) return explicit;

  const dates = slots
    .map((s) => s.date)
    .filter(Boolean)
    .map((d) => new Date(`${d}T00:00:00`))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length <= 1) return 'single';

  let isContinuous = true;
  for (let i = 1; i < dates.length; i += 1) {
    const diffDays =
      (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays !== 1) {
      isContinuous = false;
      break;
    }
  }
  return isContinuous ? 'range' : 'multi';
};
