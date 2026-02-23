'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export type LandingPopup = {
  popup_id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('관리자만 접근할 수 있습니다.');
}

// Public: active popup for landing page (anon-safe)
export async function getActivePopupAction(): Promise<ActionResult<LandingPopup | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('landing_popups')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return { ok: true, message: '', data: data as LandingPopup | null };
  } catch (err) {
    console.error('[getActivePopupAction]', err);
    return { ok: false, message: '팝업 조회 중 오류가 발생했습니다.', data: null };
  }
}

// Admin: list all popups
export async function getPopupsAction(): Promise<ActionResult<LandingPopup[]>> {
  try {
    await assertAdmin();
    const service = getServiceClient();
    const { data, error } = await service
      .from('landing_popups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { ok: true, message: '', data: (data as LandingPopup[]) ?? [] };
  } catch (err) {
    console.error('[getPopupsAction]', err);
    return { ok: false, message: '팝업 목록 조회 중 오류가 발생했습니다.', data: [] };
  }
}

// Admin: create popup
export async function createPopupAction(payload: {
  title: string;
  content: string;
  image_url?: string;
  link_url?: string;
  link_text?: string;
  is_active: boolean;
}): Promise<ActionResult<LandingPopup>> {
  try {
    await assertAdmin();
    const service = getServiceClient();

    // If activating, deactivate all others first
    if (payload.is_active) {
      await service.from('landing_popups').update({ is_active: false }).eq('is_active', true);
    }

    const { data, error } = await service
      .from('landing_popups')
      .insert({
        title: payload.title,
        content: payload.content,
        image_url: payload.image_url || null,
        link_url: payload.link_url || null,
        link_text: payload.link_text || null,
        is_active: payload.is_active,
      })
      .select()
      .single();

    if (error) throw error;
    return { ok: true, message: '팝업이 생성되었습니다.', data: data as LandingPopup };
  } catch (err) {
    console.error('[createPopupAction]', err);
    return { ok: false, message: '팝업 생성 중 오류가 발생했습니다.' };
  }
}

// Admin: update popup
export async function updatePopupAction(
  popupId: string,
  payload: {
    title: string;
    content: string;
    image_url?: string;
    link_url?: string;
    link_text?: string;
    is_active: boolean;
  }
): Promise<ActionResult<LandingPopup>> {
  try {
    await assertAdmin();
    const service = getServiceClient();

    if (payload.is_active) {
      await service
        .from('landing_popups')
        .update({ is_active: false })
        .eq('is_active', true)
        .neq('popup_id', popupId);
    }

    const { data, error } = await service
      .from('landing_popups')
      .update({
        title: payload.title,
        content: payload.content,
        image_url: payload.image_url || null,
        link_url: payload.link_url || null,
        link_text: payload.link_text || null,
        is_active: payload.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('popup_id', popupId)
      .select()
      .single();

    if (error) throw error;
    return { ok: true, message: '팝업이 수정되었습니다.', data: data as LandingPopup };
  } catch (err) {
    console.error('[updatePopupAction]', err);
    return { ok: false, message: '팝업 수정 중 오류가 발생했습니다.' };
  }
}

// Admin: delete popup
export async function deletePopupAction(popupId: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const service = getServiceClient();
    const { error } = await service
      .from('landing_popups')
      .delete()
      .eq('popup_id', popupId);

    if (error) throw error;
    return { ok: true, message: '팝업이 삭제되었습니다.' };
  } catch (err) {
    console.error('[deletePopupAction]', err);
    return { ok: false, message: '팝업 삭제 중 오류가 발생했습니다.' };
  }
}

// Admin: toggle active (activate one, deactivate others)
export async function togglePopupActiveAction(
  popupId: string,
  activate: boolean
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const service = getServiceClient();

    if (activate) {
      // Deactivate all, then activate target
      await service.from('landing_popups').update({ is_active: false }).eq('is_active', true);
    }

    const { error } = await service
      .from('landing_popups')
      .update({ is_active: activate, updated_at: new Date().toISOString() })
      .eq('popup_id', popupId);

    if (error) throw error;
    return {
      ok: true,
      message: activate ? '팝업이 활성화되었습니다.' : '팝업이 비활성화되었습니다.',
    };
  } catch (err) {
    console.error('[togglePopupActiveAction]', err);
    return { ok: false, message: '팝업 상태 변경 중 오류가 발생했습니다.' };
  }
}
