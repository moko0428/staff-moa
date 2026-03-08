'use client';

import { useState, useEffect, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updatePostAction, getPostByIdAction } from '../actions';
import type { EditWorkSlot } from '../types';

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
  const [workSlots, setWorkSlots] = useState<EditWorkSlot[]>([]);
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
  const [formType, setFormType] = useState<'basic' | 'free'>('basic');

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const result = await getPostByIdAction(postId);
        if (result.ok && result.data) {
          const post = result.data as Record<string, unknown>;
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
          setStatus(
            (post.status as 'recruiting' | 'completed' | 'urgent') ||
              'recruiting',
          );
          setFormType((post.form_type as 'basic' | 'free') || 'basic');

          if (
            post.work_slots &&
            Array.isArray(post.work_slots) &&
            post.work_slots.length > 0
          ) {
            const convertedWorkSlots: EditWorkSlot[] = (
              post.work_slots as Array<Record<string, unknown>>
            ).map((slot) => ({
              date: (slot.date as string) || (post.work_date as string) || '',
              start:
                (slot.start_time as string) ||
                (slot.start as string) ||
                (post.work_time_start as string) ||
                '',
              end:
                (slot.end_time as string) ||
                (slot.end as string) ||
                (post.work_time_end as string) ||
                '',
              location:
                (slot.location as string) || (post.location as string) || '',
              pay_type: (slot.pay_type || post.pay_type || 'hourly') as
                | 'hourly'
                | 'daily'
                | 'weekly'
                | 'monthly',
              pay_amount:
                (slot.pay_amount as number) || Number(post.pay_amount) || 0,
              tax_withholding: (slot.tax_withholding !== undefined
                ? slot.tax_withholding
                : post.tax_withholding || false) as boolean,
            }));
            setWorkSlots(convertedWorkSlots);
          } else {
            setWorkSlots([
              {
                date: (post.work_date as string) || '',
                start: (post.work_time_start as string) || '',
                end: (post.work_time_end as string) || '',
                location: (post.location as string) || '',
                pay_type: (post.pay_type || 'hourly') as
                  | 'hourly'
                  | 'daily'
                  | 'weekly'
                  | 'monthly',
                pay_amount: Number(post.pay_amount) || 0,
                tax_withholding: (post.tax_withholding as boolean) || false,
              },
            ]);
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

  const handleAddWorkSlot = () => {
    setWorkSlots([
      ...workSlots,
      {
        date: '',
        start: '',
        end: '',
        location: workSlots[0]?.location || '',
        pay_type: workSlots[0]?.pay_type || 'hourly',
        pay_amount: workSlots[0]?.pay_amount || 0,
        tax_withholding: workSlots[0]?.tax_withholding || false,
      },
    ]);
  };

  const handleRemoveWorkSlot = (index: number) => {
    if (workSlots.length > 1) {
      setWorkSlots(workSlots.filter((_, i) => i !== index));
    }
  };

  const handleWorkSlotChange = (
    index: number,
    field: keyof EditWorkSlot,
    value: string | number | boolean,
  ) => {
    const updated = [...workSlots];
    updated[index] = { ...updated[index], [field]: value };
    setWorkSlots(updated);
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('id', postId);
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
    workSlots,
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
    handleAddWorkSlot,
    handleRemoveWorkSlot,
    handleWorkSlotChange,
    handleAddKeyword,
    handleRemoveKeyword,
    handleSubmit,
  };
};
