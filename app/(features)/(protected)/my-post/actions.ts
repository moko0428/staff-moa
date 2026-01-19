'use server';

import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

type WorkSlot = {
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  location: string;
  pay_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  pay_amount: number;
  tax_withholding: boolean;
};

const workSlotSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다.'),
  start: z
    .string()
    .regex(/^\d{2}:\d{2}$/, '시작 시간 형식이 올바르지 않습니다.'),
  end: z.string().regex(/^\d{2}:\d{2}$/, '종료 시간 형식이 올바르지 않습니다.'),
  location: z.string().min(1, '장소를 입력해주세요.'),
  pay_type: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
  pay_amount: z.number().positive('급여는 0보다 커야 합니다.'),
  tax_withholding: z.boolean(),
});

const createPostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  description: z.string().min(1, '업무 내용을 입력해주세요.'),
  work_slots: z
    .array(workSlotSchema)
    .min(1, '최소 하나의 날짜/시간/급여 정보를 입력해주세요.'),
  recruit_count: z.number().int().positive('모집인원은 1명 이상이어야 합니다.'),
  manager_name: z.string().min(1, '담당자 이름을 입력해주세요.'),
  manager_phone: z.string().min(1, '담당자 연락처를 입력해주세요.'),
  equipments: z.string().optional(),
  qualifications: z.string().optional(),
  preferences: z.string().optional(),
  notes: z.string().optional(),
  external_link: z
    .string()
    .url('올바른 URL 형식이 아닙니다.')
    .optional()
    .or(z.literal('')),
  keywords: z.array(z.string()).default([]),
  status: z.enum(['recruiting', 'completed', 'urgent']).default('recruiting'),
  form_type: z.enum(['basic', 'free']).default('basic'),
});

const updatePostSchema = createPostSchema.extend({
  id: z.string().uuid('올바른 공고 ID가 아닙니다.'),
});

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string>;
};

export async function createPostAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // profiles에서 role 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'manager') {
      return { ok: false, message: '매니저만 공고를 작성할 수 있습니다.' };
    }

    // work_slots 파싱
    const workSlotsJson = formData.get('work_slots');
    if (!workSlotsJson || typeof workSlotsJson !== 'string') {
      return {
        ok: false,
        message: '날짜/시간/급여 정보가 필요합니다.',
      };
    }

    let workSlots: WorkSlot[];
    try {
      workSlots = JSON.parse(workSlotsJson);
    } catch {
      return {
        ok: false,
        message: '날짜/시간/급여 정보 형식이 올바르지 않습니다.',
      };
    }

    // 키워드 파싱
    const keywordsJson = formData.get('keywords');
    const keywords = keywordsJson
      ? typeof keywordsJson === 'string'
        ? JSON.parse(keywordsJson)
        : keywordsJson
      : [];

    const parsed = createPostSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      work_slots: workSlots,
      recruit_count: Number(formData.get('recruit_count')),
      manager_name: formData.get('manager_name') || profile.name,
      manager_phone: formData.get('manager_phone'),
      equipments: formData.get('equipments') || undefined,
      qualifications: formData.get('qualifications') || undefined,
      preferences: formData.get('preferences') || undefined,
      notes: formData.get('notes') || undefined,
      external_link: formData.get('external_link') || undefined,
      keywords,
      status: formData.get('status') || 'recruiting',
      form_type: formData.get('form_type') || 'basic',
    });

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.';
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      return { ok: false, message: firstError, fieldErrors };
    }

    // work_date, work_time_start, work_time_end는 work_slots의 첫 번째 항목에서 추출
    const firstSlot = parsed.data.work_slots[0];
    const workDate = firstSlot?.date || null;
    const workTimeStart = firstSlot?.start || null;
    const workTimeEnd = firstSlot?.end || null;

    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: parsed.data.title || undefined,
        description: parsed.data.description,
        work_date: workDate,
        work_time_start: workTimeStart,
        work_time_end: workTimeEnd,
        work_slots: parsed.data.work_slots,
        recruit_count: parsed.data.recruit_count,
        manager_name: parsed.data.manager_name,
        manager_phone: parsed.data.manager_phone,
        equipments: parsed.data.equipments || null,
        qualifications: parsed.data.qualifications || null,
        preferences: parsed.data.preferences || null,
        notes: parsed.data.notes || null,
        external_link: parsed.data.external_link || null,
        keywords: parsed.data.keywords,
        author_id: userData.user.id,
        status: parsed.data.status,
        form_type: parsed.data.form_type,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[createPostAction] Supabase insert error', error);
      return {
        ok: false,
        message: '공고 작성에 실패했습니다. 다시 시도해주세요.',
      };
    }

    return {
      ok: true,
      message: '공고가 작성되었습니다.',
      data: { id: data.id },
    };
  } catch (err) {
    console.error('[createPostAction] Unexpected error', err);
    return { ok: false, message: '공고 작성 중 오류가 발생했습니다.' };
  }
}

