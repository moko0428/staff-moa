import type { WorkPart } from '../types';

interface ExtractParams {
  title: string;
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

  if (params.title) {
    lines.push(params.title);
    lines.push('');
  }

  if (params.workParts.length > 0) {
    for (const part of params.workParts) {
      const partLabel = part.name || '근무';
      lines.push(`[${partLabel}]`);
      if (part.description) {
        lines.push(part.description);
      }
      if (part.location) {
        lines.push(`🏢 장소: ${part.location}`);
      }
      if (part.pay_amount > 0) {
        const label = PAY_TYPE_LABEL[part.pay_type] ?? '급여';
        const taxStr = part.tax_withholding ? ' (3.3% 원천징수)' : '';
        lines.push(`💵 ${label}: ${part.pay_amount.toLocaleString()}원${taxStr}`);
        if (part.meal_included && part.meal_amount > 0) {
          lines.push(`🍱 식비: ${part.meal_amount.toLocaleString()}원 포함`);
        }
      }
      if (part.recruit_count > 0) {
        lines.push(`🧑 인원: ${part.recruit_count}명`);
      }
      if (part.shifts.length > 0) {
        lines.push('📅 일정:');
        for (const shift of part.shifts) {
          const timeStr = shift.start && shift.end ? ` ${shift.start}~${shift.end}` : '';
          if (shift.date) {
            lines.push(`- ${shift.date}${timeStr}`);
          }
        }
      }
      lines.push('');
    }

    const totalRecruit = params.workParts.reduce((acc, p) => acc + p.recruit_count, 0);
    if (params.workParts.length > 1 && totalRecruit > 0) {
      lines.push(`총 모집인원: ${totalRecruit}명`);
      lines.push('');
    }
  }

  if (params.description) {
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
