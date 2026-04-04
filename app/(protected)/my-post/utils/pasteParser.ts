import type { WorkPart, WorkShift } from '../types';

export type ParsedPost = {
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
};

// ── Helpers ────────────────────────────────────────────────────────────

const getVal = (line: string): string => {
  const idx = line.indexOf(':');
  return idx === -1 ? '' : line.slice(idx + 1).trim();
};

const parsePayType = (s: string): WorkPart['pay_type'] => {
  if (s.includes('시급')) return 'hourly';
  if (s.includes('주급')) return 'weekly';
  if (s.includes('월급')) return 'monthly';
  return 'daily';
};

const parseAmount = (s: string): number => {
  const m = s.match(/(\d[\d,]*)/);
  return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
};

const parseTime = (s: string): { start: string; end: string } => {
  const m = s.match(/(\d{1,2}:\d{2})\s*[~～-]\s*(\d{1,2}:\d{2})/);
  return m ? { start: m[1], end: m[2] } : { start: '', end: '' };
};

const parseShiftDate = (s: string): { date: string; date_end?: string } => {
  const rangeM = s.match(/(\d{4}-\d{2}-\d{2})\s*[~～]\s*(\d{4}-\d{2}-\d{2})/);
  if (rangeM) return { date: rangeM[1], date_end: rangeM[2] };
  const singleM = s.match(/\d{4}-\d{2}-\d{2}/);
  return singleM ? { date: singleM[0] } : { date: '' };
};

// ── Section parsers ────────────────────────────────────────────────────

const parsePartSection = (content: string): WorkPart => {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);

  const part: WorkPart = {
    name: '',
    description: '',
    location: '',
    pay_type: 'daily',
    pay_amount: 0,
    recruit_count: 1,
    tax_withholding: false,
    meal_included: false,
    meal_amount: 0,
    shifts: [],
  };

  let sharedStart = '';
  let sharedEnd = '';
  let inDates = false;

  for (const line of lines) {
    if (/^(이름|파트이름)\s*:/.test(line)) {
      part.name = getVal(line);
      inDates = false;
    } else if (/^내용\s*:/.test(line)) {
      part.description = getVal(line);
      inDates = false;
    } else if (/^(장소|위치|근무지)\s*:/.test(line)) {
      part.location = getVal(line);
      inDates = false;
    } else if (/^인원\s*:/.test(line)) {
      const n = parseInt(getVal(line), 10);
      if (!isNaN(n) && n > 0) part.recruit_count = n;
      inDates = false;
    } else if (/^급여\s*:/.test(line)) {
      const val = getVal(line);
      part.pay_type = parsePayType(val);
      part.pay_amount = parseAmount(val);
      inDates = false;
    } else if (/^원천징수\s*:/.test(line)) {
      const val = getVal(line).trim();
      part.tax_withholding =
        ['예', 'yes', 'true', 'o', '○'].includes(val.toLowerCase()) ||
        val.includes('3.3');
      inDates = false;
    } else if (/^식대\s*:/.test(line)) {
      const amount = parseAmount(getVal(line));
      if (amount > 0) {
        part.meal_included = true;
        part.meal_amount = amount;
      }
      inDates = false;
    } else if (/^시간\s*:/.test(line)) {
      const t = parseTime(getVal(line));
      sharedStart = t.start;
      sharedEnd = t.end;
      inDates = false;
    } else if (/^날짜\s*:?\s*$/.test(line)) {
      inDates = true;
    } else if (inDates && line.startsWith('-')) {
      const parsed = parseShiftDate(line.slice(1).trim());
      if (parsed.date) {
        const shift: WorkShift = { date: parsed.date, start: '', end: '' };
        if (parsed.date_end !== undefined) shift.date_end = parsed.date_end;
        part.shifts.push(shift);
      }
    } else {
      inDates = false;
    }
  }

  // 시간은 어떤 순서로 나와도 모든 shift에 적용
  part.shifts = part.shifts.map((s) => ({
    ...s,
    start: s.start || sharedStart,
    end: s.end || sharedEnd,
  }));

  if (part.shifts.length === 0) {
    part.shifts = [{ date: '', start: sharedStart, end: sharedEnd }];
  }

  return part;
};

