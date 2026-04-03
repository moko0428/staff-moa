'use client';

import { useState, useEffect, useActionState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPostAction, getPostByIdAction } from '../actions';
import { parsePastedText } from '../utils/pasteParser';
import { extractPostText } from '../utils/textExtractor';
import type { WorkPart, WorkShift, ActionResult } from '../types';

const initialState: ActionResult<{ id: string }> = {
  ok: false,
  message: '',
  data: undefined,
};

const defaultShift = (): WorkShift => ({ date: '', date_end: '', start: '', end: '' });

const defaultPart = (): WorkPart => ({
  name: '',
  description: '',
  location: '',
  pay_type: 'daily',
  pay_amount: 0,
  recruit_count: 1,
  tax_withholding: false,
  meal_included: false,
  meal_amount: 0,
  shifts: [defaultShift()],
});

export const useCreatePost = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repostId = searchParams.get('repost');
  const isRepostMode = !!repostId;

  const wrappedAction = async (
    prevState: ActionResult<{ id: string }>,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> => {
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
  const [workParts, setWorkParts] = useState<WorkPart[]>([defaultPart()]);
  const [managerName, setManagerName] = useState('');
  const [managerContactType, setManagerContactType] = useState<
    'phone' | 'kakao' | 'email' | 'other'
  >('phone');
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
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [openSections, setOpenSections] = useState<string[]>(['basic-info']);
  const [pasteHighlights, setPasteHighlights] = useState<Set<string>>(new Set());

  // ── Part handlers ─────────────────────────────────────────────────────
  const handleAddPart = () => {
    const base = workParts[0];
    setWorkParts((prev) => [
      ...prev,
      {
        name: '',
        description: '',
        location: base?.location || '',
        pay_type: base?.pay_type || 'daily',
        pay_amount: base?.pay_amount || 0,
        recruit_count: 1,
        tax_withholding: base?.tax_withholding || false,
        meal_included: base?.meal_included || false,
        meal_amount: base?.meal_amount || 0,
        shifts: [defaultShift()],
      },
    ]);
  };

  const handleRemovePart = (partIndex: number) => {
    if (workParts.length <= 1) return;
    setWorkParts((prev) => prev.filter((_, i) => i !== partIndex));
  };

  const handleUpdatePart = (
    partIndex: number,
    patch: Partial<Omit<WorkPart, 'shifts'>>,
  ) => {
    setWorkParts((prev) =>
      prev.map((part, i) => (i === partIndex ? { ...part, ...patch } : part)),
    );
  };

  // ── Shift handlers ────────────────────────────────────────────────────
  const handleAddShift = (partIndex: number) => {
    setWorkParts((prev) =>
      prev.map((part, i) => {
        if (i !== partIndex) return part;
        const shared = part.shifts[0];
        const newShift: WorkShift = {
          date: '',
          start: shared?.start ?? '',
          end: shared?.end ?? '',
        };
        // 첫 시프트가 기간 모드면 새 시프트도 기간 모드로 시작
        if (shared?.date_end !== undefined) newShift.date_end = '';
        return { ...part, shifts: [...part.shifts, newShift] };
      }),
    );
  };

  const handleToggleShiftMode = (partIndex: number, shiftIndex: number) => {
    setWorkParts((prev) =>
      prev.map((part, i) => {
        if (i !== partIndex) return part;
        return {
          ...part,
          shifts: part.shifts.map((shift, si) => {
            if (si !== shiftIndex) return shift;
            if (shift.date_end !== undefined) {
              // 기간 → 당일: date_end 제거
              const next = { ...shift };
              delete next.date_end;
              return next;
            }
            // 당일 → 기간: date_end 추가
            return { ...shift, date_end: '' };
          }),
        };
      }),
    );
  };

  const handleUpdatePartTime = (
    partIndex: number,
    field: 'start' | 'end',
    value: string,
  ) => {
    setWorkParts((prev) =>
      prev.map((part, i) => {
        if (i !== partIndex) return part;
        return {
          ...part,
          shifts: part.shifts.map((shift) => ({ ...shift, [field]: value })),
        };
      }),
    );
  };

  const handleRemoveShift = (partIndex: number, shiftIndex: number) => {
    setWorkParts((prev) =>
      prev.map((part, i) => {
        if (i !== partIndex) return part;
        if (part.shifts.length <= 1) return part;
        return { ...part, shifts: part.shifts.filter((_, si) => si !== shiftIndex) };
      }),
    );
  };

  const handleUpdateShift = (
    partIndex: number,
    shiftIndex: number,
    field: keyof WorkShift,
    value: string,
  ) => {
    setWorkParts((prev) =>
      prev.map((part, i) => {
        if (i !== partIndex) return part;
        const newShifts = part.shifts.map((shift, si) =>
          si === shiftIndex ? { ...shift, [field]: value } : shift,
        );
        return { ...part, shifts: newShifts };
      }),
    );
  };

  // ── Keyword handlers ──────────────────────────────────────────────────
  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  // ── Paste & parse ─────────────────────────────────────────────────────
  const handlePasteAndParse = () => {
    if (!pasteText.trim()) return;

    const parsed = parsePastedText(pasteText);

    const highlights = new Set<string>();
    const newOpenSections = new Set(openSections);

    if (parsed.title) {
      setTitle(parsed.title);
      highlights.add('title');
      newOpenSections.add('basic-info');
    }
    if (parsed.description) {
      setDescription(parsed.description);
      highlights.add('description');
      newOpenSections.add('basic-info');
    }
    if (parsed.keyword && !keywords.includes(parsed.keyword)) {
      setKeywords((prev) => [...prev, parsed.keyword]);
      newOpenSections.add('basic-info');
    }

    // 파싱 결과 → 파트 1개 + 시프트 1개
    if (parsed.date || parsed.location) {
      setWorkParts([{
        name: '',
        description: '',
        location: parsed.location || '',
        pay_type: parsed.payType,
        pay_amount: parsed.payAmount || 0,
        recruit_count: 1,
        tax_withholding: parsed.taxWithholding,
        meal_included: false,
        meal_amount: 0,
        shifts: [{
          date: parsed.date || '',
          start: parsed.startTime || '09:00',
          end: parsed.endTime || '18:00',
        }],
      }]);
      newOpenSections.add('work-info');
      if (parsed.date) highlights.add('part-0-shift-0-date');
      if (parsed.location) highlights.add('part-0-location');
    }

    if (parsed.managerName) {
      setManagerName(parsed.managerName);
      highlights.add('manager_name');
      newOpenSections.add('manager-info');
    }
    if (parsed.managerPhone) {
      setManagerPhone(parsed.managerPhone);
      highlights.add('manager_phone');
      newOpenSections.add('manager-info');
    }
    if (parsed.equipments) {
      setEquipments(parsed.equipments);
      highlights.add('equipments');
      newOpenSections.add('additional-info');
    }
    if (parsed.qualifications) {
      setQualifications(parsed.qualifications);
      highlights.add('qualifications');
      newOpenSections.add('additional-info');
    }
    if (parsed.preferences) {
      setPreferences(parsed.preferences);
      highlights.add('preferences');
      newOpenSections.add('additional-info');
    }
    if (parsed.notes) {
      setNotes(parsed.notes);
      highlights.add('notes');
      newOpenSections.add('additional-info');
    }

    setOpenSections(Array.from(newOpenSections));
    setPasteHighlights(highlights);
    setTimeout(() => setPasteHighlights(new Set()), 3000);

    setShowPasteModal(false);
    setPasteText('');
  };

  const handleExtract = () => {
    const text = extractPostText({
      title,
      description,
      workParts,
      managerName,
      managerPhone,
      equipments,
      qualifications,
      preferences,
      notes,
    });
    setExtractedText(text);
    setShowExtractModal(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const totalRecruitCount = workParts.reduce((acc, p) => acc + p.recruit_count, 0);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('work_slots', JSON.stringify(workParts));
    formData.append('recruit_count', String(totalRecruitCount));
    formData.append('manager_name', managerName);
    formData.append('manager_contact_type', managerContactType);
    formData.append('manager_phone', managerPhone);
    if (equipments) formData.append('equipments', equipments);
    if (qualifications) formData.append('qualifications', qualifications);
    if (preferences) formData.append('preferences', preferences);
    if (notes) formData.append('notes', notes);
    if (externalLink) formData.append('external_link', externalLink);
    formData.append('keywords', JSON.stringify(keywords));
    formData.append('status', status);
    formData.append('form_type', 'basic');

    startTransition(() => {
      formAction(formData);
    });
  };

  // ── Effects ───────────────────────────────────────────────────────────
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

  useEffect(() => {
    if (!repostId) return;

    const fetchRepostData = async () => {
      try {
        const result = await getPostByIdAction(repostId);
        if (result.ok && result.data) {
          const post = result.data;
          setTitle((post.title as string) || '');
          setDescription((post.description as string) || '');
          setManagerName((post.manager_name as string) || '');
          if (post.manager_contact_type) {
            setManagerContactType(
              post.manager_contact_type as 'phone' | 'kakao' | 'email' | 'other',
            );
          }
          setManagerPhone((post.manager_phone as string) || '');
          setEquipments((post.equipments as string) || '');
          setQualifications((post.qualifications as string) || '');
          setPreferences((post.preferences as string) || '');
          setNotes((post.notes as string) || '');
          setExternalLink((post.external_link as string) || '');
          setKeywords((post.keywords as string[]) || []);
          setStatus('recruiting');

          if (post.work_slots && Array.isArray(post.work_slots)) {
            const rawSlots = post.work_slots as Array<Record<string, unknown>>;
            const converted = convertToWorkParts(rawSlots, post as Record<string, unknown>);
            setWorkParts(converted);
          } else if (post.work_date) {
            setWorkParts([{
              name: '',
              description: '',
              location: (post.location as string) || '',
              pay_type: (post.pay_type as WorkPart['pay_type']) || 'daily',
              pay_amount: Number(post.pay_amount) || 0,
              recruit_count: 1,
              tax_withholding: (post.tax_withholding as boolean) || false,
              meal_included: false,
              meal_amount: 0,
              shifts: [{
                date: (post.work_date as string) || '',
                start: (post.work_time_start as string) || '',
                end: (post.work_time_end as string) || '',
              }],
            }]);
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

  return {
    state,
    isPending,
    formAction,
    isRepostMode,
    title,
    setTitle,
    description,
    setDescription,
    workParts,
    managerName,
    setManagerName,
    managerContactType,
    setManagerContactType,
    managerPhone,
    setManagerPhone,
    equipments,
    setEquipments,
    qualifications,
    setQualifications,
    preferences,
    setPreferences,
    notes,
    setNotes,
    externalLink,
    setExternalLink,
    keywords,
    newKeyword,
    setNewKeyword,
    status,
    setStatus,
    showPasteModal,
    setShowPasteModal,
    pasteText,
    setPasteText,
    showExtractModal,
    setShowExtractModal,
    extractedText,
    openSections,
    setOpenSections,
    pasteHighlights,
    handleAddPart,
    handleRemovePart,
    handleUpdatePart,
    handleAddShift,
    handleToggleShiftMode,
    handleUpdatePartTime,
    handleRemoveShift,
    handleUpdateShift,
    handleAddKeyword,
    handleRemoveKeyword,
    handlePasteAndParse,
    handleExtract,
    handleSubmit,
  };
};

// v2/v1 → v3 변환 공통 함수
export function convertToWorkParts(
  rawSlots: Array<Record<string, unknown>>,
  post: Record<string, unknown>,
): WorkPart[] {
  if (rawSlots.length === 0) return [{ name: '', description: '', location: '', pay_type: 'daily', pay_amount: 0, recruit_count: 1, tax_withholding: false, meal_included: false, meal_amount: 0, shifts: [{ date: '', start: '', end: '' }] }];

  const firstSlot = rawSlots[0];

  if (firstSlot && 'shifts' in firstSlot) {
    // v3: 그대로 (description 없는 구버전도 안전하게 병합)
    return rawSlots.map((slot) => ({ description: '', ...slot })) as unknown as WorkPart[];
  }

  // v2 or v1
  const converted: WorkPart[] = [];
  for (const slot of rawSlots) {
    const parts = slot.parts as Array<Record<string, unknown>> | undefined;
    if (parts && parts.length > 0) {
      // v2: 각 파트 → WorkPart (shift 1개)
      for (const part of parts) {
        converted.push({
          name: (part.name as string) || '',
          description: '',
          location: (slot.location as string) || (post.location as string) || '',
          pay_type: ((slot.pay_type || post.pay_type || 'daily') as WorkPart['pay_type']),
          pay_amount: (slot.pay_amount as number) || Number(post.pay_amount) || 0,
          recruit_count: (part.recruit_count as number) || 1,
          tax_withholding: (slot.tax_withholding !== undefined ? slot.tax_withholding : (post.tax_withholding || false)) as boolean,
          meal_included: (slot.meal_included as boolean) || false,
          meal_amount: Number(slot.meal_amount) || 0,
          shifts: [{
            date: (slot.date as string) || '',
            start: (part.start as string) || '',
            end: (part.end as string) || '',
          }],
        });
      }
    } else {
      // v1: 슬롯 → WorkPart (shift 1개)
      converted.push({
        name: '',
        description: '',
        location: (slot.location as string) || (post.location as string) || '',
        pay_type: ((slot.pay_type || post.pay_type || 'daily') as WorkPart['pay_type']),
        pay_amount: (slot.pay_amount as number) || Number(post.pay_amount) || 0,
        recruit_count: 1,
        tax_withholding: (slot.tax_withholding !== undefined ? slot.tax_withholding : (post.tax_withholding || false)) as boolean,
        meal_included: (slot.meal_included as boolean) || false,
        meal_amount: Number(slot.meal_amount) || 0,
        shifts: [{
          date: (slot.date as string) || '',
          start: ((slot.start_time || slot.start) as string) || (post.work_time_start as string) || '',
          end: ((slot.end_time || slot.end) as string) || (post.work_time_end as string) || '',
        }],
      });
    }
  }
  return converted;
}