export async function updatePostAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    const postId = formData.get('id');
    if (!postId || typeof postId !== 'string') {
      return { ok: false, message: '공고 ID가 필요합니다.' };
    }

    // 작성자 확인
    const { data: existingPost } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (!existingPost || existingPost.author_id !== userData.user.id) {
      return { ok: false, message: '수정 권한이 없습니다.' };
    }

    // work_slots 파싱
    const workSlotsJson = formData.get('work_slots');
    if (!workSlotsJson || typeof workSlotsJson !== 'string') {
      return {
        ok: false,
        message: '날짜/시간/급여 정보가 필요합니다.',
      };
    }

    let workSlots: WorkSlot[];
    try {
      workSlots = JSON.parse(workSlotsJson);
    } catch {
      return {
        ok: false,
        message: '날짜/시간/급여 정보 형식이 올바르지 않습니다.',
      };
    }

    const keywordsJson = formData.get('keywords');
    const keywords = keywordsJson
      ? typeof keywordsJson === 'string'
        ? JSON.parse(keywordsJson)
        : keywordsJson
      : [];

    const parsed = updatePostSchema.safeParse({
      id: postId,
      title: formData.get('title'),
      description: formData.get('description'),
      work_slots: workSlots,
      recruit_count: Number(formData.get('recruit_count')),
      manager_name: formData.get('manager_name'),
      manager_phone: formData.get('manager_phone'),
      equipments: formData.get('equipments') || undefined,
      qualifications: formData.get('qualifications') || undefined,
      preferences: formData.get('preferences') || undefined,
      notes: formData.get('notes') || undefined,
      external_link: formData.get('external_link') || undefined,
      keywords,
      status: formData.get('status') || 'recruiting',
      form_type: formData.get('form_type') || 'basic',
    });

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.';
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      return { ok: false, message: firstError, fieldErrors };
    }

    // work_date, work_time_start, work_time_end는 work_slots의 첫 번째 항목에서 추출
    const firstSlot = parsed.data.work_slots[0];
    const workDate = firstSlot?.date || null;
    const workTimeStart = firstSlot?.start || null;
    const workTimeEnd = firstSlot?.end || null;

    const { error } = await supabase
      .from('posts')
      .update({
        title: parsed.data.title,
        description: parsed.data.description,
        work_date: workDate || undefined,
        work_time_start: workTimeStart || undefined,
        work_time_end: workTimeEnd || undefined,
        work_slots: parsed.data.work_slots,
        recruit_count: parsed.data.recruit_count,
        manager_name: parsed.data.manager_name || undefined,
        manager_phone: parsed.data.manager_phone || undefined ,
        equipments: parsed.data.equipments || null,
        qualifications: parsed.data.qualifications || undefined,
        preferences: parsed.data.preferences || null,
        notes: parsed.data.notes || undefined,
        external_link: parsed.data.external_link || undefined,
        keywords: parsed.data.keywords,
        status: parsed.data.status,
        form_type: parsed.data.form_type,
      })
      .eq('id', postId)
      .eq('author_id', userData.user.id);

    if (error) {
      console.error('[updatePostAction] Supabase update error', error);
      return {
        ok: false,
        message: '공고 수정에 실패했습니다. 다시 시도해주세요.',
      };
    }

    return { ok: true, message: '공고가 수정되었습니다.' };
  } catch (err) {
    console.error('[updatePostAction] Unexpected error', err);
    return { ok: false, message: '공고 수정 중 오류가 발생했습니다.' };
  }
}

export async function deletePostAction(postId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('author_id', userData.user.id);

    if (error) {
      console.error('[deletePostAction] Supabase delete error', error);
      return {
        ok: false,
        message: '공고 삭제에 실패했습니다. 다시 시도해주세요.',
      };
    }

    return { ok: true, message: '공고가 삭제되었습니다.' };
  } catch (err) {
    console.error('[deletePostAction] Unexpected error', err);
    return { ok: false, message: '공고 삭제 중 오류가 발생했습니다.' };
  }
}

export async function getMyPostsAction(): Promise<
  ActionResult<Array<Record<string, unknown>>>
> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getMyPostsAction] Supabase select error', error);
      return {
        ok: false,
        message: '공고 목록을 불러오는데 실패했습니다.',
        data: [],
      };
    }

    return { ok: true, message: '', data: data || [] };
  } catch (err) {
    console.error('[getMyPostsAction] Unexpected error', err);
    return {
      ok: false,
      message: '공고 목록을 불러오는 중 오류가 발생했습니다.',
      data: [],
    };
  }
}

export async function getPostByIdAction(
  postId: string
): Promise<ActionResult<Record<string, unknown> | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) {
      console.error('[getPostByIdAction] Supabase select error', error);
      return {
        ok: false,
        message: '공고를 불러오는데 실패했습니다.',
        data: null,
      };
    }

    return { ok: true, message: '', data: data || null };
  } catch (err) {
    console.error('[getPostByIdAction] Unexpected error', err);
    return {
      ok: false,
      message: '공고를 불러오는 중 오류가 발생했습니다.',
      data: null,
    };
  }
}

export async function getAllPostsAction(): Promise<
  ActionResult<Array<Record<string, unknown>>>
> {
  try {
      const supabase = await createClient();
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .in('status', ['recruiting', 'urgent'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getAllPostsAction] Supabase select error', error);
      return {
        ok: false,
        message: '공고 목록을 불러오는데 실패했습니다.',
        data: [],
      };
    }

    return { ok: true, message: '', data: data || [] };
  } catch (err) {
    console.error('[getAllPostsAction] Unexpected error', err);
    return {
      ok: false,
      message: '공고 목록을 불러오는 중 오류가 발생했습니다.',
      data: [],
    };
  }
}
