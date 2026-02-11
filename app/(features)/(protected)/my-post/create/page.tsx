'use client';

import {
  useState,
  useEffect,
  useActionState,
  useTransition,
  Suspense,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Hero from '@/app/components/Hero';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Calendar } from '@/app/components/ui/calendar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Plus, X, Loader2, Clipboard, Check } from 'lucide-react';
import { createPostAction, getPostByIdAction } from '../actions';
import { useUserStore } from '@/store/useUserStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import type { DateRange } from 'react-day-picker';
import { eachDayOfInterval, format } from 'date-fns';
import { cn } from '@/lib/utils';

type WorkType = 'single' | 'range' | 'multi';

type WorkSlot = {
  work_type: WorkType;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  location: string;
  pay_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  pay_amount: number;
  tax_withholding: boolean;
  meal_included: boolean;
  meal_amount: number; // 식대 금액 (원)
};

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string>;
};

const initialState: ActionResult<{ id: string }> = {
  ok: false,
  message: '',
  data: undefined,
};

function CreatePostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repostId = searchParams.get('repost');
  const isRepostMode = !!repostId;

  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const isManager = role === 'manager';

  const wrappedAction = async (
    prevState: ActionResult<{ id: string }>,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> => {
    // createPostAction은 ActionResult<void>를 기대하므로 타입 캐스팅 필요
    // @ts-expect-error - createPostAction의 타입 시그니처가 useActionState와 완전히 일치하지 않음
    const result = await createPostAction(prevState, formData);
    return result;
  };

  const [state, formAction, isPending] = useActionState(
    wrappedAction,
    initialState,
  );
  const [, startTransition] = useTransition();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workSlots, setWorkSlots] = useState<WorkSlot[]>([
    {
      work_type: 'single',
      date: '',
      start: '',
      end: '',
      location: '',
      pay_type: 'hourly',
      pay_amount: 0,
      tax_withholding: false,
      meal_included: false,
      meal_amount: 0,
    },
  ]);
  const [workType, setWorkType] = useState<WorkType>('single');
  const [selectedSingleDate, setSelectedSingleDate] = useState<Date | undefined>(
    undefined,
  );
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [multiDraftDate, setMultiDraftDate] = useState<Date | undefined>(
    undefined,
  );
  const [multiDraftStart, setMultiDraftStart] = useState('');
  const [multiDraftEnd, setMultiDraftEnd] = useState('');
  const [recruitCount, setRecruitCount] = useState(1);
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [equipments, setEquipments] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [preferences, setPreferences] = useState('');
  const [notes, setNotes] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [status, setStatus] = useState<'recruiting' | 'completed' | 'urgent'>(
    'recruiting',
  );
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const normalizeDates = (dates: string[]) => {
    const unique = Array.from(new Set(dates.filter(Boolean)));
    unique.sort();
    return unique;
  };

  const getBaseSlot = (prevSlots: WorkSlot[]) => {
    const base = prevSlots[0];
    return (
      base ?? {
        work_type: 'single' as const,
        date: '',
        start: '',
        end: '',
        location: '',
        pay_type: 'hourly' as const,
        pay_amount: 0,
        tax_withholding: false,
        meal_included: false,
        meal_amount: 0,
      }
    );
  };

  const setSlotsFromDates = (nextWorkType: WorkType, dates: string[]) => {
    const nextDates = normalizeDates(dates);
    setWorkSlots((prev) => {
      const base = getBaseSlot(prev);
      const common = {
        start: base.start,
        end: base.end,
        location: base.location,
        pay_type: base.pay_type,
        pay_amount: base.pay_amount,
        tax_withholding: base.tax_withholding,
        meal_included: base.meal_included,
        meal_amount: base.meal_amount,
      };

      if (nextDates.length === 0) {
        return [
          {
            ...base,
            ...common,
            work_type: nextWorkType,
            date: '',
          },
        ];
      }

      return nextDates.map((d) => ({
        ...base,
        ...common,
        work_type: nextWorkType,
        date: d,
      }));
    });
  };

  const updateMultiSlotTime = (
    date: string,
    patch: Partial<Pick<WorkSlot, 'start' | 'end'>>,
  ) => {
    setWorkSlots((prev) =>
      prev.map((s) => (s.date === date ? { ...s, ...patch } : s)),
    );
  };

  const upsertMultiSlot = (slot: Pick<WorkSlot, 'date' | 'start' | 'end'>) => {
    setWorkSlots((prev) => {
      const base = getBaseSlot(prev);
      const common = {
        location: base.location,
        pay_type: base.pay_type,
        pay_amount: base.pay_amount,
        tax_withholding: base.tax_withholding,
        meal_included: base.meal_included,
        meal_amount: base.meal_amount,
      };

      const exists = prev.some((s) => s.date === slot.date);
      const next = exists
        ? prev.map((s) =>
            s.date === slot.date
              ? { ...s, ...slot, work_type: 'multi' as const }
              : s,
          )
        : [
            ...prev,
            {
              ...base,
              ...common,
              work_type: 'multi' as const,
              date: slot.date,
              start: slot.start,
              end: slot.end,
            },
          ];

      // 날짜 오름차순 정렬
      return next.slice().sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const removeMultiSlot = (date: string) => {
    setWorkSlots((prev) => {
      const next = prev.filter((s) => s.date !== date);
      return next.length > 0
        ? next
        : [
            {
              ...getBaseSlot(prev),
              work_type: 'multi',
              date: '',
            },
          ];
    });
  };

  const patchCommonFields = (
    patch: Partial<
      Pick<
        WorkSlot,
        | 'start'
        | 'end'
        | 'location'
        | 'pay_type'
        | 'pay_amount'
        | 'tax_withholding'
        | 'meal_included'
        | 'meal_amount'
      >
    >,
  ) => {
    setWorkSlots((prev) => prev.map((s) => ({ ...s, ...patch })));
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, phone')
            .eq('user_id', data.user.id)
            .single();
          if (profile) {
            setManagerName(profile.name || '');
            setManagerPhone(profile.phone || '');
          }
        }
      } catch (err) {
        console.error('Failed to fetch user info', err);
      }
    };
    fetchUser();
  }, []);

  // 재공고 모드: 기존 공고 데이터 로드
  useEffect(() => {
    if (!repostId) return;

    const fetchRepostData = async () => {
      try {
        const result = await getPostByIdAction(repostId);
        if (result.ok && result.data) {
          const post = result.data;
          setTitle((post.title as string) || '');
          setDescription((post.description as string) || '');
          setRecruitCount((post.recruit_count as number) || 1);
          setManagerName((post.manager_name as string) || '');
          setManagerPhone((post.manager_phone as string) || '');
          setEquipments((post.equipments as string) || '');
          setQualifications((post.qualifications as string) || '');
          setPreferences((post.preferences as string) || '');
          setNotes((post.notes as string) || '');
          setExternalLink((post.external_link as string) || '');
          setKeywords((post.keywords as string[]) || []);
          setStatus('recruiting'); // 재공고는 모집중으로 시작

          // work_slots 변환
          if (post.work_slots && Array.isArray(post.work_slots)) {
            const slots = (
              post.work_slots as Array<Record<string, unknown>>
            ).map((slot) => ({
              work_type: (slot.work_type as WorkType) || ('single' as WorkType),
              date: (slot.date as string) || '',
              start: ((slot.start_time || slot.start) as string) || '',
              end: ((slot.end_time || slot.end) as string) || '',
              location: ((slot.location || post.location) as string) || '',
              pay_type: (slot.pay_type ||
                post.pay_type ||
                'hourly') as WorkSlot['pay_type'],
              pay_amount: (slot.pay_amount || post.pay_amount || 0) as number,
              tax_withholding:
                slot.tax_withholding !== undefined
                  ? (slot.tax_withholding as boolean)
                  : (post.tax_withholding as boolean) || false,
              meal_included:
                slot.meal_included !== undefined
                  ? (slot.meal_included as boolean)
                  : false,
              meal_amount:
                slot.meal_amount !== undefined ? Number(slot.meal_amount) : 0,
            }));
            setWorkSlots(slots);

            // work_type 추론/동기화
            const rawDates = slots.map((s) => s.date).filter(Boolean).sort();
            const inferredWorkType: WorkType = (() => {
              const fromSlot = slots[0]?.work_type;
              if (fromSlot === 'range' || fromSlot === 'multi' || fromSlot === 'single') {
                return fromSlot;
              }
              if (rawDates.length <= 1) return 'single';
              // 연속된 날짜면 range, 아니면 multi
              const asDates = rawDates
                .map((d) => new Date(d))
                .sort((a, b) => a.getTime() - b.getTime());
              let consecutive = true;
              for (let i = 1; i < asDates.length; i++) {
                const prev = asDates[i - 1]!;
                const cur = asDates[i]!;
                const diffDays = Math.round((cur.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
                if (diffDays !== 1) {
                  consecutive = false;
                  break;
                }
              }
              return consecutive ? 'range' : 'multi';
            })();

            setWorkType(inferredWorkType);
            if (rawDates.length === 1) {
              const d = new Date(rawDates[0]!);
              setSelectedSingleDate(d);
              setSelectedRange(undefined);
              setMultiDraftDate(undefined);
              setMultiDraftStart(slots[0]?.start ?? '');
              setMultiDraftEnd(slots[0]?.end ?? '');
            } else if (rawDates.length > 1) {
              if (inferredWorkType === 'range') {
                setSelectedRange({
                  from: new Date(rawDates[0]!),
                  to: new Date(rawDates[rawDates.length - 1]!),
                });
                setSelectedSingleDate(undefined);
                setMultiDraftDate(undefined);
                setMultiDraftStart(slots[0]?.start ?? '');
                setMultiDraftEnd(slots[0]?.end ?? '');
              } else {
                setSelectedSingleDate(undefined);
                setSelectedRange(undefined);
                setMultiDraftDate(undefined);
                setMultiDraftStart(slots[0]?.start ?? '');
                setMultiDraftEnd(slots[0]?.end ?? '');
              }
            }
          } else if (post.work_date) {
            // 레거시 데이터 지원
            setWorkSlots([
              {
                work_type: 'single',
                date: (post.work_date as string) || '',
                start: (post.work_time_start as string) || '',
                end: (post.work_time_end as string) || '',
                location: (post.location as string) || '',
                pay_type: (post.pay_type || 'hourly') as WorkSlot['pay_type'],
                pay_amount: Number(post.pay_amount) || 0,
                tax_withholding: (post.tax_withholding as boolean) || false,
                meal_included: false,
                meal_amount: 0,
              },
            ]);
            setWorkType('single');
            setSelectedSingleDate(new Date(post.work_date as string));
            setSelectedRange(undefined);
            setMultiDraftDate(undefined);
            setMultiDraftStart((post.work_time_start as string) || '');
            setMultiDraftEnd((post.work_time_end as string) || '');
          }
        }
      } catch (err) {
        console.error('Failed to fetch repost data', err);
      }
    };

    fetchRepostData();
  }, [repostId]);

  useEffect(() => {
    if (state.ok && state.data?.id) {
      router.push('/my-post');
    }
  }, [state, router]);

  if (!roleHydrated) {
    return (
      <div className="space-y-4">
        <Hero title="새 공고 작성" description="매니저 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            역할 정보를 불러오는 중입니다...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="space-y-4">
        <Hero title="새 공고 작성" description="매니저 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            관리자 승인이 필요한 매니저 전용 페이지입니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const parsePastedText = (text: string) => {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);
    const fullText = text;

    // 제목 추출: 다양한 패턴
    let parsedTitle = '';
    let keywordFromTitle = '';

    // [지역명] 형식
    const bracketMatch = fullText.match(/^\[([^\]]+)\]/);
    if (bracketMatch) {
      keywordFromTitle = bracketMatch[1];
    }

    // "모집", "구인", "스탭" 등의 키워드가 포함된 문장 찾기
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

    // 첫 줄이 제목일 가능성
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

    // ===== 섹션 기반 파싱 (지원자격/지원방식/우대사항 등) =====
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
      // ✳️ 날짜/시간/장소/급여/담당자 같은 메타 라인은 섹션 텍스트에 포함시키지 않음
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

      // 지원 방식/방법 (‼️지원방식, 지원방법 등)
      if (
        /^(지원(방식|방법|형식|양식)|지원방식|지원방법|지원형식|지원양식|지원안내|문의|안내|기타사항|기타)$/.test(
          key,
        )
      ) {
        return 'notes';
      }

      // 지원 자격/자격요건
      if (
        /^(지원자격|지원자격요건|지원자격조건|자격요건|자격조건|자격|요건|조건)$/.test(
          key,
        )
      ) {
        return 'qualifications';
      }

      // 우대 사항
      if (/^(우대사항|우대|선호)$/.test(key)) {
        return 'preferences';
      }

      // 복장/준비물
      if (/^(복장|준비물|지참)$/.test(key)) {
        return 'equipments';
      }

      // 업무/담당업무
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

      // 메타 라인이면 섹션 종료(리셋) + 다음 라인
      if (isMetaHeaderLine(clean)) {
        currentSection = 'none';
        continue;
      }

      const detected = detectSectionHeader(rawLine);
      if (detected !== 'none') {
        currentSection = detected;

        // 헤더 라인 자체에 값이 있으면(예: "지원방식: 문자지원") 우측 값만 저장
        const { right } = splitAfterColon(stripPrefix(rawLine));
        if (right) {
          sectionBuckets[detected].push(right);
        }
        continue;
      }

      // 섹션 내부 내용 수집
      if (currentSection !== 'none') {
        // "자격" 섹션 안에서도 '우대' 문구가 섞여 들어오는 케이스가 많아 분리 처리
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

    // 설명(업무 내용): 업무 섹션이 있으면 그걸 우선 사용
    const parsedWorkSection = sectionBuckets.work.join('\n').trim();
    let parsedDescription = parsedWorkSection || fullText.trim();

    // 날짜/시간 추출: 다양한 형식 지원
    let parsedDate = '';
    let parsedStartTime = '';
    let parsedEndTime = '';

    // 날짜 패턴: 1/17, 1월 17일, 2025-01-17, 17일, 일자: 2/2 등
    const datePatterns = [
      /일자\s*:\s*(\d{1,2})\/(\d{1,2})(?:\s*\([^)]+\))?/, // 일자: 2/2 (월)
      /(\d{1,2})\/(\d{1,2})(?:\s*\([^)]+\))?(?:\s*-\s*(\d{1,2})(?:\s*\([^)]+\))?)?/, // 1/17(토)-18(일)
      /(\d{1,2})월\s*(\d{1,2})일(?:\s*-\s*(\d{1,2})일)?/, // 1월 17일-18일
      /(\d{4})-(\d{1,2})-(\d{1,2})/, // 2025-01-17
      /(\d{1,2})일(?:\s*-\s*(\d{1,2})일)?/, // 17일-18일
    ];

    for (const pattern of datePatterns) {
      const match = fullText.match(pattern);
      if (match) {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        let month = '';
        let day = '';

        if (pattern.source.includes('일자')) {
          // 일자: 2/2 형식
          month = match[1].padStart(2, '0');
          day = match[2].padStart(2, '0');
        } else if (match[0].includes('/')) {
          // 1/17 형식
          month = match[1].padStart(2, '0');
          day = match[2].padStart(2, '0');
        } else if (match[0].includes('월')) {
          // 1월 17일 형식
          month = match[1].padStart(2, '0');
          day = match[2].padStart(2, '0');
        } else if (match[0].includes('-') && match[1].length === 4) {
          // 2025-01-17 형식
          parsedDate = match[0];
          break;
        } else if (match[0].includes('일')) {
          // 17일 형식 (현재 월 사용)
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

    // 시간 패턴: 12:00-17:00, 12시-17시, 시간: 08:00 - 10:00 등
    const timePatterns = [
      /시간\s*:\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/, // 시간: 08:00 - 10:00
      /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/, // 12:00-17:00
      /(\d{1,2})시\s*-\s*(\d{1,2})시/, // 12시-17시
      /오전\s*(\d{1,2}):(\d{2})\s*-\s*오후\s*(\d{1,2}):(\d{2})/,
      /오후\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/,
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

    // 장소 추출: 다양한 키워드와 주소 패턴
    let parsedLocation = '';
    const locationKeywords = ['장소', '위치', '근무지', '주소', '🏢'];

    for (const keyword of locationKeywords) {
      const locationLine = lines.find((line) => line.includes(keyword));
      if (locationLine) {
        // "위치 : 장소명" 또는 "위치: 장소명" 형식 모두 처리
        const match = locationLine.match(
          new RegExp(`${keyword.replace('🏢', '')}\\s*:\\s*(.+)`, 'i'),
        );
        if (match) {
          parsedLocation = match[1].trim();
          break;
        }
      }
    }

    // 주소 패턴 직접 찾기 (시/도, 시/군/구 포함)
    if (!parsedLocation) {
      const addressPattern = /[가-힣]+(?:시|도)\s+[가-힣]+(?:시|군|구)[^.\n]*/;
      const addressMatch = fullText.match(addressPattern);
      if (addressMatch) {
        parsedLocation = addressMatch[0].trim();
      }
    }

    // 복장/준비물 추출
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

    // 업무 내용 추출
    let parsedWorkDescription = '';
    const workKeywords = ['업무', '담당', '작업', '⌨'];
    for (const keyword of workKeywords) {
      const workLine = lines.find((line) => line.includes(keyword));
      if (workLine) {
        const match = workLine.match(
          new RegExp(`${keyword.replace('⌨', '')}\\s*:?\\s*(.+)`, 'i'),
        );
        if (match) {
          parsedWorkDescription = match[1].trim();
          if (!parsedDescription.includes(parsedWorkDescription)) {
            parsedDescription += '\n\n업무: ' + parsedWorkDescription;
          }
          break;
        }
      }
    }

    // 인원 추출
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

    // 급여 추출: 다양한 형식
    let parsedPayAmount = 0;
    let parsedPayType: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily';
    let parsedTaxWithholding = false;

    // 급여 유형 확인
    if (fullText.includes('시급')) parsedPayType = 'hourly';
    else if (fullText.includes('일급')) parsedPayType = 'daily';
    else if (fullText.includes('주급')) parsedPayType = 'weekly';
    else if (fullText.includes('월급')) parsedPayType = 'monthly';

    // 금액 추출: 다양한 형식
    // 만원 단위 먼저 체크 (예: 1.3만원 = 13,000원, 10만원 = 100,000원)
    const manwonPatterns = [
      /시급\s*:?\s*(\d+(?:\.\d+)?)\s*만\s*원?/, // 시급 1.3만원
      /일급\s*:?\s*(\d+(?:\.\d+)?)\s*만\s*원?/, // 일급 10만원
      /(\d+(?:\.\d+)?)\s*만\s*원/, // 1.3만원
    ];

    for (const pattern of manwonPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        parsedPayAmount = Math.round(parseFloat(match[1]) * 10000);
        break;
      }
    }

    // 만원 단위로 못 찾았으면 원 단위로 찾기
    if (parsedPayAmount === 0) {
      const amountPatterns = [
        /(\d{1,3}(?:,\d{3})*)\s*원/, // 65,000원
        /(\d+)\s*원/, // 65000원
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

    // 3.3% 공제 확인
    if (
      fullText.includes('3.3%') ||
      fullText.includes('세공') ||
      fullText.includes('원천징수')
    ) {
      parsedTaxWithholding = true;
    }

    // 담당자 정보 추출
    let parsedManagerName = '';
    let parsedManagerPhone = '';

    // 전화번호 패턴 찾기
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

    // 담당자 이름 추출
    const managerPatterns = [
      /담당자\s*:\s*([가-힣]+)\s*(?:매니저|대리|과장|팀장)?/, // 담당자: 김하준 매니저
      /\(담당자\s*:\s*([가-힣]+)\s*(?:매니저|대리|과장|팀장)?\)/, // (담당자: 김하준 매니저)
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

    // 기타 사항 추출
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

  const handlePasteAndParse = () => {
    if (!pasteText.trim()) return;

    const parsed = parsePastedText(pasteText);

    // 제목 설정
    if (parsed.title) {
      setTitle(parsed.title);
    }

    // 설명 설정
    if (parsed.description) {
      setDescription(parsed.description);
    }

    // 키워드 추가
    if (parsed.keyword && !keywords.includes(parsed.keyword)) {
      setKeywords((prev) => [...prev, parsed.keyword]);
    }

    // work_slots 설정
    if (parsed.date && parsed.startTime && parsed.endTime && parsed.location) {
      setWorkSlots([
        {
          work_type: 'single',
          date: parsed.date,
          start: parsed.startTime,
          end: parsed.endTime,
          location: parsed.location,
          pay_type: parsed.payType,
          pay_amount: parsed.payAmount || 0,
          tax_withholding: parsed.taxWithholding,
          meal_included: false,
          meal_amount: 0,
        },
      ]);
      setWorkType('single');
      setSelectedSingleDate(new Date(parsed.date));
      setSelectedRange(undefined);
      setMultiDraftDate(undefined);
      setMultiDraftStart(parsed.startTime);
      setMultiDraftEnd(parsed.endTime);
    } else if (parsed.location) {
      // 날짜/시간이 없어도 장소만 있으면 work_slots에 장소 설정
      setWorkSlots([
        {
          work_type: 'single',
          date: parsed.date || '',
          start: parsed.startTime || '09:00',
          end: parsed.endTime || '18:00',
          location: parsed.location,
          pay_type: parsed.payType,
          pay_amount: parsed.payAmount || 0,
          tax_withholding: parsed.taxWithholding,
          meal_included: false,
          meal_amount: 0,
        },
      ]);
      setWorkType('single');
      setSelectedSingleDate(parsed.date ? new Date(parsed.date) : undefined);
      setSelectedRange(undefined);
      setMultiDraftDate(undefined);
      setMultiDraftStart(parsed.startTime || '09:00');
      setMultiDraftEnd(parsed.endTime || '18:00');
    }

    // 모집인원 설정
    if (parsed.recruitCount) {
      setRecruitCount(parsed.recruitCount);
    }

    // 준비물 설정
    if (parsed.equipments) {
      setEquipments(parsed.equipments);
    }

    // 자격 요건 설정
    if (parsed.qualifications) {
      setQualifications(parsed.qualifications);
    }

    // 우대 사항 설정
    if (parsed.preferences) {
      setPreferences(parsed.preferences);
    }

    // 담당자 정보 설정
    if (parsed.managerName) {
      setManagerName(parsed.managerName);
    }
    if (parsed.managerPhone) {
      setManagerPhone(parsed.managerPhone);
    }

    // 기타 사항 설정
    if (parsed.notes) {
      setNotes(parsed.notes);
    }

    setShowPasteModal(false);
    setPasteText('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('work_slots', JSON.stringify(workSlots));
    formData.append('recruit_count', recruitCount.toString());
    formData.append('manager_name', managerName);
    formData.append('manager_phone', managerPhone);
    if (equipments) formData.append('equipments', equipments);
    if (qualifications) formData.append('qualifications', qualifications);
    if (preferences) formData.append('preferences', preferences);
    if (notes) formData.append('notes', notes);
    if (externalLink) formData.append('external_link', externalLink);
    formData.append('keywords', JSON.stringify(keywords));
    formData.append('status', status);
    formData.append('form_type', 'basic');

    // formAction을 transition 내에서 호출
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div>
      <Hero
        title={isRepostMode ? '재공고 작성' : '새 공고 작성'}
        description={
          isRepostMode
            ? '기존 공고를 기반으로 새 공고를 작성합니다'
            : '새로운 공고를 작성하세요'
        }
      />

      {isRepostMode && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
          <span className="font-medium">재공고 수정 중</span> - 기존 공고 내용을
          수정하여 새로운 공고로 등록합니다.
        </div>
      )}

      <div className="mb-4 flex gap-2 justify-end items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPasteModal(true)}
        >
          <Clipboard className="size-4 mr-2" />
          붙여넣기
        </Button>
      </div>

      {/* 붙여넣기 모달 */}
      <Dialog open={showPasteModal} onOpenChange={setShowPasteModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>공고문 붙여넣기</DialogTitle>
            <DialogDescription>
              공고문 텍스트를 붙여넣으면 자동으로 양식에 채워집니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paste-text">공고문 텍스트</Label>
              <Textarea
                id="paste-text"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="공고문 텍스트를 붙여넣어주세요..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>지원 형식:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>📅 일시: 날짜 및 시간</li>
                <li>🏢 장소: 근무 장소</li>
                <li>👔 복장: 준비물/복장</li>
                <li>⌨️ 업무: 업무 내용</li>
                <li>🧑 인원: 모집 인원</li>
                <li>💵 페이: 급여 정보</li>
                <li>담당자 정보: 이름 및 연락처</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPasteModal(false);
                setPasteText('');
              }}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handlePasteAndParse}
              disabled={!pasteText.trim()}
            >
              <Check className="size-4 mr-2" />
              적용하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">
                제목 <span className="text-red-500">*</span>
              </Label>
              <small className="text-muted-foreground">최대 24자</small>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              {state.fieldErrors?.title && (
                <p className="text-sm text-red-500 mt-1">
                  {state.fieldErrors.title}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">
                업무 내용 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={10}
                placeholder="업무 내용을 자세히 작성해주세요."
                required
              />
              {state.fieldErrors?.description && (
                <p className="text-sm text-red-500 mt-1">
                  {state.fieldErrors.description}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="recruit_count">
                모집인원 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="recruit_count"
                type="number"
                min="1"
                value={recruitCount}
                onChange={(e) => setRecruitCount(Number(e.target.value))}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>날짜/시간/급여 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 근무 타입 선택 */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={workType === 'single' ? 'default' : 'outline'}
                onClick={() => {
                  setWorkType('single');
                  setSelectedRange(undefined);
                  setMultiDraftDate(undefined);
                  // 기존 첫 슬롯 날짜를 유지하거나 비워두기
                  const first = workSlots[0]?.date;
                  const d = first ? new Date(first) : undefined;
                  setSelectedSingleDate(d);
                  setSlotsFromDates('single', first ? [first] : []);
                }}
              >
                하루
              </Button>
              <Button
                type="button"
                size="sm"
                variant={workType === 'range' ? 'default' : 'outline'}
                onClick={() => {
                  setWorkType('range');
                  setSelectedSingleDate(undefined);
                  setMultiDraftDate(undefined);
                  const dates = workSlots.map((s) => s.date).filter(Boolean).sort();
                  if (dates.length >= 2) {
                    setSelectedRange({ from: new Date(dates[0]!), to: new Date(dates[dates.length - 1]!) });
                    setSlotsFromDates('range', dates);
                  } else {
                    setSelectedRange(undefined);
                    setSlotsFromDates('range', dates);
                  }
                }}
              >
                기간
              </Button>
              <Button
                type="button"
                size="sm"
                variant={workType === 'multi' ? 'default' : 'outline'}
                onClick={() => {
                  setWorkType('multi');
                  setSelectedSingleDate(undefined);
                  setSelectedRange(undefined);
                  const dates = workSlots.map((s) => s.date).filter(Boolean).sort();
                  // 여러 날짜는 날짜별 시간 입력을 지원하므로 기존 슬롯을 유지하고 work_type만 변경
                  setWorkSlots((prev) =>
                    prev.map((s) => ({ ...s, work_type: 'multi' as const })),
                  );
                  // 드래프트 시간은 첫 슬롯 기준으로 초기화
                  setMultiDraftStart(workSlots[0]?.start || '09:00');
                  setMultiDraftEnd(workSlots[0]?.end || '18:00');
                  setMultiDraftDate(
                    dates[0] ? new Date(dates[0]) : undefined,
                  );
                }}
              >
                여러 날짜
              </Button>
              <span className="text-xs text-muted-foreground ml-1">
                {workType === 'single'
                  ? '하루만 선택'
                  : workType === 'range'
                    ? '시작일~종료일 선택'
                    : '여러 날짜 선택'}
              </span>
            </div>

            {/* 날짜 선택 UI */}
            <div className="rounded-lg border p-3">
              {workType === 'single' && (
                <Calendar
                  mode="single"
                  selected={selectedSingleDate}
                  onSelect={(d) => {
                    setSelectedSingleDate(d);
                    const ds = d ? format(d, 'yyyy-MM-dd') : '';
                    setSlotsFromDates('single', ds ? [ds] : []);
                  }}
                />
              )}
              {workType === 'range' && (
                <Calendar
                  mode="range"
                  selected={selectedRange}
                  onSelect={(range) => {
                    setSelectedRange(range);
                    const from = range?.from;
                    const to = range?.to ?? range?.from;
                    if (!from || !to) {
                      const ds = from ? format(from, 'yyyy-MM-dd') : '';
                      setSlotsFromDates('range', ds ? [ds] : []);
                      return;
                    }
                    const days = eachDayOfInterval({ start: from, end: to }).map((x) =>
                      format(x, 'yyyy-MM-dd'),
                    );
                    setSlotsFromDates('range', days);
                  }}
                />
              )}
              {workType === 'multi' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">날짜 선택</Label>
                      <Calendar
                        mode="single"
                        selected={multiDraftDate}
                        onSelect={(d) => setMultiDraftDate(d)}
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">시간 선택</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              시작
                            </Label>
                            <Input
                              type="time"
                              value={multiDraftStart}
                              onChange={(e) => setMultiDraftStart(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              종료
                            </Label>
                            <Input
                              type="time"
                              value={multiDraftEnd}
                              onChange={(e) => setMultiDraftEnd(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => {
                          if (!multiDraftDate) return;
                          if (!multiDraftStart || !multiDraftEnd) return;
                          const ds = format(multiDraftDate, 'yyyy-MM-dd');
                          upsertMultiSlot({
                            date: ds,
                            start: multiDraftStart,
                            end: multiDraftEnd,
                          });
                        }}
                        disabled={!multiDraftDate || !multiDraftStart || !multiDraftEnd}
                      >
                        <Plus className="size-4 mr-2" />
                        추가
                      </Button>

                      <div className="rounded-md border p-3">
                        <p className="text-sm font-medium mb-2">
                          추가된 날짜/시간
                        </p>
                        {workSlots.filter((s) => s.date).length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            아직 추가된 날짜가 없습니다.
                          </p>
                        ) : (
                          <div
                            className={cn(
                              'space-y-2',
                              workSlots.filter((s) => s.date).length >= 2 &&
                                'max-h-48 overflow-y-auto pr-1'
                            )}
                          >
                            {workSlots
                              .filter((s) => s.date)
                              .slice()
                              .sort((a, b) => a.date.localeCompare(b.date))
                              .map((s) => (
                                <div
                                  key={s.date}
                                  className={cn(
                                    'flex flex-col md:flex-row md:items-center gap-2 rounded-md border p-2',
                                    'bg-primary/5 border-primary/20'
                                  )}
                                >
                                  <Badge variant="secondary" className="w-fit">
                                    {s.date}
                                  </Badge>
                                  <div className="grid grid-cols-2 gap-2 flex-1">
                                    <Input
                                      type="time"
                                      value={s.start}
                                      onChange={(e) =>
                                        updateMultiSlotTime(s.date, {
                                          start: e.target.value,
                                        })
                                      }
                                    />
                                    <Input
                                      type="time"
                                      value={s.end}
                                      onChange={(e) =>
                                        updateMultiSlotTime(s.date, {
                                          end: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMultiSlot(s.date)}
                                    className="self-end md:self-auto"
                                    title="삭제"
                                  >
                                    <X className="size-4" />
                                  </Button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 선택된 날짜 요약 */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                선택 {workSlots.filter((s) => s.date).length}일
              </Badge>
              <div className="flex flex-wrap gap-2">
                {workSlots
                  .map((s) => s.date)
                  .filter(Boolean)
                  .slice(0, 14)
                  .map((d) => (
                    <Badge
                      key={d}
                      variant="secondary"
                      className="text-xs flex items-center gap-1"
                    >
                      {d}
                      {workType === 'multi' && (
                        <button
                          type="button"
                          className="ml-1 hover:text-red-600"
                          onClick={() => removeMultiSlot(d)}
                          title="삭제"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                {workSlots.filter((s) => s.date).length > 14 && (
                  <span className="text-xs text-muted-foreground">
                    외 {workSlots.filter((s) => s.date).length - 14}일
                  </span>
                )}
              </div>
            </div>

            {/* 공통(정규화) 필드: 시간/장소/급여 */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {workType === 'single' ? '하루 정보' : '공통 정보(선택된 날짜에 일괄 적용)'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {workType !== 'multi' && (
                  <>
                    <div>
                      <Label>
                        시작 시간 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="time"
                        value={workSlots[0]?.start ?? ''}
                        onChange={(e) =>
                          patchCommonFields({ start: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>
                        종료 시간 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="time"
                        value={workSlots[0]?.end ?? ''}
                        onChange={(e) => patchCommonFields({ end: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}
                <div className="md:col-span-2">
                  <Label>
                    장소 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={workSlots[0]?.location ?? ''}
                    onChange={(e) => patchCommonFields({ location: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>
                    급여 유형 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={workSlots[0]?.pay_type ?? 'hourly'}
                    onValueChange={(v) =>
                      patchCommonFields({ pay_type: v as WorkSlot['pay_type'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">시급</SelectItem>
                      <SelectItem value="daily">일급</SelectItem>
                      <SelectItem value="weekly">주급</SelectItem>
                      <SelectItem value="monthly">월급</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>
                    급여 금액 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={workSlots[0]?.pay_amount || ''}
                    onChange={(e) =>
                      patchCommonFields({ pay_amount: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tax-withholding"
                    checked={workSlots[0]?.tax_withholding ?? false}
                    onChange={(e) =>
                      patchCommonFields({ tax_withholding: e.target.checked })
                    }
                    className="size-4"
                  />
                  <Label htmlFor="tax-withholding" className="cursor-pointer">
                    3.3% 원천징수 공제
                  </Label>
                </div>

                <div className="md:col-span-2 rounded-md border p-3">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="meal-included"
                        checked={workSlots[0]?.meal_included ?? false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          patchCommonFields({
                            meal_included: checked,
                            meal_amount: checked
                              ? Math.max(0, workSlots[0]?.meal_amount ?? 0)
                              : 0,
                          });
                        }}
                        className="size-4"
                      />
                      <Label htmlFor="meal-included" className="cursor-pointer">
                        식대 포함
                      </Label>
                    </div>

                    <div className="flex items-center gap-2 md:ml-auto w-full md:w-auto">
                      <Label htmlFor="meal-amount" className="text-sm">
                        식대 금액(원)
                      </Label>
                      <Input
                        id="meal-amount"
                        type="number"
                        min="0"
                        inputMode="numeric"
                        className={cn('w-full md:w-44', !(workSlots[0]?.meal_included ?? false) && 'opacity-60')}
                        value={
                          (workSlots[0]?.meal_included ?? false)
                            ? workSlots[0]?.meal_amount ?? 0
                            : 0
                        }
                        onChange={(e) =>
                          patchCommonFields({
                            meal_amount: Number(e.target.value) || 0,
                          })
                        }
                        disabled={!(workSlots[0]?.meal_included ?? false)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    식대는 선택한 모든 날짜 슬롯에 동일하게 적용됩니다.
                  </p>
                </div>
              </div>
            </div>
            {state.fieldErrors?.['work_slots'] && (
              <p className="text-sm text-red-500">
                {state.fieldErrors['work_slots']}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>담당자 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="manager_name">
                담당자 이름 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="manager_name"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="manager_phone">
                담당자 연락처 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="manager_phone"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>추가 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="equipments">준비물 (복장 등)</Label>
              <Input
                id="equipments"
                value={equipments}
                onChange={(e) => setEquipments(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="qualifications">자격 요건</Label>
              <Textarea
                id="qualifications"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="preferences">우대 사항</Label>
              <Textarea
                id="preferences"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="notes">기타 사항</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="external_link">링크 (선택사항)</Label>
              <Input
                id="external_link"
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label>키워드</Label>
              <small className="text-sm text-muted-foreground">
                효율적인 매칭을 위해 키워드를 입력해주세요.
              </small>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="키워드 입력 후 Enter"
                />
                <Button type="button" onClick={handleAddKeyword}>
                  추가
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="status">공고 상태</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as typeof status)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recruiting">모집중</SelectItem>
                  <SelectItem value="urgent">급구</SelectItem>
                  <SelectItem value="completed">모집완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {state.message && (
          <div
            className={`p-3 rounded-md ${
              state.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {state.message}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                {isRepostMode ? '재공고 작성 중...' : '작성 중...'}
              </>
            ) : isRepostMode ? (
              '재공고 작성하기'
            ) : (
              '작성하기'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Hero title="공고 작성" description="공고를 불러오는 중..." />
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              페이지를 불러오는 중입니다...
            </CardContent>
          </Card>
        </div>
      }
    >
      <CreatePostContent />
    </Suspense>
  );
}
