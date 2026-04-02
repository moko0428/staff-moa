'use server';

import { createClient } from '@/utils/supabase/server';
import { createNotificationAction } from '@/app/(protected)/notification/actions';

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

// 실제 데이터베이스 스키마 타입 (Drizzle 기반)
type PostData = {
  post_id: number;
  author_id: string;
  title: string;
  description: string;
  work_date: string;
  work_time_start: string;
  work_time_end: string;
  location: string;
  pay_amount: number;
  pay_type: string;
  recruit_count: number;
  manager_name: string;
  manager_phone: string;
  equipments: string | null;
  qualifications: string | null;
  preferences: string | null;
  notes: string | null;
  external_link: string | null;
  keywords: string[] | null;
  status: 'recruiting' | 'completed' | 'urgent';
  work_slots: unknown;
  form_type: string | null;
  created_at: string;
  updated_at: string;
};

// member_schedules JOIN 결과 타입
type MemberScheduleWithPostRaw = {
  member_schedule_id: string;
  post_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  created_at: string;
  updated_at?: string;
  posts: PostData[] | PostData | null;
};

// 정규화된 타입 (posts를 단일 객체로)
type MemberScheduleWithPost = {
  member_schedule_id: string;
  post_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  created_at: string;
  updated_at: string;
  posts: PostData | null;
};

// Experience 아이템 타입 (profiles.experiences JSONB 필드)
type ExperienceItem = {
  id?: string;
  title?: string;
  company?: string;
  position?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  description?: string;
  source?: string;
  postId?: number;
};

// work_slots 타입
type WorkSlot = {
  date: string;
  start_time?: string;
  end_time?: string;
  start?: string;
  end?: string;
  pay_amount?: number;
};

// Supabase 응답 정규화 헬퍼 함수
function normalizeScheduleData(
  raw: MemberScheduleWithPostRaw
): MemberScheduleWithPost {
  return {
    member_schedule_id: raw.member_schedule_id,
    post_id: raw.post_id,
    status: raw.status,
    message: raw.message,
    created_at: raw.created_at,
    updated_at: raw.updated_at || raw.created_at,
    posts: Array.isArray(raw.posts) ? raw.posts[0] || null : raw.posts,
  };
}

// Member가 공고에 지원
export async function applyToPostAction(
  postId: number,
  message?: string,
  selectedPart?: string,
  selectedSlotIndex?: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // profiles에서 role, name 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'member') {
      return { ok: false, message: '스탭만 공고에 지원할 수 있습니다.' };
    }

    // 이미 지원했는지 확인
    const { data: existing } = await supabase
      .from('member_schedules')
      .select('member_schedule_id')
      .eq('post_id', postId)
      .eq('member_id', userData.user.id)
      .single();

    if (existing) {
      return { ok: false, message: '이미 지원한 공고입니다.' };
    }

    // 공고 정보 조회 (매니저 알림용)
    const { data: post } = await supabase
      .from('posts')
      .select('author_id, title')
      .eq('post_id', postId)
      .single();

    // 지원 등록
    const { error } = await supabase.from('member_schedules').insert({
      post_id: postId,
      member_id: userData.user.id,
      status: 'pending',
      message: message || null,
      selected_part: selectedPart || null,
      selected_slot_index: selectedSlotIndex ?? null,
    });

    if (error) {
      console.error('[applyToPostAction] Insert error', error);
      return { ok: false, message: '지원 등록에 실패했습니다.' };
    }

    // 매니저에게 알림 발송 (fire-and-forget)
    if (post?.author_id) {
      const memberName = profile?.name || '스탭';
      createNotificationAction({
        userId: post.author_id,
        type: 'new_application',
        title: '새 지원자가 있습니다',
        message: `${memberName}님이 '${post.title}' 공고에 지원하였습니다. 지금 바로 확인해보세요.`,
        link: '/manager/worker',
      }).catch((err) => console.error('[applyToPostAction] Notification error', err));
    }

    return { ok: true, message: '지원이 완료되었습니다.' };
  } catch (err) {
    console.error('[applyToPostAction] Unexpected error', err);
    return { ok: false, message: '지원 중 오류가 발생했습니다.' };
  }
}

