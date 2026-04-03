'use server';

import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { createBulkNotificationsAction } from '@/app/(protected)/notification/actions';

type WorkShift = {
  date: string;
  start: string;
  end: string;
};

type WorkPart = {
  name: string;
  description?: string;
  location: string;
  pay_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  pay_amount: number;
  recruit_count: number;
  tax_withholding: boolean;
  meal_included?: boolean;
  meal_amount?: number;
  shifts: WorkShift[];
};

const workShiftSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다.'),
  start: z.string().regex(/^\d{2}:\d{2}$/, '시작 시간 형식이 올바르지 않습니다.'),
  end: z.string().regex(/^\d{2}:\d{2}$/, '종료 시간 형식이 올바르지 않습니다.'),
});

const workPartSchema = z.object({
  name: z.string().default(''),
  description: z.string().optional().default(''),
  location: z.string().min(1, '장소를 입력해주세요.'),
  pay_type: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
  pay_amount: z.number().positive('급여는 0보다 커야 합니다.'),
  recruit_count: z.number().int().min(1, '파트 모집인원은 1명 이상이어야 합니다.'),
  tax_withholding: z.boolean(),
  meal_included: z.boolean().optional().default(false),
  meal_amount: z.number().min(0).optional().default(0),
  shifts: z.array(workShiftSchema).min(1, '최소 하나의 날짜/시간을 입력해주세요.'),
});

const createPostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  description: z.string().min(1, '업무 내용을 입력해주세요.'),
  work_slots: z
    .array(workPartSchema)
    .min(1, '최소 하나의 파트 정보를 입력해주세요.'),
  recruit_count: z.number().int().positive('모집인원은 1명 이상이어야 합니다.'),
  recruit_male: z.number().int().min(0).nullable().optional(),
  recruit_female: z.number().int().min(0).nullable().optional(),
  manager_name: z.string().min(1, '담당자 이름을 입력해주세요.'),
  manager_contact_type: z.enum(['phone', 'kakao', 'email', 'other']).default('phone'),
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
  keywords: z.array(z.string()).min(1, '키워드를 최소 하나 이상 입력해주세요.'),
  status: z.enum(['recruiting', 'completed', 'urgent']).default('recruiting'),
  form_type: z.enum(['basic', 'free']).default('basic'),
});

const updatePostSchema = createPostSchema.extend({
  id: z.string().min(1, '공고 ID가 필요합니다.'),
});

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string>;
};

function normalizeKeyword(input: string): string {
  return input.trim().toLowerCase();
}

// 포스트의 날짜/시간을 확인하여 과거인지 판단하는 헬퍼 함수
function isPostPast(post: Record<string, unknown>): boolean {
  const now = new Date();

  if (post.work_slots && Array.isArray(post.work_slots) && post.work_slots.length > 0) {
    const slots = post.work_slots as Array<Record<string, unknown>>;
    const firstSlot = slots[0];

    if (firstSlot && 'shifts' in firstSlot) {
      // v3: WorkPart[] — 모든 파트의 모든 shift 중 가장 마지막 날짜/시간 확인
      let lastShiftDate = '';
      let lastShiftEnd = '';
      for (const part of slots) {
        const shifts = part.shifts as Array<Record<string, unknown>> | undefined;
        if (shifts && shifts.length > 0) {
          for (const shift of shifts) {
            const shiftDate = shift.date as string;
            const shiftEnd = shift.end as string;
            if (shiftDate && shiftDate >= lastShiftDate) {
              lastShiftDate = shiftDate;
              lastShiftEnd = shiftEnd || '';
            }
          }
        }
      }
      if (lastShiftDate && lastShiftEnd) {
        try {
          const [hours, minutes] = lastShiftEnd.split(':').map(Number);
          const workDateTime = new Date(lastShiftDate);
          workDateTime.setHours(hours!, minutes!, 0, 0);
          return workDateTime < now;
        } catch {
          // 파싱 실패 시 기본값 사용
        }
      }
    } else {
      // v2/v1: 날짜 중심 슬롯
      const lastSlot = slots[slots.length - 1];
      const lastDate = lastSlot?.date as string;
      const parts = lastSlot?.parts as Array<Record<string, unknown>> | undefined;
      const lastPart = parts && parts.length > 0 ? parts[parts.length - 1] : undefined;
      const lastEndTime = (lastPart?.end || lastSlot?.end_time || lastSlot?.end) as string;
      if (lastDate && lastEndTime) {
        try {
          const [hours, minutes] = lastEndTime.split(':').map(Number);
          const workDateTime = new Date(lastDate);
          workDateTime.setHours(hours!, minutes!, 0, 0);
          return workDateTime < now;
        } catch {
          // 파싱 실패 시 기본값 사용
        }
      }
    }
  }

  // work_slots가 없으면 테이블 레벨 데이터 사용
  const workDate = post.work_date as string;
  const workTimeEnd = post.work_time_end as string;

  if (workDate && workTimeEnd) {
    try {
      const [hours, minutes] = workTimeEnd.split(':').map(Number);
      const workDateTime = new Date(workDate);
      workDateTime.setHours(hours!, minutes!, 0, 0);
      return workDateTime < now;
    } catch {
      // 파싱 실패 시 false 반환
    }
  }

  return false;
}

