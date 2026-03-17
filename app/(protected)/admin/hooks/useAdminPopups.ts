'use client';

import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient as createBrowserClient } from '@/utils/supabase/client';
import {
  getPopupsAction,
  createPopupAction,
  updatePopupAction,
  deletePopupAction,
  togglePopupActiveAction,
  type LandingPopup,
} from '@/app/(landing)/landing/popup-actions';
import type { PopupFormState } from '../types';

const EMPTY_FORM: PopupFormState = {
  title: '',
  content: '',
  image_url: '',
  link_url: '',
  link_text: '',
  is_active: false,
};

async function fetchPopups(): Promise<LandingPopup[]> {
  const result = await getPopupsAction();
  return result.ok && result.data ? result.data : [];
}

export const useAdminPopups = () => {
  const queryClient = useQueryClient();
  const [editingPopup, setEditingPopup] = useState<LandingPopup | null>(null);
  const [popupForm, setPopupForm] = useState<PopupFormState>(EMPTY_FORM);
  const [popupSaving, setPopupSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const popupImageInputRef = useRef<HTMLInputElement>(null);

  const { data: popups = [], isLoading: loadingPopups } = useQuery({
    queryKey: ['admin', 'popups'],
    queryFn: fetchPopups,
  });

  const invalidatePopups = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'popups'] });

  const resetPopupForm = () => {
    setEditingPopup(null);
    setPopupForm(EMPTY_FORM);
  };

  const handleEditPopup = (popup: LandingPopup) => {
    setEditingPopup(popup);
    setPopupForm({
      title: popup.title,
      content: popup.content,
      image_url: popup.image_url ?? '',
      link_url: popup.link_url ?? '',
      link_text: popup.link_text ?? '',
      is_active: popup.is_active,
    });
  };

  const handlePopupImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setImageUploading(true);
    try {
      const supabase = createBrowserClient();
      const safeName =
        file.name
          .normalize('NFKD')
          .replace(/[^\w.-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') || `file-${Date.now()}`;
      const filePath = `admin/popups/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });
      if (error) throw error;
      const {
        data: { publicUrl },
      } = supabase.storage.from('profiles').getPublicUrl(filePath);
      setPopupForm((p) => ({ ...p, image_url: publicUrl }));
      toast.success('이미지가 업로드되었습니다.');
    } catch {
      toast.error('이미지 업로드에 실패했습니다.');
    } finally {
      setImageUploading(false);
      if (popupImageInputRef.current) popupImageInputRef.current.value = '';
    }
  };

  const handleRemovePopupImage = async () => {
    const url = popupForm.image_url;
    setPopupForm((p) => ({ ...p, image_url: '' }));
    if (url) {
      const match = url.match(/\/object\/public\/([^/]+)\/(.+)$/);
      if (match) {
        const supabase = createBrowserClient();
        await supabase.storage.from(match[1]).remove([match[2]]);
      }
    }
  };

  const handleSavePopup = async () => {
    if (!popupForm.title.trim() || !popupForm.content.trim()) {
      toast.error('제목과 내용을 입력해주세요.');
      return;
    }
    setPopupSaving(true);
    try {
      const payload = {
        title: popupForm.title.trim(),
        content: popupForm.content.trim(),
        image_url: popupForm.image_url.trim() || undefined,
        link_url: popupForm.link_url.trim() || undefined,
        link_text: popupForm.link_text.trim() || undefined,
        is_active: popupForm.is_active,
      };
      const result = editingPopup
        ? await updatePopupAction(editingPopup.popup_id, payload)
        : await createPopupAction(payload);

      if (result.ok) {
        toast.success(result.message);
        resetPopupForm();
        await invalidatePopups();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('팝업 저장에 실패했습니다.');
    } finally {
      setPopupSaving(false);
    }
  };

  const handleDeletePopup = async (popupId: string) => {
    try {
      const result = await deletePopupAction(popupId);
      if (result.ok) {
        toast.success(result.message);
        if (editingPopup?.popup_id === popupId) resetPopupForm();
        queryClient.setQueryData<LandingPopup[]>(
          ['admin', 'popups'],
          (old) => (old ? old.filter((p) => p.popup_id !== popupId) : [])
        );
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('팝업 삭제에 실패했습니다.');
    }
  };

  const handleTogglePopupActive = async (popupId: string, activate: boolean) => {
    try {
      const result = await togglePopupActiveAction(popupId, activate);
      if (result.ok) {
        toast.success(result.message);
        await invalidatePopups();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('팝업 상태 변경에 실패했습니다.');
    }
  };

  return {
    popups,
    loadingPopups,
    editingPopup,
    popupForm,
    setPopupForm,
    popupSaving,
    imageUploading,
    popupImageInputRef,
    resetPopupForm,
    handleEditPopup,
    handlePopupImageUpload,
    handleRemovePopupImage,
    handleSavePopup,
    handleDeletePopup,
    handleTogglePopupActive,
  };
};