// Member가 해당 공고에 이미 지원했는지 확인
export async function checkAppliedToPostAction(
  postId: number
): Promise<ActionResult<{ applied: boolean }>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: { applied: false } };
    }

    const { data } = await supabase
      .from('member_schedules')
      .select('member_schedule_id')
      .eq('post_id', postId)
      .eq('member_id', userData.user.id)
      .maybeSingle();

    return { ok: true, message: '', data: { applied: !!data } };
  } catch (err) {
    console.error('[checkAppliedToPostAction] Unexpected error', err);
    return {
      ok: false,
      message: '지원 여부를 확인하는 중 오류가 발생했습니다.',
      data: { applied: false },
    };
  }
}

// Member의 모든 스케줄 조회 (지원한 공고들)
export async function getMySchedulesAction(): Promise<
  ActionResult<MemberScheduleWithPost[]>
> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    // member_schedules와 posts JOIN
    const { data: schedules, error } = await supabase
      .from('member_schedules')
      .select(
        `
        member_schedule_id,
        post_id,
        status,
        message,
        created_at,
        updated_at,
        posts (
          post_id,
          title,
          description,
          work_date,
          work_time_start,
          work_time_end,
          location,
          pay_amount,
          pay_type,
          recruit_count,
          manager_name,
          manager_phone,
          equipments,
          qualifications,
          preferences,
          notes,
          external_link,
          keywords,
          status,
          work_slots,
          created_at,
          updated_at
        )
      `
      )
      .eq('member_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getMySchedulesAction] Select error', error);
      return {
        ok: false,
        message: '스케줄을 불러오는데 실패했습니다.',
        data: [],
      };
    }

    // Supabase 응답을 정규화
    const normalizedSchedules = (
      (schedules as unknown as MemberScheduleWithPostRaw[]) || []
    ).map(normalizeScheduleData);

    return { ok: true, message: '', data: normalizedSchedules };
  } catch (err) {
    console.error('[getMySchedulesAction] Unexpected error', err);
    return {
      ok: false,
      message: '스케줄을 불러오는 중 오류가 발생했습니다.',
      data: [],
    };
  }
}

// Member의 승인된(accepted) 스케줄만 조회
export async function getAcceptedSchedulesAction(): Promise<
  ActionResult<MemberScheduleWithPost[]>
> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    // accepted 상태만 조회
    const { data: schedules, error } = await supabase
      .from('member_schedules')
      .select(
        `
        member_schedule_id,
        post_id,
        status,
        created_at,
        posts (
          post_id,
          title,
          description,
          work_date,
          work_time_start,
          work_time_end,
          location,
          pay_amount,
          pay_type,
          manager_name,
          work_slots,
          created_at,
          updated_at
        )
      `
      )
      .eq('member_id', userData.user.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getAcceptedSchedulesAction] Select error', error);
      return {
        ok: false,
        message: '승인된 스케줄을 불러오는데 실패했습니다.',
        data: [],
      };
    }

    // Supabase 응답을 정규화
    const normalizedSchedules = (
      (schedules as unknown as MemberScheduleWithPostRaw[]) || []
    ).map(normalizeScheduleData);

    return { ok: true, message: '', data: normalizedSchedules };
  } catch (err) {
    console.error('[getAcceptedSchedulesAction] Unexpected error', err);
    return {
      ok: false,
      message: '승인된 스케줄을 불러오는 중 오류가 발생했습니다.',
      data: [],
    };
  }
}