// 포스트 상태를 자동으로 업데이트하는 함수
async function updatePostStatusIfPast(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: number | string
): Promise<void> {
  try {
    const { data: post } = await supabase
      .from('posts')
      .select('*')
      .eq('post_id', postId)
      .single();

    if (!post) return;

    if (post.status === 'completed') return;

    if (isPostPast(post)) {
      await supabase
        .from('posts')
        .update({ status: 'completed' })
        .eq('post_id', postId);
    }
  } catch (error) {
    console.error('[updatePostStatusIfPast] Error updating post status:', error);
  }
}

// 상태만 변경하는 서버 액션 (급구/모집중/모집완료 토글용)
export async function updatePostStatusAction(
  postId: string,
  status: 'recruiting' | 'completed' | 'urgent'
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 공고 정보 가져오기 (이전 상태와 제목 확인)
    const { data: post } = await supabase
      .from('posts')
      .select('status, title')
      .eq('post_id', postId)
      .eq('author_id', userData.user.id)
      .single();

    if (!post) {
      return { ok: false, message: '공고를 찾을 수 없습니다.' };
    }

    const previousStatus = post.status;

    const { error } = await supabase
      .from('posts')
      .update({ status })
      .eq('post_id', postId)
      .eq('author_id', userData.user.id);

    if (error) {
      console.error('[updatePostStatusAction] Supabase update error', error);
      return {
        ok: false,
        message: '공고 상태 변경에 실패했습니다. 다시 시도해주세요.',
      };
    }

    // 모집완료 → 모집중/급구로 변경 시 관심 목록 사용자에게 알림
    if (previousStatus === 'completed' && (status === 'recruiting' || status === 'urgent')) {
      // 해당 공고를 관심 목록에 추가한 사용자 조회
      const { data: favorites } = await supabase
        .from('favorites_posts')
        .select('user_id')
        .eq('post_id', postId);

      if (favorites && favorites.length > 0) {
        const statusText = status === 'urgent' ? '급구' : '모집';
        const notifications = favorites.map((fav) => ({
          userId: fav.user_id,
          type: 'system' as const,
          title: '관심 공고가 다시 모집을 시작했습니다',
          message: `"${post.title}" 공고가 다시 ${statusText}중입니다. 지금 확인해보세요!`,
          link: `/post?id=${postId}`,
        }));

        await createBulkNotificationsAction(notifications);
      }
    }

    return { ok: true, message: '공고 상태가 변경되었습니다.' };
  } catch (err) {
    console.error('[updatePostStatusAction] Unexpected error', err);
    return {
      ok: false,
      message: '공고 상태 변경 중 오류가 발생했습니다.',
    };
  }
}

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

    let workSlots: WorkPart[];
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

    // recruit_male / recruit_female 파싱
    const recruitMaleRaw = formData.get('recruit_male');
    const recruitFemaleRaw = formData.get('recruit_female');
    const recruitMale = recruitMaleRaw ? Number(recruitMaleRaw) : null;
    const recruitFemale = recruitFemaleRaw ? Number(recruitFemaleRaw) : null;

    const parsed = createPostSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      work_slots: workSlots,
      recruit_count: Number(formData.get('recruit_count')),
      recruit_male: recruitMale,
      recruit_female: recruitFemale,
      manager_name: formData.get('manager_name') || profile.name,
      manager_contact_type: formData.get('manager_contact_type') || 'phone',
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

    // 키워드 정규화 (매칭/overlaps 안정화)
    const normalizedKeywords = Array.isArray(parsed.data.keywords)
      ? parsed.data.keywords
          .map((k) => normalizeKeyword(String(k)))
          .filter(Boolean)
      : [];

    // 레거시 컬럼용: 첫 번째 파트의 첫 번째 shift에서 추출
    const firstPart = parsed.data.work_slots[0];
    const firstShift = firstPart?.shifts?.[0];
    const workDate = firstShift?.date || null;
    const workTimeStart = firstShift?.start || null;
    const workTimeEnd = firstShift?.end || null;
    const location = firstPart?.location || '';
    const payAmount = firstPart?.pay_amount || 0;
    const payType = firstPart?.pay_type || 'daily';
    const taxWithholding = firstPart?.tax_withholding || false;

    // work_slots = WorkPart[] 그대로 저장
    const transformedWorkSlots = parsed.data.work_slots.map((part) => ({
      name: part.name,
      description: part.description ?? '',
      location: part.location,
      pay_type: part.pay_type,
      pay_amount: part.pay_amount,
      recruit_count: part.recruit_count,
      tax_withholding: part.tax_withholding,
      meal_included: part.meal_included ?? false,
      meal_amount: part.meal_amount ?? 0,
      shifts: part.shifts,
    }));

    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: parsed.data.title,
        description: parsed.data.description,
        work_date: workDate,
        work_time_start: workTimeStart,
        work_time_end: workTimeEnd,
        location: location,
        pay_amount: payAmount.toString(),
        pay_type: payType,
        tax_withholding: taxWithholding,
        work_slots: transformedWorkSlots,
        recruit_count: parsed.data.recruit_count,
        recruit_male: parsed.data.recruit_male ?? null,
        recruit_female: parsed.data.recruit_female ?? null,
        manager_name: parsed.data.manager_name,
        manager_contact_type: parsed.data.manager_contact_type,
        manager_phone: parsed.data.manager_phone,
        equipments: parsed.data.equipments || null,
        qualifications: parsed.data.qualifications || null,
        preferences: parsed.data.preferences || null,
        notes: parsed.data.notes || null,
        external_link: parsed.data.external_link || null,
        keywords: normalizedKeywords,
        author_id: userData.user.id,
        status: parsed.data.status,
        form_type: parsed.data.form_type,
      })
      .select('post_id')
      .single();

    if (error) {
      console.error('[createPostAction] Supabase insert error', error);
      return {
        ok: false,
        message: '공고 작성에 실패했습니다. 다시 시도해주세요.',
      };
    }

    // 알림: 관심 키워드 매칭 + 팔로우 매니저
    try {
      const postId = data.post_id;
      const link = `/post/${postId}`;

      const followerRecipients = new Set<string>();
      const keywordRecipients = new Set<string>();

      // 1) 팔로우한 사용자
      const { data: follows } = await supabase
        .from('manager_follows')
        .select('follower_id')
        .eq('manager_id', userData.user.id);
      (follows || []).forEach((f) => {
        if (f.follower_id) followerRecipients.add(String(f.follower_id));
      });

      // 2) 관심 키워드 매칭 사용자
      if (normalizedKeywords.length > 0) {
        const { data: kwUsers } = await supabase
          .from('favorites_keywords')
          .select('user_id, keyword')
          .in('keyword', normalizedKeywords);
        (kwUsers || []).forEach((u) => {
          if (u.user_id) keywordRecipients.add(String(u.user_id));
        });
      }

      followerRecipients.delete(userData.user.id);
      keywordRecipients.delete(userData.user.id);

      if (parsed.data.status !== 'completed') {
        const notifications: Array<{
          userId: string;
          type: 'system';
          title: string;
          message: string;
          link: string;
        }> = [];

        // 팔로우 알림
        if (followerRecipients.size > 0) {
          const managerName = parsed.data.manager_name || profile?.name || '매니저';
          Array.from(followerRecipients).forEach((userId) => {
            notifications.push({
              userId,
              type: 'system',
              title: '팔로우 매니저 공고 알림',
              message: `${managerName} 매니저님이 공고를 올리셨습니다 지금 바로 확인해보세요!`,
              link,
            });
          });
        }

        // 키워드 알림
        if (keywordRecipients.size > 0) {
          Array.from(keywordRecipients).forEach((userId) => {
            if (followerRecipients.has(userId)) return;
            notifications.push({
              userId,
              type: 'system',
              title: '관심 공고 알림',
              message: `"${parsed.data.title}" 공고가 등록되었습니다. 지금 확인해보세요!`,
              link,
            });
          });
        }

        if (notifications.length > 0) {
          await createBulkNotificationsAction(notifications);
        }
      }
    } catch (notifyErr) {
      console.error('[createPostAction] Failed to notify favorites', notifyErr);
    }

    return {
      ok: true,
      message: '공고가 작성되었습니다.',
      data: { id: data.post_id.toString() },
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
      .eq('post_id', postId)
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

    let workSlots: WorkPart[];
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

    // recruit_male / recruit_female 파싱
    const recruitMaleRaw = formData.get('recruit_male');
    const recruitFemaleRaw = formData.get('recruit_female');
    const recruitMale = recruitMaleRaw ? Number(recruitMaleRaw) : null;
    const recruitFemale = recruitFemaleRaw ? Number(recruitFemaleRaw) : null;

    const parsed = updatePostSchema.safeParse({
      id: postId,
      title: formData.get('title'),
      description: formData.get('description'),
      work_slots: workSlots,
      recruit_count: Number(formData.get('recruit_count')),
      recruit_male: recruitMale,
      recruit_female: recruitFemale,
      manager_name: formData.get('manager_name'),
      manager_contact_type: formData.get('manager_contact_type') || 'phone',
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

    // 레거시 컬럼용: 첫 번째 파트의 첫 번째 shift에서 추출
    const firstPart = parsed.data.work_slots[0];
    const firstShift = firstPart?.shifts?.[0];
    const workDate = firstShift?.date || null;
    const workTimeStart = firstShift?.start || null;
    const workTimeEnd = firstShift?.end || null;
    const location = firstPart?.location || '';
    const payAmount = firstPart?.pay_amount || 0;
    const payType = firstPart?.pay_type || 'daily';
    const taxWithholding = firstPart?.tax_withholding || false;

    // work_slots = WorkPart[] 그대로 저장
    const transformedWorkSlots = parsed.data.work_slots.map((part) => ({
      name: part.name,
      description: part.description ?? '',
      location: part.location,
      pay_type: part.pay_type,
      pay_amount: part.pay_amount,
      recruit_count: part.recruit_count,
      tax_withholding: part.tax_withholding,
      meal_included: part.meal_included ?? false,
      meal_amount: part.meal_amount ?? 0,
      shifts: part.shifts,
    }));

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('posts')
      .update({
        title: parsed.data.title,
        description: parsed.data.description,
        work_date: workDate,
        work_time_start: workTimeStart,
        work_time_end: workTimeEnd,
        location: location,
        pay_amount: payAmount.toString(),
        pay_type: payType,
        tax_withholding: taxWithholding,
        work_slots: transformedWorkSlots,
        recruit_count: parsed.data.recruit_count,
        recruit_male: parsed.data.recruit_male ?? null,
        recruit_female: parsed.data.recruit_female ?? null,
        manager_name: parsed.data.manager_name,
        manager_contact_type: parsed.data.manager_contact_type,
        manager_phone: parsed.data.manager_phone,
        equipments: parsed.data.equipments || null,
        qualifications: parsed.data.qualifications || null,
        preferences: parsed.data.preferences || null,
        notes: parsed.data.notes || null,
        external_link: parsed.data.external_link || null,
        keywords: parsed.data.keywords,
        status: parsed.data.status,
        form_type: parsed.data.form_type,
        created_at: now,
        updated_at: now,
      })
      .eq('post_id', postId)
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

export async function deletePostAction(
  postId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 공고 삭제 시: 스케줄을 worker의 개인 스케줄로 이전
    // + 매칭(승인) 지원자에게 공고 삭제 알림 전송
    const { data: schedules, error: scheduleError } = await supabase
      .from('member_schedules')
      .select(
        `
          member_id,
          status,
          posts (
            title,
            description,
            work_date,
            work_time_start,
            work_time_end,
            location,
            pay_amount,
            pay_type,
            manager_name,
            manager_contact_type,
            manager_phone,
            work_slots
          )
        `
      )
      .eq('post_id', postId)
      .neq('status', 'rejected');

    if (scheduleError) {
      console.error('[deletePostAction] Failed to fetch schedules', scheduleError);
    }

    if (schedules && schedules.length > 0) {
      const personalSchedules: Array<Record<string, unknown>> = [];

      for (const schedule of schedules) {
        const post = Array.isArray(schedule.posts)
          ? schedule.posts[0]
          : schedule.posts;
        if (!post) continue;

        // work_slots가 있으면 각 slot별로 개인 스케줄 생성
        const workSlots = Array.isArray(post.work_slots)
          ? (post.work_slots as Array<Record<string, unknown>>)
          : [];

        if (workSlots.length > 0) {
          const firstWorkSlot = workSlots[0];
          if (firstWorkSlot && 'shifts' in firstWorkSlot) {
            // v3: WorkPart[] — 각 파트의 첫 shift로 스케줄 생성
            for (const part of workSlots) {
              const shifts = part.shifts as Array<Record<string, unknown>> | undefined;
              const firstShift = shifts && shifts.length > 0 ? shifts[0] : undefined;
              personalSchedules.push({
                user_id: schedule.member_id,
                title: post.title,
                date: (firstShift?.date as string) || post.work_date,
                start_time: (firstShift?.start as string) || post.work_time_start || '00:00',
                end_time: (firstShift?.end as string) || post.work_time_end || '23:59',
                location: (part.location as string) || post.location || null,
                pay_type: (part.pay_type as string) || post.pay_type || 'daily',
                pay_amount: (part.pay_amount as number) || post.pay_amount || null,
                description: post.description || null,
                manager_name: post.manager_name || null,
                manager_contact_type: post.manager_contact_type || 'phone',
                manager_phone: post.manager_phone || null,
              });
            }
          } else {
            // v2/v1: 날짜 중심 슬롯
            for (const slot of workSlots) {
              const parts = slot.parts as Array<Record<string, unknown>> | undefined;
              const firstPart = parts && parts.length > 0 ? parts[0] : undefined;
              const startTime =
                (firstPart?.start as string) ||
                (slot.start_time as string) ||
                (slot.start as string) ||
                post.work_time_start ||
                '00:00';
              const endTime =
                (firstPart?.end as string) ||
                (slot.end_time as string) ||
                (slot.end as string) ||
                post.work_time_end ||
                '23:59';

              personalSchedules.push({
                user_id: schedule.member_id,
                title: post.title,
                date: (slot.date as string) || post.work_date,
                start_time: startTime,
                end_time: endTime,
                location: (slot.location as string) || post.location || null,
                pay_type: (slot.pay_type as string) || post.pay_type || 'daily',
                pay_amount: (slot.pay_amount as number) || post.pay_amount || null,
                description: post.description || null,
                manager_name: post.manager_name || null,
                manager_contact_type: post.manager_contact_type || 'phone',
                manager_phone: post.manager_phone || null,
              });
            }
          }
        } else {
          personalSchedules.push({
            user_id: schedule.member_id,
            title: post.title,
            date: post.work_date,
            start_time: post.work_time_start || '00:00',
            end_time: post.work_time_end || '23:59',
            location: post.location || null,
            pay_type: post.pay_type || 'daily',
            pay_amount: post.pay_amount || null,
            description: post.description || null,
            manager_name: post.manager_name || null,
            manager_contact_type: post.manager_contact_type || 'phone',
            manager_phone: post.manager_phone || null,
          });
        }
      }

      if (personalSchedules.length > 0) {
        const { error: insertError } = await supabase
          .from('personal_schedules')
          .insert(personalSchedules);

        if (insertError) {
          console.error(
            '[deletePostAction] Failed to migrate schedules',
            JSON.stringify(insertError)
          );
          return {
            ok: false,
            message: '스케줄 이전에 실패했습니다. 다시 시도해주세요.',
          };
        }
      }

      // 거절되지 않은 모든 지원자(승인 + 대기)에게 알림
      const allApplicantIds = Array.from(
        new Set(
          schedules
            .map((s) => s.member_id)
            .filter(Boolean),
        ),
      );
      const postTitle = (() => {
        const first = schedules[0];
        const p = Array.isArray(first?.posts) ? first?.posts[0] : first?.posts;
        return p?.title || '삭제된 공고';
      })();
      if (allApplicantIds.length > 0) {
        await createBulkNotificationsAction(
          allApplicantIds.map((userId) => ({
            userId,
            type: 'system',
            title: '공고가 삭제되었습니다',
            message: `"${postTitle}" 공고가 삭제되어 더 이상 확인할 수 없습니다.`,
            link: '/worker/schedule',
          })),
        );
      }
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('post_id', postId)
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

    // 데이터 변환: post_id → id, work_slots 형식 변환, 상태 자동 업데이트
    const transformedData = await Promise.all(
      (data || []).map(async (post: Record<string, unknown>) => {
        // 과거 포스트인지 확인하고 상태 업데이트
        if (isPostPast(post) && post.status !== 'completed') {
          const postId = post.post_id as number | string;
          if (postId !== undefined && postId !== null) {
            await updatePostStatusIfPast(supabase, postId);
            post.status = 'completed';
          }
        }

        const transformed = { ...post };

        // post_id를 id로 변환
        if (post.post_id !== undefined && post.post_id !== null) {
          transformed.id = post.post_id.toString();
        }

        // 지원자 통계 가져오기
        const postId = post.post_id as number;
        const { data: applicantStats } = await supabase
          .from('member_schedules')
          .select('status')
          .eq('post_id', postId);

        // 상태별 지원자 수 계산
        const totalApplicants = applicantStats?.length || 0;
        const pendingCount = applicantStats?.filter((a) => a.status === 'pending').length || 0;
        const acceptedCount = applicantStats?.filter((a) => a.status === 'accepted').length || 0;
        const rejectedCount = applicantStats?.filter((a) => a.status === 'rejected').length || 0;

        transformed.applicant_stats = {
          total: totalApplicants,
          pending: pendingCount,
          accepted: acceptedCount,
          rejected: rejectedCount,
        };

        // work_slots → WorkPart[] 형식으로 변환
        if (post.work_slots && Array.isArray(post.work_slots) && (post.work_slots as Array<unknown>).length > 0) {
          const slots = post.work_slots as Array<Record<string, unknown>>;
          const firstSlot = slots[0];

          if (firstSlot && 'shifts' in firstSlot) {
            // v3: 이미 WorkPart 형식
            transformed.work_slots = slots;
          } else {
            // v2/v1: 날짜 중심 → WorkPart 변환
            const converted: Array<Record<string, unknown>> = [];
            for (const slot of slots) {
              const parts = slot.parts as Array<Record<string, unknown>> | undefined;
              if (parts && parts.length > 0) {
                // v2: 각 파트 → WorkPart
                for (const part of parts) {
                  converted.push({
                    name: (part.name as string) || (part.label as string) || '파트',
                    location: (slot.location as string) || (post.location as string) || '',
                    pay_type: slot.pay_type || post.pay_type || 'hourly',
                    pay_amount: (slot.pay_amount as number) || Number(post.pay_amount) || 0,
                    recruit_count: (part.recruit_count as number) || 1,
                    tax_withholding: slot.tax_withholding !== undefined ? slot.tax_withholding : (post.tax_withholding || false),
                    meal_included: slot.meal_included || false,
                    meal_amount: slot.meal_amount || 0,
                    shifts: [{ date: slot.date as string, start: part.start as string, end: part.end as string }],
                  });
                }
              } else {
                // v1: 슬롯 → WorkPart
                converted.push({
                  name: '근무',
                  location: (slot.location as string) || (post.location as string) || '',
                  pay_type: slot.pay_type || post.pay_type || 'hourly',
                  pay_amount: (slot.pay_amount as number) || Number(post.pay_amount) || 0,
                  recruit_count: 1,
                  tax_withholding: slot.tax_withholding !== undefined ? slot.tax_withholding : (post.tax_withholding || false),
                  meal_included: slot.meal_included || false,
                  meal_amount: slot.meal_amount || 0,
                  shifts: [{
                    date: slot.date as string,
                    start: ((slot.start_time || slot.start) as string) || '',
                    end: ((slot.end_time || slot.end) as string) || '',
                  }],
                });
              }
            }
            transformed.work_slots = converted;
          }
        } else {
          // work_slots가 없으면 테이블 레벨 데이터로 생성
          transformed.work_slots = [{
            name: '근무',
            location: post.location || '',
            pay_type: post.pay_type || 'hourly',
            pay_amount: Number(post.pay_amount) || 0,
            recruit_count: 1,
            tax_withholding: post.tax_withholding || false,
            meal_included: false,
            meal_amount: 0,
            shifts: [{
              date: (post.work_date as string) || '',
              start: (post.work_time_start as string) || '',
              end: (post.work_time_end as string) || '',
            }],
          }];
        }

        return transformed;
      })
    );

    return { ok: true, message: '', data: transformedData };
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
      .eq('post_id', postId)
      .single();

    if (error) {
      console.error('[getPostByIdAction] Supabase select error', error);
      return {
        ok: false,
        message: '공고를 불러오는데 실패했습니다.',
        data: null,
      };
    }

    if (!data) {
      return {
        ok: false,
        message: '공고를 찾을 수 없습니다.',
        data: null,
      };
    }

    // 과거 포스트인지 확인하고 상태 업데이트
    if (isPostPast(data) && data.status !== 'completed') {
      await updatePostStatusIfPast(supabase, postId);
      data.status = 'completed';
    }

    return { ok: true, message: '', data };
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
