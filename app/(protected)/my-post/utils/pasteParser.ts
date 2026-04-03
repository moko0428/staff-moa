type ParsedPost = {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  equipments: string;
  qualifications: string;
  preferences: string;
  recruitCount: number;
  payAmount: number;
  payType: 'hourly' | 'daily' | 'weekly' | 'monthly';
  taxWithholding: boolean;
  managerName: string;
  managerPhone: string;
  notes: string;
  keyword: string;
};

export const parsePastedText = (text: string): ParsedPost => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line);
  const fullText = text;

  let parsedTitle = '';
  let keywordFromTitle = '';

  const bracketMatch = fullText.match(/^\[([^\]]+)\]/);
  if (bracketMatch) {
    keywordFromTitle = bracketMatch[1];
  }

  const titlePatterns = [
    /[^.\n]*[스탭|알바|직원|인력|채용|모집|구인][^.\n]*/,
    /[^.\n]*[일|시|시간|기간][^.\n]*[근무|알바|스탭][^.\n]*/,
  ];

  for (const pattern of titlePatterns) {
    const match = fullText.match(pattern);
    if (match && match[0].length > 5 && match[0].length < 100) {
      parsedTitle = match[0].trim();
      break;
    }
  }

  if (!parsedTitle && lines[0]) {
    const firstLine = lines[0]
      .replace(/^\[.+\]\s*/, '')
      .replace(/^📣\s*/, '');
    if (firstLine.length > 5 && firstLine.length < 100) {
      parsedTitle = firstLine;
    }
  }

  if (!parsedTitle) {
    parsedTitle = '공고 제목';
  }

  type PasteSection =
    | 'none'
    | 'work'
    | 'equipments'
    | 'qualifications'
    | 'preferences'
    | 'notes';

  const stripPrefix = (line: string) =>
    line
      .replace(/^[\s•\-\*\u2022]*/g, '')
      .replace(/^[✳️‼️⭕️✅☑️]+/g, '')
      .trim();

  const splitAfterColon = (s: string) => {
    const idx1 = s.indexOf(':');
    const idx2 = s.indexOf('：');
    const idx =
      idx1 === -1 ? idx2 : idx2 === -1 ? idx1 : Math.min(idx1, idx2);
    if (idx === -1) return { left: s.trim(), right: '' };
    return { left: s.slice(0, idx).trim(), right: s.slice(idx + 1).trim() };
  };

  const isMetaHeaderLine = (clean: string) => {
    const metaKeys = [
      '행사명',
      '날짜',
      '시간',
      '장소',
      '위치',
      '근무지',
      '주소',
      '급여',
      '페이',
      '급여 지급',
      '지급',
      '담당자',
      '연락처',
      '인원',
      '모집',
      '모집인원',
    ];
    const { left } = splitAfterColon(clean);
    return metaKeys.some((k) =>
      left.replace(/\s/g, '').startsWith(k.replace(/\s/g, '')),
    );
  };

  const detectSectionHeader = (rawLine: string): PasteSection => {
    const clean = stripPrefix(rawLine);
    const { left } = splitAfterColon(clean);
    const key = left.replace(/\s/g, '');

    if (
      /^(지원(방식|방법|형식|양식)|지원방식|지원방법|지원형식|지원양식|지원안내|문의|안내|기타사항|기타)$/.test(
        key,
      )
    ) {
      return 'notes';
    }

    if (
      /^(지원자격|지원자격요건|지원자격조건|자격요건|자격조건|자격|요건|조건)$/.test(
        key,
      )
    ) {
      return 'qualifications';
    }

    if (/^(우대사항|우대|선호)$/.test(key)) {
      return 'preferences';
    }

    if (/^(복장|준비물|지참)$/.test(key)) {
      return 'equipments';
    }

    if (/^(업무내용|업무|담당업무|담당|업무사항)$/.test(key)) {
      return 'work';
    }

    return 'none';
  };

  const sectionBuckets: Record<Exclude<PasteSection, 'none'>, string[]> = {
    work: [],
    equipments: [],
    qualifications: [],
    preferences: [],
    notes: [],
  };

  let currentSection: PasteSection = 'none';

  for (const rawLine of lines) {
    const clean = stripPrefix(rawLine);
    if (!clean) continue;

    if (isMetaHeaderLine(clean)) {
      currentSection = 'none';
      continue;
    }

    const detected = detectSectionHeader(rawLine);
    if (detected !== 'none') {
      currentSection = detected;

      const { right } = splitAfterColon(stripPrefix(rawLine));
      if (right) {
        sectionBuckets[detected].push(right);
      }
      continue;
    }

    if (currentSection !== 'none') {
      if (
        currentSection === 'qualifications' &&
        clean.includes('우대') &&
        !clean.startsWith('우대')
      ) {
        sectionBuckets.preferences.push(clean);
      } else {
        sectionBuckets[currentSection].push(clean);
      }
    }
  }

  const parsedQualifications = sectionBuckets.qualifications
    .join('\n')
    .trim();
  const parsedPreferences = sectionBuckets.preferences.join('\n').trim();
  const parsedNotesFromSections = sectionBuckets.notes.join('\n').trim();

  const parsedWorkSection = sectionBuckets.work.join('\n').trim();
  let parsedDescription = parsedWorkSection || fullText.trim();

  let parsedDate = '';
  let parsedStartTime = '';
  let parsedEndTime = '';

  const datePatterns = [
    /일자\s*:\s*(\d{1,2})\/(\d{1,2})(?:\s*\([^)]+\))?/,
    /(\d{1,2})\/(\d{1,2})(?:\s*\([^)]+\))?(?:\s*-\s*(\d{1,2})(?:\s*\([^)]+\))?)?/,
    /(\d{1,2})월\s*(\d{1,2})일(?:\s*-\s*(\d{1,2})일)?/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    /(\d{1,2})일(?:\s*-\s*(\d{1,2})일)?/,
  ];

  for (const pattern of datePatterns) {
    const match = fullText.match(pattern);
    if (match) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      let month = '';
      let day = '';

      if (pattern.source.includes('일자')) {
        month = match[1].padStart(2, '0');
        day = match[2].padStart(2, '0');
      } else if (match[0].includes('/')) {
        month = match[1].padStart(2, '0');
        day = match[2].padStart(2, '0');
      } else if (match[0].includes('월')) {
        month = match[1].padStart(2, '0');
        day = match[2].padStart(2, '0');
      } else if (match[0].includes('-') && match[1].length === 4) {
        parsedDate = match[0];
        break;
      } else if (match[0].includes('일')) {
        month = currentMonth.toString().padStart(2, '0');
        day = match[1].padStart(2, '0');
      }

      if (month && day) {
        let year = currentYear;
        if (parseInt(month) < currentMonth) {
          year = currentYear + 1;
        }
        parsedDate = `${year}-${month}-${day}`;
        break;
      }
    }
  }

  const timePatterns = [
    /시간\s*:\s*(\d{1,2}):(\d{2})\s*[-~～]\s*(\d{1,2}):(\d{2})/,
    /(\d{1,2}):(\d{2})\s*[-~～]\s*(\d{1,2}):(\d{2})/,
    /(\d{1,2})시\s*[-~～]\s*(\d{1,2})시/,
    /오전\s*(\d{1,2}):(\d{2})\s*[-~～]\s*오후\s*(\d{1,2}):(\d{2})/,
    /오후\s*(\d{1,2}):(\d{2})\s*[-~～]\s*(\d{1,2}):(\d{2})/,
  ];

  for (const pattern of timePatterns) {
    const match = fullText.match(pattern);
    if (match) {
      if (match[0].includes(':')) {
        parsedStartTime = `${match[1].padStart(2, '0')}:${match[2]}`;
        parsedEndTime = `${match[3].padStart(2, '0')}:${match[4]}`;
      } else if (match[0].includes('시')) {
        parsedStartTime = `${match[1].padStart(2, '0')}:00`;
        parsedEndTime = `${match[2].padStart(2, '0')}:00`;
      }
      break;
    }
  }

  let parsedLocation = '';
  const locationKeywords = ['장소', '위치', '근무지', '주소', '🏢'];

  for (const keyword of locationKeywords) {
    const locationLine = lines.find((line) => line.includes(keyword));
    if (locationLine) {
      const match = locationLine.match(
        new RegExp(`${keyword.replace('🏢', '')}\\s*:\\s*(.+)`, 'i'),
      );
      if (match) {
        parsedLocation = match[1].trim();
        break;
      }
    }
  }

  if (!parsedLocation) {
    const addressPattern = /[가-힣]+(?:시|도)\s+[가-힣]+(?:시|군|구)[^.\n]*/;
    const addressMatch = fullText.match(addressPattern);
    if (addressMatch) {
      parsedLocation = addressMatch[0].trim();
    }
  }

  let parsedEquipments = '';
  const equipmentKeywords = ['복장', '준비물', '지참', '👔'];
  for (const keyword of equipmentKeywords) {
    const equipLine = lines.find((line) => line.includes(keyword));
    if (equipLine) {
      const match = equipLine.match(
        new RegExp(`${keyword.replace('👔', '')}\\s*:?\\s*(.+)`, 'i'),
      );
      if (match) {
        parsedEquipments = match[1].trim();
        break;
      }
    }
  }

  const workKeywords = ['업무', '담당', '작업', '⌨'];
  for (const keyword of workKeywords) {
    const workLine = lines.find((line) => line.includes(keyword));
    if (workLine) {
      const match = workLine.match(
        new RegExp(`${keyword.replace('⌨', '')}\\s*:?\\s*(.+)`, 'i'),
      );
      if (match) {
        const parsedWorkDescription = match[1].trim();
        if (!parsedDescription.includes(parsedWorkDescription)) {
          parsedDescription += '\n\n업무: ' + parsedWorkDescription;
        }
        break;
      }
    }
  }

  let parsedRecruitCount = 1;
  const recruitPatterns = [
    /(\d+)\s*명/,
    /인원\s*:?\s*(\d+)/,
    /모집\s*:?\s*(\d+)/,
    /(\d+)\s*인/,
  ];
  for (const pattern of recruitPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      parsedRecruitCount = parseInt(match[1], 10);
      break;
    }
  }

  let parsedPayAmount = 0;
  let parsedPayType: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily';
  let parsedTaxWithholding = false;

  if (fullText.includes('시급')) parsedPayType = 'hourly';
  else if (fullText.includes('일급')) parsedPayType = 'daily';
  else if (fullText.includes('주급')) parsedPayType = 'weekly';
  else if (fullText.includes('월급')) parsedPayType = 'monthly';

  const manwonPatterns = [
    /시급\s*:?\s*(\d+(?:\.\d+)?)\s*만\s*원?/,
    /일급\s*:?\s*(\d+(?:\.\d+)?)\s*만\s*원?/,
    /(\d+(?:\.\d+)?)\s*만\s*원/,
  ];

  for (const pattern of manwonPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      parsedPayAmount = Math.round(parseFloat(match[1]) * 10000);
      break;
    }
  }

  if (parsedPayAmount === 0) {
    const amountPatterns = [
      /(\d{1,3}(?:,\d{3})*)\s*원/,
      /(\d+)\s*원/,
      /시급\s*:?\s*(\d{1,3}(?:,\d{3})*)/,
      /일급\s*:?\s*(\d{1,3}(?:,\d{3})*)/,
      /페이\s*:?\s*(\d{1,3}(?:,\d{3})*)/,
    ];

    for (const pattern of amountPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        parsedPayAmount = parseInt(match[1].replace(/,/g, ''), 10);
        break;
      }
    }
  }

  if (
    fullText.includes('3.3%') ||
    fullText.includes('세공') ||
    fullText.includes('원천징수')
  ) {
    parsedTaxWithholding = true;
  }

  let parsedManagerName = '';
  let parsedManagerPhone = '';

  const phonePatterns = [
    /(\d{3}-\d{4}-\d{4})/,
    /(\d{3}\s*\d{4}\s*\d{4})/,
    /(\d{11})/,
    /010[-\s]?\d{4}[-\s]?\d{4}/,
  ];

  for (const pattern of phonePatterns) {
    const match = fullText.match(pattern);
    if (match) {
      parsedManagerPhone = match[0].replace(/\s/g, '-');
      break;
    }
  }

  const managerPatterns = [
    /담당자\s*:\s*([가-힣]+)\s*(?:매니저|대리|과장|팀장)?/,
    /\(담당자\s*:\s*([가-힣]+)\s*(?:매니저|대리|과장|팀장)?\)/,
    /담당자\s+([가-힣\s]+?)(?:\s+대리|\s+과장|\s+팀장|\s+매니저|\s+📞|$)/,
    /([가-힣]{2,4})\s*(?:대리|과장|팀장|담당|매니저)\s*[📞\d-]/,
  ];

  for (const pattern of managerPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      parsedManagerName = match[1].trim();
      break;
    }
  }

  let parsedNotes = '';
  const notesKeywords = [
    '📩지원방법',
    '지원방법',
    '지원 방법',
    '지원방식',
    '지원 방식',
    '지원형식',
    '지원 형식',
    '지원양식',
    '지원 양식',
    '문자 지원',
    '문자지원',
    '안내',
    '✉',
    '문의',
    '‼️지원방식',
    '‼️지원자격',
  ];
  for (const keyword of notesKeywords) {
    const notesIndex = lines.findIndex((line) => line.includes(keyword));
    if (notesIndex >= 0) {
      parsedNotes = lines.slice(notesIndex).join('\n');
      break;
    }
  }

  return {
    title: parsedTitle,
    description: parsedDescription,
    date: parsedDate,
    startTime: parsedStartTime,
    endTime: parsedEndTime,
    location: parsedLocation,
    equipments: parsedEquipments,
    qualifications: parsedQualifications,
    preferences: parsedPreferences,
    recruitCount: parsedRecruitCount,
    payAmount: parsedPayAmount,
    payType: parsedPayType,
    taxWithholding: parsedTaxWithholding,
    managerName: parsedManagerName,
    managerPhone: parsedManagerPhone,
    notes: [parsedNotesFromSections, parsedNotes]
      .filter(Boolean)
      .join('\n')
      .trim(),
    keyword: keywordFromTitle,
  };
};
