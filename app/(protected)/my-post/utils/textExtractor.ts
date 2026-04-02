import type { WorkSlot } from '../types';

interface ExtractParams {
  title: string;
  description: string;
  workSlots: WorkSlot[];
  recruitCount: number;
  managerName: string;
  managerPhone: string;
  equipments: string;
  qualifications: string;
  preferences: string;
  notes: string;
}

const PAY_TYPE_LABEL: Record<WorkSlot['pay_type'], string> = {
  hourly: '시급',
  daily: '일급',
  weekly: '주급',
  monthly: '월급',
};

export const extractPostText = (params: ExtractParams): string => {
  const lines: string[] = [];

  if (params.title) {
    lines.push(params.title);
    lines.push('');
  }

  const slot = params.workSlots[0];
  const isMultiSlot = params.workSlots.length > 1;

  if (isMultiSlot) {
    lines.push('📅 일시:');
    for (const ws of params.workSlots) {
      if (ws.date) {
        const firstPart = ws.parts?.[0];
        const timeStr =
          firstPart?.start && firstPart?.end
            ? ` ${firstPart.start}~${firstPart.end}`
            : '';
        lines.push(`- ${ws.date}${timeStr}`);
      }
    }
  } else if (slot) {
    const firstPart = slot.parts?.[0];
    const timeStr =
      firstPart?.start && firstPart?.end
        ? ` ${firstPart.start}~${firstPart.end}`
        : '';
    if (slot.date || timeStr) {
      lines.push(`📅 일시: ${slot.date}${timeStr}`);
    }
  }

  if (slot?.location) {
    lines.push(`🏢 장소: ${slot.location}`);
  }

  if (slot && slot.pay_amount > 0) {
    const label = PAY_TYPE_LABEL[slot.pay_type] ?? '급여';
    const taxStr = slot.tax_withholding ? ' (3.3% 원천징수)' : '';
    lines.push(`💵 ${label}: ${slot.pay_amount.toLocaleString()}원${taxStr}`);
    if (slot.meal_included && slot.meal_amount > 0) {
      lines.push(`🍱 식비: ${slot.meal_amount.toLocaleString()}원 포함`);
    }
  }

  if (params.recruitCount > 0) {
    lines.push(`🧑 인원: ${params.recruitCount}명`);
  }

  if (params.description) {
    lines.push('');
    lines.push('⌨️ 업무:');
    lines.push(params.description);
  }

  if (params.equipments) {
    lines.push('');
    lines.push(`👔 복장: ${params.equipments}`);
  }

  if (params.qualifications) {
    lines.push('');
    lines.push('지원자격:');
    lines.push(params.qualifications);
  }

  if (params.preferences) {
    lines.push('');
    lines.push('우대사항:');
    lines.push(params.preferences);
  }

  if (params.managerName || params.managerPhone) {
    lines.push('');
    const contact = [params.managerName, params.managerPhone]
      .filter(Boolean)
      .join(' ');
    lines.push(`담당자: ${contact}`);
  }

  if (params.notes) {
    lines.push('');
    lines.push('지원방법:');
    lines.push(params.notes);
  }

  return lines.join('\n').trim();
};