// 경력 불러오기 - 승인된 스케줄 + 개인 스케줄을 profiles.experiences에 추가
export async function importExperiencesAction(): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 1. 승인된 스케줄 + 개인 스케줄 동시 조회
    const [acceptedResult, personalResult] = await Promise.all([
      getAcceptedSchedulesAction(),
      getPersonalSchedulesAction(),
    ]);

    // 2. 현재 experiences 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('experiences')
      .eq('user_id', userData.user.id)
      .single();

    const rawExperiences = profile?.experiences;
    const existingExperiences: ExperienceItem[] = Array.isArray(rawExperiences)
      ? rawExperiences.filter(
          (item): item is ExperienceItem =>
            typeof item === 'object' && item !== null
        )
      : [];

    // 중복 방지용 기존 ID 세트
    const existingIds = new Set(
      existingExperiences
        .filter((exp) => exp.id)
        .map((exp) => exp.id as string)
    );

    const newExperiences: ExperienceItem[] = [];

    // 3. 승인된 공고 스케줄 → 경력 변환
    if (acceptedResult.ok && acceptedResult.data) {
      for (const schedule of acceptedResult.data) {
        const post = schedule.posts;
        if (!post) continue;

        const expId = `imported-${post.post_id}`;
        if (existingIds.has(expId)) continue;

        const rawWorkSlots = post.work_slots;
        const workSlots: WorkSlot[] = Array.isArray(rawWorkSlots)
          ? rawWorkSlots.filter(
              (item): item is WorkSlot =>
                typeof item === 'object' &&
                item !== null &&
                typeof (item as WorkSlot).date === 'string'
            )
          : [];

        const dates =
          workSlots.length > 0
            ? workSlots
                .map((slot) => slot.date)
                .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
            : [];
        const startDate = dates[0] || post.work_date;
        const endDate = dates[dates.length - 1] || post.work_date;

        // 날짜 표시 문자열
        const dateStr =
          startDate === endDate ? startDate : `${startDate} ~ ${endDate}`;

        newExperiences.push({
          id: expId,
          title: post.title,
          date: dateStr,
          location: post.location || '',
          source: 'imported',
          postId: post.post_id,
        });
      }
    }

    // 4. 개인 스케줄 → 경력 변환
    if (personalResult.ok && personalResult.data) {
      for (const ps of personalResult.data) {
        const psId = `personal-${ps.personal_schedule_id as string}`;
        if (existingIds.has(psId)) continue;

        newExperiences.push({
          id: psId,
          title: (ps.title as string) || '개인 일정',
          date: ps.date as string,
          location: (ps.location as string) || '',
          source: 'personal',
        });
      }
    }

    if (newExperiences.length === 0) {
      const hasAny =
        (acceptedResult.data?.length ?? 0) +
        (personalResult.data?.length ?? 0);
      return {
        ok: false,
        message:
          hasAny > 0
            ? '이미 모든 경력을 불러왔습니다.'
            : '불러올 경력이 없습니다.',
      };
    }

    // 5. experiences 업데이트
    const updatedExperiences = [...existingExperiences, ...newExperiences];

    const { error } = await supabase
      .from('profiles')
      .update({ experiences: updatedExperiences })
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('[importExperiencesAction] Update error', error);
      return { ok: false, message: '경력 불러오기에 실패했습니다.' };
    }

    return {
      ok: true,
      message: `${newExperiences.length}개의 경력을 불러왔습니다.`,
    };
  } catch (err) {
    console.error('[importExperiencesAction] Unexpected error', err);
    return { ok: false, message: '경력 불러오기 중 오류가 발생했습니다.' };
  }
}

