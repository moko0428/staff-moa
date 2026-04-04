'use client';

import { useState, useEffect, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updatePostAction, getPostByIdAction } from '../actions';
import { convertToWorkParts } from './useCreatePost';
import { parsePastedText } from '../utils/pasteParser';
import { extractPostText } from '../utils/textExtractor';
import type { WorkPart, WorkShift } from '../types';

const initialState = { ok: false, message: '', data: undefined };

export const useEditPost = (postId: string, isManager: boolean) => {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    updatePostAction,
    initialState,
  );
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workParts, setWorkParts] = useState<WorkPart[]>([]);
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
  const [formType, setFormType] = useState<'basic' | 'free'>('basic');

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [openSections, setOpenSections] = useState<string[]>([
    'basic-info', 'work-info', 'manager-info', 'additional-info',
  ]);
  const [pasteHighlights, setPasteHighlights] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const result = await getPostByIdAction(postId);
        if (result.ok && result.data) {
          const post = result.data as Record<string, unknown>;
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
          setStatus(
            (post.status as 'recruiting' | 'completed' | 'urgent') || 'recruiting',
          );
          setFormType((post.form_type as 'basic' | 'free') || 'basic');

          if (post.work_slots && Array.isArray(post.work_slots) && (post.work_slots as Array<unknown>).length > 0) {
            const rawSlots = post.work_slots as Array<Record<string, unknown>>;
            setWorkParts(convertToWorkParts(rawSlots, post));
          } else {
            setWorkParts([{
              name: '',
              description: '',
              location: (post.location as string) || '',
              pay_type: ((post.pay_type || 'daily') as WorkPart['pay_type']),
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
        } else {
          toast.error('공고를 불러오는데 실패했습니다.');
          router.push('/my-post');
        }
      } catch (err) {
        console.error('Failed to fetch post', err);
        toast.error('공고를 불러오는 중 오류가 발생했습니다.');
        router.push('/my-post');
      } finally {
        setLoading(false);
      }
    };

    if (postId && isManager) {
      fetchPost();
    }
  }, [postId, isManager, router]);

  useEffect(() => {
    if (state.ok) {
      const timer = setTimeout(() => {
        router.push('/my-post');
        router.refresh();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

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
        shifts: [{ date: '', start: '', end: '' }],
      },
    ]);
  };

  const handleRemovePart = (partIndex: number) => {
    if (workParts.length > 1) {
      setWorkParts((prev) => prev.filter((_, i) => i !== partIndex));
    }
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
        if (shared?.date_end !== undefined) newShift.date_end = '';
        return { ...part, shifts: [...part.shifts, newShift] };
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

  const handleToggleShiftMode = (partIndex: number, shiftIndex: number) => {
    setWorkParts((prev) =>
      prev.map((part, i) => {
        if (i !== partIndex) return part;
        return {
          ...part,
          shifts: part.shifts.map((shift, si) => {
            if (si !== shiftIndex) return shift;
            if (shift.date_end !== undefined) {
              const next = { ...shift };
              delete next.date_end;
              return next;
            }
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
    if (parsed.keywords.length > 0) {
      setKeywords((prev) => {
        const existing = new Set(prev);
        const toAdd = parsed.keywords.filter((k) => !existing.has(k));
        return [...prev, ...toAdd];
      });
      newOpenSections.add('basic-info');
    }
    if (parsed.workParts.length > 0) {
      setWorkParts(parsed.workParts);
      newOpenSections.add('work-info');
      parsed.workParts.forEach((_, i) => {
        highlights.add(`part-${i}-location`);
        highlights.add(`part-${i}-shift-0-date`);
      });
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
      keywords,
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

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const totalRecruitCount = workParts.reduce((acc, p) => acc + p.recruit_count, 0);

    const formData = new FormData();
    formData.append('id', postId);
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
    formData.append('form_type', formType);

    startTransition(() => {
      formAction(formData);
    });
  };

  return {
    state,
    isPending,
    loading,
    formType,
    setFormType,
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
    handleRemoveShift,
    handleUpdateShift,
    handleToggleShiftMode,
    handleUpdatePartTime,
    handleAddKeyword,
    handleRemoveKeyword,
    handlePasteAndParse,
    handleExtract,
    handleSubmit,
  };
};
