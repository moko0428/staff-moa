'use server';

import { createClient } from '@/utils/supabase/server';
import { generateDailyCode, generateCheckinCode } from '@/lib/arrivalCode';

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

export type MyEventMovementStatus = 'departing' | 'arrived' | 'checked_in' | 'checked_out';

export type MyEvent = {
  member_schedule_id: string;
  post_id: number;
  title: string;
  location: string | null;
  work_date: string | null;       // work_slots 기반 첫 날짜
  work_time_start: string | null;
  work_time_end: string | null;
  // 현장 관리 필드
  assigned_role: string | null;
  position_status: 'waiting' | 'assigned';
  movement_status: MyEventMovementStatus | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  arrived_at: string | null;
  // 스케줄 날짜 범위 (multi-slot)
  slot_dates: string[];
};

// ── 내 현장 목록 조회 ─────────────────────────────────────────────────

export async function getMyEventsAction(): Promise<ActionResult<MyEvent[]>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    // 승인된 스케줄 + 공고 정보 조회
    const { data: schedules, error } = await supabase
      .from('member_schedules')
      .select(
        `member_schedule_id, post_id,
         staff_status, assigned_role,
         movement_status, checked_in_at, checked_out_at, arrived_at,
         posts!inner(post_id, title, location, work_slots)`,
      )
      .eq('member_id', userData.user.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) {
      // movement_status 없는 환경 시도 (staff_status/assigned_role은 유지)
      const { data: partial, error: partialError } = await supabase
        .from('member_schedules')
        .select(
          `member_schedule_id, post_id,
           staff_status, assigned_role,
           checked_in_at, arrived_at,
           posts!inner(post_id, title, location, work_slots)`,
        )
        .eq('member_id', userData.user.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      const source = partialError ? null : partial;

      if (!source) {
        // 최후 폴백: 기본 컬럼만
        const { data: fallback, error: fallbackError } = await supabase
          .from('member_schedules')
          .select(
            `member_schedule_id, post_id,
             posts!inner(post_id, title, location, work_slots)`,
          )
          .eq('member_id', userData.user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        if (fallbackError || !fallback) {
          return { ok: false, message: '일정을 불러오는데 실패했습니다.', data: [] };
        }

        const events: MyEvent[] = fallback.map((s) => {
          const post = Array.isArray(s.posts) ? s.posts[0] : s.posts;
          const p = post as { post_id: number; title: string; location: string | null; work_slots: unknown } | null;
          const slots = (p?.work_slots as Array<{ date: string; start_time: string; end_time: string }>) ?? [];
          const sorted = [...slots].sort((a, b) => a.date.localeCompare(b.date));
          return {
            member_schedule_id: s.member_schedule_id,
            post_id: s.post_id,
            title: p?.title ?? '',
            location: p?.location ?? null,
            work_date: sorted[0]?.date ?? null,
            work_time_start: sorted[0]?.start_time ?? null,
            work_time_end: sorted[sorted.length - 1]?.end_time ?? null,
            assigned_role: null,
            position_status: 'waiting',
            movement_status: null,
            checked_in_at: null,
            checked_out_at: null,
            arrived_at: null,
            slot_dates: sorted.map((s) => s.date),
          };
        });

        return { ok: true, message: '', data: events };
      }

      const events: MyEvent[] = source.map((s) => {
        const row = s as Record<string, unknown>;
        const post = Array.isArray(s.posts) ? s.posts[0] : s.posts;
        const p = post as { post_id: number; title: string; location: string | null; work_slots: unknown } | null;
        const slots = (p?.work_slots as Array<{ date: string; start_time: string; end_time: string }>) ?? [];
        const sorted = [...slots].sort((a, b) => a.date.localeCompare(b.date));

        const rawStaffStatus = (row.staff_status as string) ?? 'waiting';
        const positionStatus: 'waiting' | 'assigned' = rawStaffStatus === 'assigned' ? 'assigned' : 'waiting';

        return {
          member_schedule_id: s.member_schedule_id,
          post_id: s.post_id,
          title: p?.title ?? '',
          location: p?.location ?? null,
          work_date: sorted[0]?.date ?? null,
          work_time_start: sorted[0]?.start_time ?? null,
          work_time_end: sorted[sorted.length - 1]?.end_time ?? null,
          assigned_role: (row.assigned_role as string) ?? null,
          position_status: positionStatus,
          movement_status: null,
          checked_in_at: (row.checked_in_at as string) ?? null,
          checked_out_at: null,
          arrived_at: (row.arrived_at as string) ?? null,
          slot_dates: sorted.map((s) => s.date),
        };
      });

      return { ok: true, message: '', data: events };
    }

    const events: MyEvent[] = (schedules ?? []).map((s) => {
      const row = s as Record<string, unknown>;
      const post = Array.isArray(s.posts) ? s.posts[0] : s.posts;
      const p = post as { post_id: number; title: string; location: string | null; work_slots: unknown } | null;
      const slots = (p?.work_slots as Array<{ date: string; start_time: string; end_time: string }>) ?? [];
      const sorted = [...slots].sort((a, b) => a.date.localeCompare(b.date));

      const rawStaffStatus = (row.staff_status as string) ?? 'waiting';
      const positionStatus: 'waiting' | 'assigned' = rawStaffStatus === 'assigned' ? 'assigned' : 'waiting';

      return {
        member_schedule_id: s.member_schedule_id,
        post_id: s.post_id,
        title: p?.title ?? '',
        location: p?.location ?? null,
        work_date: sorted[0]?.date ?? null,
        work_time_start: sorted[0]?.start_time ?? null,
        work_time_end: sorted[sorted.length - 1]?.end_time ?? null,
        assigned_role: (row.assigned_role as string) ?? null,
        position_status: positionStatus,
        movement_status: (row.movement_status as MyEventMovementStatus) ?? null,
        checked_in_at: (row.checked_in_at as string) ?? null,
        checked_out_at: (row.checked_out_at as string) ?? null,
        arrived_at: (row.arrived_at as string) ?? null,
        slot_dates: sorted.map((s) => s.date),
      };
    });

    return { ok: true, message: '', data: events };
  } catch (err) {
    console.error('[getMyEventsAction]', err);
    return { ok: false, message: '오류가 발생했습니다.', data: [] };
  }
}

