import type { WorkPart } from '../types';

interface ExtractParams {
  title: string;
  keywords: string[];
  description: string;
  workParts: WorkPart[];
  managerName: string;
  managerPhone: string;
  equipments: string;
  qualifications: string;
  preferences: string;
  notes: string;
}

const PAY_TYPE_LABEL: Record<WorkPart['pay_type'], string> = {
  hourly: '시급',
  daily: '일급',
  weekly: '주급',
  monthly: '월급',
};

export const extractPostText = (params: ExtractParams): string => {
  const lines: string[] = [];

  if (params.title) lines.push(`공고제목: ${params.title}`);
  if (params.keywords.length > 0)
    lines.push(`키워드: ${params.keywords.join(', ')}`);
  if (params.description) lines.push(`업무내용: ${params.description}`);
  if (params.title || params.keywords.length > 0 || params.description)
    lines.push('');

  for (let i = 0; i < params.workParts.length; i++) {
    const part = params.workParts[i];
    lines.push(`[파트${i + 1}]`);
    if (part.name) lines.push(`이름: ${part.name}`);
    if (part.description) lines.push(`내용: ${part.description}`);

    const firstShift = part.shifts[0];
    if (firstShift?.start && firstShift?.end)
      lines.push(`시간: ${firstShift.start} ~ ${firstShift.end}`);
    if (part.location) lines.push(`장소: ${part.location}`);
    lines.push(`인원: ${part.recruit_count}`);

    if (part.pay_amount > 0) {
      const label = PAY_TYPE_LABEL[part.pay_type];
      lines.push(`급여: ${label} ${part.pay_amount.toLocaleString()}`);
      if (part.tax_withholding) lines.push('원천징수: 예');
      if (part.meal_included && part.meal_amount > 0)
        lines.push(`식대: ${part.meal_amount.toLocaleString()}`);
    }

    if (part.shifts.some((s) => s.date)) {
      lines.push('날짜:');
      for (const shift of part.shifts) {
        if (!shift.date) continue;
        if (shift.date_end) lines.push(`- ${shift.date} ~ ${shift.date_end}`);
        else lines.push(`- ${shift.date}`);
      }
    }
    lines.push('');
  }

  if (params.managerName || params.managerPhone) {
    lines.push('[담당자]');
    if (params.managerName) lines.push(`이름: ${params.managerName}`);
    if (params.managerPhone) lines.push(`연락처: ${params.managerPhone}`);
    lines.push('');
  }

  const hasAdditional =
    params.equipments ||
    params.qualifications ||
    params.preferences ||
    params.notes;

  if (hasAdditional) {
    lines.push('[추가정보]');
    if (params.equipments) lines.push(`복장: ${params.equipments}`);
    if (params.qualifications)
      lines.push(`지원자격: ${params.qualifications}`);
    if (params.preferences) lines.push(`우대사항: ${params.preferences}`);
    if (params.notes) lines.push(`지원방법: ${params.notes}`);
  }

  return lines.join('\n').trim();
};
