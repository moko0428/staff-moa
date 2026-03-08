'use client';

import { useState, useEffect, useActionState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { eachDayOfInterval, format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { createPostAction, getPostByIdAction } from '../actions';
import { parsePastedText } from '../utils/pasteParser';
import type { WorkType, WorkSlot, ActionResult } from '../types';

const initialState: ActionResult<{ id: string }> = {
  ok: false,
  message: '',
  data: undefined,
};

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
  const [selectedSingleDate, setSelectedSingleDate] = useState<
    Date | undefined
  >(undefined);
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

  const normalizeDates = (dates: string[]) => {
    const unique = Array.from(new Set(dates.filter(Boolean)));
    unique.sort();
    return unique;
  };

  const getBaseSlot = (prevSlots: WorkSlot[]): WorkSlot => {
    return (
      prevSlots[0] ?? {
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
        return [{ ...base, ...common, work_type: nextWorkType, date: '' }];
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

      return next.slice().sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const removeMultiSlot = (date: string) => {
    setWorkSlots((prev) => {
      const next = prev.filter((s) => s.date !== date);
      return next.length > 0
        ? next
        : [{ ...getBaseSlot(prev), work_type: 'multi', date: '' }];
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

          if (post.work_slots && Array.isArray(post.work_slots)) {
            const slots = (
              post.work_slots as Array<Record<string, unknown>>
            ).map((slot) => ({
              work_type:
                (slot.work_type as WorkType) || ('single' as WorkType),
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
                slot.meal_amount !== undefined
                  ? Number(slot.meal_amount)
                  : 0,
            }));
            setWorkSlots(slots);

            const rawDates = slots.map((s) => s.date).filter(Boolean).sort();
            const inferredWorkType: WorkType = (() => {
              const fromSlot = slots[0]?.work_type;
              if (
                fromSlot === 'range' ||
                fromSlot === 'multi' ||
                fromSlot === 'single'
              ) {
                return fromSlot;
              }
              if (rawDates.length <= 1) return 'single';
              const asDates = rawDates
                .map((d) => new Date(d))
                .sort((a, b) => a.getTime() - b.getTime());
              let consecutive = true;
              for (let i = 1; i < asDates.length; i++) {
                const prev = asDates[i - 1]!;
                const cur = asDates[i]!;
                const diffDays = Math.round(
                  (cur.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000),
                );
                if (diffDays !== 1) {
                  consecutive = false;
                  break;
                }
              }
              return consecutive ? 'range' : 'multi';
            })();

            setWorkType(inferredWorkType);
            if (rawDates.length === 1) {
              setSelectedSingleDate(new Date(rawDates[0]!));
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

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handlePasteAndParse = () => {
    if (!pasteText.trim()) return;

    const parsed = parsePastedText(pasteText);

    if (parsed.title) setTitle(parsed.title);
    if (parsed.description) setDescription(parsed.description);
    if (parsed.keyword && !keywords.includes(parsed.keyword)) {
      setKeywords((prev) => [...prev, parsed.keyword]);
    }

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

    if (parsed.recruitCount) setRecruitCount(parsed.recruitCount);
    if (parsed.equipments) setEquipments(parsed.equipments);
    if (parsed.qualifications) setQualifications(parsed.qualifications);
    if (parsed.preferences) setPreferences(parsed.preferences);
    if (parsed.managerName) setManagerName(parsed.managerName);
    if (parsed.managerPhone) setManagerPhone(parsed.managerPhone);
    if (parsed.notes) setNotes(parsed.notes);

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

  // WorkType switching helpers
  const switchToSingle = () => {
    setWorkType('single');
    setSelectedRange(undefined);
    setMultiDraftDate(undefined);
    const first = workSlots[0]?.date;
    const d = first ? new Date(first) : undefined;
    setSelectedSingleDate(d);
    setSlotsFromDates('single', first ? [first] : []);
  };

  const switchToRange = () => {
    setWorkType('range');
    setSelectedSingleDate(undefined);
    setMultiDraftDate(undefined);
    const dates = workSlots.map((s) => s.date).filter(Boolean).sort();
    if (dates.length >= 2) {
      setSelectedRange({
        from: new Date(dates[0]!),
        to: new Date(dates[dates.length - 1]!),
      });
      setSlotsFromDates('range', dates);
    } else {
      setSelectedRange(undefined);
      setSlotsFromDates('range', dates);
    }
  };

  const switchToMulti = () => {
    setWorkType('multi');
    setSelectedSingleDate(undefined);
    setSelectedRange(undefined);
    const dates = workSlots.map((s) => s.date).filter(Boolean).sort();
    setWorkSlots((prev) =>
      prev.map((s) => ({ ...s, work_type: 'multi' as const })),
    );
    setMultiDraftStart(workSlots[0]?.start || '09:00');
    setMultiDraftEnd(workSlots[0]?.end || '18:00');
    setMultiDraftDate(dates[0] ? new Date(dates[0]) : undefined);
  };

  const handleSingleDateSelect = (d: Date | undefined) => {
    setSelectedSingleDate(d);
    const ds = d ? format(d, 'yyyy-MM-dd') : '';
    setSlotsFromDates('single', ds ? [ds] : []);
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
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
  };

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
    workType,
    selectedSingleDate,
    selectedRange,
    multiDraftDate,
    setMultiDraftDate,
    multiDraftStart,
    setMultiDraftStart,
    multiDraftEnd,
    setMultiDraftEnd,
    recruitCount,
    setRecruitCount,
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
    // handlers
    switchToSingle,
    switchToRange,
    switchToMulti,
    handleSingleDateSelect,
    handleRangeSelect,
    updateMultiSlotTime,
    upsertMultiSlot,
    removeMultiSlot,
    patchCommonFields,
    handleAddKeyword,
    handleRemoveKeyword,
    handlePasteAndParse,
    handleSubmit,
  };
};
