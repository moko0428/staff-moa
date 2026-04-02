'use client';

import { useState, useEffect, useActionState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPostAction, getPostByIdAction } from '../actions';
import { parsePastedText } from '../utils/pasteParser';
import { extractPostText } from '../utils/textExtractor';
import type { WorkSlot, WorkPart, ActionResult } from '../types';

const initialState: ActionResult<{ id: string }> = {
  ok: false,
  message: '',
  data: undefined,
};

const defaultPart = (): WorkPart => ({
  label: 'A',
  name: '',
  start: '',
  end: '',
  recruit_count: 1,
});

const defaultSlot = (): WorkSlot => ({
  date: '',
  location: '',
  pay_type: 'daily',
  pay_amount: 0,
  tax_withholding: false,
  meal_included: false,
  meal_amount: 0,
  parts: [defaultPart()],
});

const PART_LABELS: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];

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
  const [workSlots, setWorkSlots] = useState<WorkSlot[]>([defaultSlot()]);
  const [genderType, setGenderType] = useState<'any' | 'separated'>('any');
  const [recruitCount, setRecruitCount] = useState(1);
  const [recruitMale, setRecruitMale] = useState(0);
  const [recruitFemale, setRecruitFemale] = useState(0);
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
  const [openSections, setOpenSections] = useState<string[]>(['basic-info', 'work-info']);
  // highlight effect: set of field IDs filled by paste
  const [pasteHighlights, setPasteHighlights] = useState<Set<string>>(new Set());

  // ── Slot handlers ────────────────────────────────────────────────────
  const handleAddSlot = () => {
    const base = workSlots[0];
    setWorkSlots((prev) => [
      ...prev,
      {
        date: '',
        location: base?.location || '',
        pay_type: base?.pay_type || 'daily',
        pay_amount: base?.pay_amount || 0,
        tax_withholding: base?.tax_withholding || false,
        meal_included: base?.meal_included || false,
        meal_amount: base?.meal_amount || 0,
        parts: [defaultPart()],
      },
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    if (workSlots.length <= 1) return;
    setWorkSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSlot = (
    index: number,
    patch: Partial<Omit<WorkSlot, 'parts'>>,
  ) => {
    setWorkSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)),
    );
  };

  // ── Part handlers ────────────────────────────────────────────────────
  const handleAddPart = (slotIndex: number) => {
    setWorkSlots((prev) =>
      prev.map((slot, i) => {
        if (i !== slotIndex) return slot;
        const parts = slot.parts;
        if (parts.length >= 3) return slot;
        const nextLabel = PART_LABELS[parts.length] || 'C';
        return {
          ...slot,
          parts: [
            ...parts,
            { label: nextLabel, name: '', start: '', end: '', recruit_count: 1 },
          ],
        };
      }),
    );
  };

  const handleRemovePart = (slotIndex: number, partIndex: number) => {
    setWorkSlots((prev) =>
      prev.map((slot, i) => {
        if (i !== slotIndex) return slot;
        if (slot.parts.length <= 1) return slot;
        const newParts = slot.parts
          .filter((_, pi) => pi !== partIndex)
          .map((p, pi) => ({ ...p, label: PART_LABELS[pi] || p.label }));
        return { ...slot, parts: newParts };
      }),
    );
  };

  const handleUpdatePart = (
    slotIndex: number,
    partIndex: number,
    patch: Partial<WorkPart>,
  ) => {
    setWorkSlots((prev) =>
      prev.map((slot, i) => {
        if (i !== slotIndex) return slot;
        const newParts = slot.parts.map((p, pi) =>
          pi === partIndex ? { ...p, ...patch } : p,
        );
        return { ...slot, parts: newParts };
      }),
    );
  };

  // ── Keyword handlers ─────────────────────────────────────────────────
  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  // ── Paste & parse ────────────────────────────────────────────────────
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
    if (parsed.recruitCount) {
      setRecruitCount(parsed.recruitCount);
      highlights.add('recruit_count');
      newOpenSections.add('basic-info');
    }

    // Build work slots from parsed data
    const slotBase = {
      pay_type: parsed.payType,
      pay_amount: parsed.payAmount || 0,
      tax_withholding: parsed.taxWithholding,
      meal_included: false as const,
      meal_amount: 0,
      location: parsed.location || '',
    };

    if (parsed.workSlots && parsed.workSlots.length >= 2) {
      const newSlots: WorkSlot[] = parsed.workSlots.map((s, idx) => ({
        ...slotBase,
        date: s.date,
        parts: [
          {
            label: 'A' as const,
            name: '',
            start: s.startTime || '09:00',
            end: s.endTime || '18:00',
            recruit_count: 1,
          },
        ],
      }));
      setWorkSlots(newSlots);
      newOpenSections.add('work-info');
    } else if (parsed.dateRangeFrom && parsed.dateRangeTo) {
      // Range: create multiple slots
      const from = new Date(parsed.dateRangeFrom);
      const to = new Date(parsed.dateRangeTo);
      const days: string[] = [];
      const cur = new Date(from);
      while (cur <= to) {
        days.push(cur.toISOString().split('T')[0]!);
        cur.setDate(cur.getDate() + 1);
      }
      const newSlots: WorkSlot[] = days.map((date) => ({
        ...slotBase,
        date,
        parts: [
          {
            label: 'A' as const,
            name: '',
            start: parsed.startTime || '09:00',
            end: parsed.endTime || '18:00',
            recruit_count: 1,
          },
        ],
      }));
      setWorkSlots(newSlots);
      newOpenSections.add('work-info');
    } else if (parsed.date || parsed.location) {
      setWorkSlots([
        {
          ...slotBase,
          date: parsed.date || '',
          parts: [
            {
              label: 'A' as const,
              name: '',
              start: parsed.startTime || '09:00',
              end: parsed.endTime || '18:00',
              recruit_count: 1,
            },
          ],
        },
      ]);
      newOpenSections.add('work-info');
      if (parsed.date) highlights.add('slot-0-date');
      if (parsed.location) highlights.add('slot-0-location');
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
    // Clear highlights after 3 seconds
    setTimeout(() => setPasteHighlights(new Set()), 3000);

    setShowPasteModal(false);
    setPasteText('');
  };

  const handleExtract = () => {
    const text = extractPostText({
      title,
      description,
      workSlots,
      recruitCount,
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

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('work_slots', JSON.stringify(workSlots));
    formData.append('recruit_count', recruitCount.toString());
    if (genderType === 'separated') {
      formData.append('recruit_male', recruitMale.toString());
      formData.append('recruit_female', recruitFemale.toString());
    }
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

  // ── Effects ──────────────────────────────────────────────────────────
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
          setRecruitCount((post.recruit_count as number) || 1);
          setManagerName((post.manager_name as string) || '');
          if (post.manager_contact_type) {
            setManagerContactType(
              post.manager_contact_type as
                | 'phone'
                | 'kakao'
                | 'email'
                | 'other',
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

          // recruit_male / recruit_female
          if (post.recruit_male !== undefined && post.recruit_male !== null) {
            setRecruitMale(post.recruit_male as number);
            setRecruitFemale((post.recruit_female as number) || 0);
            setGenderType('separated');
          }

          if (post.work_slots && Array.isArray(post.work_slots)) {
            const rawSlots = post.work_slots as Array<Record<string, unknown>>;
            const slots: WorkSlot[] = rawSlots.map((slot) => {
              // If slot has parts, use them; otherwise convert from legacy start/end
              const existingParts = slot.parts as WorkPart[] | undefined;
              let parts: WorkPart[];
              if (existingParts && existingParts.length > 0) {
                parts = existingParts;
              } else {
                const legacyStart = ((slot.start_time || slot.start) as string) || '';
                const legacyEnd = ((slot.end_time || slot.end) as string) || '';
                parts = [{ label: 'A', name: '', start: legacyStart, end: legacyEnd, recruit_count: 1 }];
              }
              return {
                date: (slot.date as string) || '',
                location: ((slot.location || post.location) as string) || '',
                pay_type: (slot.pay_type || post.pay_type || 'daily') as WorkSlot['pay_type'],
                pay_amount: (slot.pay_amount || post.pay_amount || 0) as number,
                tax_withholding: (slot.tax_withholding !== undefined
                  ? slot.tax_withholding
                  : (post.tax_withholding || false)) as boolean,
                meal_included: (slot.meal_included !== undefined ? slot.meal_included : false) as boolean,
                meal_amount: slot.meal_amount !== undefined ? Number(slot.meal_amount) : 0,
                parts,
              };
            });
            setWorkSlots(slots);
          } else if (post.work_date) {
            setWorkSlots([{
              date: (post.work_date as string) || '',
              location: (post.location as string) || '',
              pay_type: (post.pay_type || 'daily') as WorkSlot['pay_type'],
              pay_amount: Number(post.pay_amount) || 0,
              tax_withholding: (post.tax_withholding as boolean) || false,
              meal_included: false,
              meal_amount: 0,
              parts: [{
                label: 'A',
                name: '',
                start: (post.work_time_start as string) || '',
                end: (post.work_time_end as string) || '',
                recruit_count: 1,
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
    // state
    state,
    isPending,
    formAction,
    isRepostMode,
    title,
    setTitle,
    description,
    setDescription,
    workSlots,
    genderType,
    setGenderType,
    recruitCount,
    setRecruitCount,
    recruitMale,
    setRecruitMale,
    recruitFemale,
    setRecruitFemale,
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
    // handlers
    handleAddSlot,
    handleRemoveSlot,
    handleUpdateSlot,
    handleAddPart,
    handleRemovePart,
    handleUpdatePart,
    handleAddKeyword,
    handleRemoveKeyword,
    handlePasteAndParse,
    handleExtract,
    handleSubmit,
  };
};