// 개인 스케줄 추가
export async function createPersonalScheduleAction(scheduleData: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  payType: 'hourly' | 'daily' | 'weekly' | 'monthly';
  payAmount?: string;
  description?: string;
  managerName?: string;
  managerContactType?: 'phone' | 'kakao' | 'email' | 'other';
  managerPhone?: string;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // profiles에서 role 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'member') {
      return { ok: false, message: '스탭만 개인 스케줄을 추가할 수 있습니다.' };
    }

    // personal_schedules 테이블에 저장
    const { error } = await supabase.from('personal_schedules').insert({
      user_id: userData.user.id,
      title: scheduleData.title,
      date: scheduleData.date,
      start_time: scheduleData.startTime,
      end_time: scheduleData.endTime,
      location: scheduleData.location || null,
      pay_type: scheduleData.payType,
      pay_amount: scheduleData.payAmount ? parseInt(scheduleData.payAmount) : null,
      description: scheduleData.description || null,
      manager_name: scheduleData.managerName || null,
      manager_contact_type: scheduleData.managerContactType || 'phone',
      manager_phone: scheduleData.managerPhone || null,
    });

    if (error) {
      console.error('[createPersonalScheduleAction] Insert error', error);
      return { ok: false, message: '개인 스케줄 추가에 실패했습니다.' };
    }

    return { ok: true, message: '개인 스케줄이 추가되었습니다.' };
  } catch (err) {
    console.error('[createPersonalScheduleAction] Unexpected error', err);
    return { ok: false, message: '개인 스케줄 추가 중 오류가 발생했습니다.' };
  }
}

// 여러 날짜의 개인 스케줄 일괄 추가
export async function createPersonalSchedulesBulkAction(schedules: Array<{
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  payType: 'hourly' | 'daily' | 'weekly' | 'monthly';
  payAmount?: string;
  description?: string;
  managerName?: string;
  managerContactType?: 'phone' | 'kakao' | 'email' | 'other';
  managerPhone?: string;
}>): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'member') {
      return { ok: false, message: '스탭만 개인 스케줄을 추가할 수 있습니다.' };
    }

    if (schedules.length === 0) {
      return { ok: false, message: '추가할 스케줄이 없습니다.' };
    }

    const rows = schedules.map((s) => ({
      user_id: userData.user!.id,
      title: s.title,
      date: s.date,
      start_time: s.startTime,
      end_time: s.endTime,
      location: s.location || null,
      pay_type: s.payType,
      pay_amount: s.payAmount ? parseInt(s.payAmount) : null,
      description: s.description || null,
      manager_name: s.managerName || null,
      manager_contact_type: s.managerContactType || 'phone',
      manager_phone: s.managerPhone || null,
    }));

    const { error } = await supabase.from('personal_schedules').insert(rows);

    if (error) {
      console.error('[createPersonalSchedulesBulkAction] Insert error', error);
      return { ok: false, message: '개인 스케줄 추가에 실패했습니다.' };
    }

    return { ok: true, message: `${schedules.length}개의 개인 스케줄이 추가되었습니다.` };
  } catch (err) {
    console.error('[createPersonalSchedulesBulkAction] Unexpected error', err);
    return { ok: false, message: '개인 스케줄 추가 중 오류가 발생했습니다.' };
  }
}

// 개인 스케줄 조회
export async function getPersonalSchedulesAction(): Promise<
  ActionResult<Array<Record<string, unknown>>>
> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    const { data, error } = await supabase
      .from('personal_schedules')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('date', { ascending: true });

    if (error) {
      console.error('[getPersonalSchedulesAction] Select error', error);
      return {
        ok: false,
        message: '개인 스케줄을 불러오는데 실패했습니다.',
        data: [],
      };
    }

    return { ok: true, message: '', data: data || [] };
  } catch (err) {
    console.error('[getPersonalSchedulesAction] Unexpected error', err);
    return {
      ok: false,
      message: '개인 스케줄을 불러오는 중 오류가 발생했습니다.',
      data: [],
    };
  }
}