const parseManagerSection = (content: string) => {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  let name = '';
  let phone = '';
  for (const line of lines) {
    if (/^이름\s*:/.test(line)) name = getVal(line);
    else if (/^(연락처|전화|전화번호)\s*:/.test(line)) phone = getVal(line);
  }
  // 연락처 키 없이 전화번호 패턴만 있을 경우 폴백
  if (!phone) {
    for (const line of lines) {
      const m = line.match(/010[-\s]?\d{4}[-\s]?\d{4}/);
      if (m) { phone = m[0]; break; }
    }
  }
  return { name, phone };
};

const parseAdditionalSection = (content: string) => {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  let current = '';
  const buckets: Record<string, string[]> = {
    equipments: [],
    qualifications: [],
    preferences: [],
    notes: [],
  };

  for (const line of lines) {
    if (/^(복장|준비물)\s*:/.test(line)) {
      current = 'equipments';
      const v = getVal(line); if (v) buckets.equipments.push(v);
    } else if (/^지원자격\s*:/.test(line)) {
      current = 'qualifications';
      const v = getVal(line); if (v) buckets.qualifications.push(v);
    } else if (/^우대사항\s*:/.test(line)) {
      current = 'preferences';
      const v = getVal(line); if (v) buckets.preferences.push(v);
    } else if (/^지원방법\s*:/.test(line)) {
      current = 'notes';
      const v = getVal(line); if (v) buckets.notes.push(v);
    } else if (current) {
      const stripped = line.startsWith('-') ? line.slice(1).trim() : line;
      if (stripped) buckets[current].push(stripped);
    }
  }

  return {
    equipments: buckets.equipments.join('\n').trim(),
    qualifications: buckets.qualifications.join('\n').trim(),
    preferences: buckets.preferences.join('\n').trim(),
    notes: buckets.notes.join('\n').trim(),
  };
};

// ── Main parser ────────────────────────────────────────────────────────

export const parsePastedText = (text: string): ParsedPost => {
  // [헤더] 마커로 섹션 분리
  const sectionPattern = /^\[([^\]]+)\]\s*$/gm;
  const sectionMatches: Array<{ header: string; index: number }> = [];
  let m;
  while ((m = sectionPattern.exec(text)) !== null) {
    sectionMatches.push({ header: m[1].trim(), index: m.index });
  }

  const globalEnd =
    sectionMatches.length > 0 ? sectionMatches[0].index : text.length;
  const globalContent = text.slice(0, globalEnd);

  const sections = sectionMatches.map((s, i) => {
    const start = text.indexOf('\n', s.index) + 1;
    const end =
      i + 1 < sectionMatches.length
        ? sectionMatches[i + 1].index
        : text.length;
    return { header: s.header, content: text.slice(start, end).trim() };
  });

  // 전역 필드 파싱
  const globalLines = globalContent
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  let title = '';
  let description = '';
  let keywords: string[] = [];

  for (const line of globalLines) {
    if (/^공고제목\s*:/.test(line)) title = getVal(line);
    else if (/^키워드\s*:/.test(line)) {
      keywords = getVal(line)
        .split(/[,，]/)
        .map((k) => k.trim())
        .filter(Boolean);
    } else if (/^업무내용\s*:/.test(line)) description = getVal(line);
  }

  if (!title) {
    const first = globalLines.find(
      (l) => !/^(키워드|업무내용)\s*:/.test(l),
    );
    if (first) title = first;
  }

  // 섹션별 파싱
  const workParts: WorkPart[] = [];
  let managerName = '';
  let managerPhone = '';
  let equipments = '';
  let qualifications = '';
  let preferences = '';
  let notes = '';

  for (const section of sections) {
    if (/^파트/.test(section.header)) {
      workParts.push(parsePartSection(section.content));
    } else if (/^담당자/.test(section.header)) {
      const mgr = parseManagerSection(section.content);
      managerName = mgr.name;
      managerPhone = mgr.phone;
    } else if (/^추가정보/.test(section.header)) {
      const add = parseAdditionalSection(section.content);
      equipments = add.equipments;
      qualifications = add.qualifications;
      preferences = add.preferences;
      notes = add.notes;
    }
  }

  return {
    title,
    keywords,
    description,
    workParts,
    managerName,
    managerPhone,
    equipments,
    qualifications,
    preferences,
    notes,
  };
};