// ── 이동 상태 자기 변경 (출발 / 도착만 허용) ─────────────────────────

export async function updateMyMovementAction(
  memberScheduleId: string,
  status: 'departing' | 'arrived',
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 본인 스케줄인지 확인
    const { data: schedule } = await supabase
      .from('member_schedules')
      .select('member_schedule_id, member_id')
      .eq('member_schedule_id', memberScheduleId)
      .eq('member_id', userData.user.id)
      .eq('status', 'accepted')
      .single();

    if (!schedule) {
      return { ok: false, message: '권한이 없습니다.' };
    }

    const now = new Date().toISOString();
    const update: Record<string, unknown> = { movement_status: status };
    if (status === 'arrived') update.arrived_at = now;

    const { error } = await supabase
      .from('member_schedules')
      .update(update)
      .eq('member_schedule_id', memberScheduleId);

    if (error) {
      console.error('[updateMyMovementAction]', error);
      return { ok: false, message: '상태 변경에 실패했습니다.' };
    }

    return { ok: true, message: '' };
  } catch (err) {
    console.error('[updateMyMovementAction]', err);
    return { ok: false, message: '오류가 발생했습니다.' };
  }
}

// ── 도착 인증 코드 검증 ────────────────────────────────────────────────

export async function verifyArrivalCodeAction(
  memberScheduleId: string,
  postId: number,
  inputCode: string,
): Promise<ActionResult<{ arrived_at: string }>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 본인 스케줄 확인
    const { data: schedule } = await supabase
      .from('member_schedules')
      .select('member_schedule_id, member_id')
      .eq('member_schedule_id', memberScheduleId)
      .eq('member_id', userData.user.id)
      .eq('status', 'accepted')
      .single();

    if (!schedule) {
      return { ok: false, message: '권한이 없습니다.' };
    }

    const expectedCode = generateDailyCode(postId);
    if (inputCode.trim() !== expectedCode) {
      return { ok: false, message: '인증 코드가 올바르지 않습니다.' };
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('member_schedules')
      .update({ movement_status: 'arrived', arrived_at: now })
      .eq('member_schedule_id', memberScheduleId);

    if (error) {
      console.error('[verifyArrivalCodeAction]', error);
      return { ok: false, message: '상태 변경에 실패했습니다.' };
    }

    return { ok: true, message: '도착이 확인됐습니다.', data: { arrived_at: now } };
  } catch (err) {
    console.error('[verifyArrivalCodeAction]', err);
    return { ok: false, message: '오류가 발생했습니다.' };
  }
}

// ── 체크인 코드 검증 (TTL 30분) ───────────────────────────────────────

export async function verifyCheckinCodeAction(
  memberScheduleId: string,
  postId: number,
  inputCode: string,
): Promise<ActionResult<{ checked_in_at: string }>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 본인 스케줄 확인
    const { data: schedule } = await supabase
      .from('member_schedules')
      .select('member_schedule_id, member_id')
      .eq('member_schedule_id', memberScheduleId)
      .eq('member_id', userData.user.id)
      .eq('status', 'accepted')
      .single();

    if (!schedule) {
      return { ok: false, message: '권한이 없습니다.' };
    }

    // 코드 검증 (30분 TTL)
    const expectedCode = generateCheckinCode(postId);
    if (inputCode.trim() !== expectedCode) {
      return { ok: false, message: '체크인 코드가 올바르지 않습니다.' };
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('member_schedules')
      .update({ movement_status: 'checked_in', checked_in_at: now })
      .eq('member_schedule_id', memberScheduleId);

    if (error) {
      console.error('[verifyCheckinCodeAction]', error);
      return { ok: false, message: '체크인에 실패했습니다.' };
    }

    return { ok: true, message: '출근이 확인됐습니다.', data: { checked_in_at: now } };
  } catch (err) {
    console.error('[verifyCheckinCodeAction]', err);
    return { ok: false, message: '오류가 발생했습니다.' };
  }
}