// 개인 스케줄 수정
export async function updatePersonalScheduleAction(
  scheduleId: string,
  scheduleData: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location?: string;
    payType: 'hourly' | 'daily' | 'weekly' | 'monthly';
    payAmount?: string;
    description?: string;
    managerName?: string;
    managerContactType?: 'phone' | 'kakao' | 'email' | 'other';
    managerPhone?: string;
  }
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 본인의 스케줄인지 확인
    const { data: existing } = await supabase
      .from('personal_schedules')
      .select('user_id')
      .eq('personal_schedule_id', scheduleId)
      .single();

    if (!existing) {
      return { ok: false, message: '스케줄을 찾을 수 없습니다.' };
    }

    if (existing.user_id !== userData.user.id) {
      return { ok: false, message: '본인의 스케줄만 수정할 수 있습니다.' };
    }

    const { error } = await supabase
      .from('personal_schedules')
      .update({
        title: scheduleData.title,
        date: scheduleData.date,
        start_time: scheduleData.startTime,
        end_time: scheduleData.endTime,
        location: scheduleData.location || null,
        pay_type: scheduleData.payType,
        pay_amount: scheduleData.payAmount ? parseInt(scheduleData.payAmount) : null,
        description: scheduleData.description || null,
        manager_name: scheduleData.managerName || null,
        manager_contact_type: scheduleData.managerContactType || 'phone',
        manager_phone: scheduleData.managerPhone || null,
        updated_at: new Date().toISOString(),
      })
      .eq('personal_schedule_id', scheduleId);

    if (error) {
      console.error('[updatePersonalScheduleAction] Update error', error);
      return { ok: false, message: '스케줄 수정에 실패했습니다.' };
    }

    return { ok: true, message: '스케줄이 수정되었습니다.' };
  } catch (err) {
    console.error('[updatePersonalScheduleAction] Unexpected error', err);
    return { ok: false, message: '스케줄 수정 중 오류가 발생했습니다.' };
  }
}

// 개인 스케줄 삭제
export async function deletePersonalScheduleAction(
  scheduleId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 본인의 스케줄인지 확인
    const { data: existing } = await supabase
      .from('personal_schedules')
      .select('user_id')
      .eq('personal_schedule_id', scheduleId)
      .single();

    if (!existing) {
      return { ok: false, message: '스케줄을 찾을 수 없습니다.' };
    }

    if (existing.user_id !== userData.user.id) {
      return { ok: false, message: '본인의 스케줄만 삭제할 수 있습니다.' };
    }

    const { error } = await supabase
      .from('personal_schedules')
      .delete()
      .eq('personal_schedule_id', scheduleId);

    if (error) {
      console.error('[deletePersonalScheduleAction] Delete error', error);
      return { ok: false, message: '스케줄 삭제에 실패했습니다.' };
    }

    return { ok: true, message: '스케줄이 삭제되었습니다.' };
  } catch (err) {
    console.error('[deletePersonalScheduleAction] Unexpected error', err);
    return { ok: false, message: '스케줄 삭제 중 오류가 발생했습니다.' };
  }
}

// 지원 취소 (member_schedules에서 삭제)
export async function cancelApplicationAction(
  memberScheduleId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 본인의 지원인지 확인
    const { data: existing } = await supabase
      .from('member_schedules')
      .select('member_id')
      .eq('member_schedule_id', memberScheduleId)
      .single();

    if (!existing) {
      return { ok: false, message: '지원 내역을 찾을 수 없습니다.' };
    }

    if (existing.member_id !== userData.user.id) {
      return { ok: false, message: '본인의 지원만 취소할 수 있습니다.' };
    }

    const { error } = await supabase
      .from('member_schedules')
      .delete()
      .eq('member_schedule_id', memberScheduleId);

    if (error) {
      console.error('[cancelApplicationAction] Delete error', error);
      return { ok: false, message: '지원 취소에 실패했습니다.' };
    }

    return { ok: true, message: '지원이 취소되었습니다.' };
  } catch (err) {
    console.error('[cancelApplicationAction] Unexpected error', err);
    return { ok: false, message: '지원 취소 중 오류가 발생했습니다.' };
  }
}
