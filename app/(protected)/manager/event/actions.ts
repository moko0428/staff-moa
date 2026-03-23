'use server';

import { createClient } from '@/utils/supabase/server';
import { createBulkNotificationsAction } from '@/app/(protected)/notification/actions';

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

export type StaffPosition = 'waiting' | 'assigned';
export type MovementStatus = 'departing' | 'arrived' | 'checked_in' | 'checked_out';

// ── Types ──────────────────────────────────────────────────────────────

export type RosterParticipant = {
  member_schedule_id: string;
  member_id: string;
  name: string | null;
  phone: string | null;
  kakao_id: string | null;
  attendance_score: number | null;
  avatar: string | null;
  // 현장 관리 필드
  position_status: StaffPosition;
  assigned_role: string | null;
  checkin_status: 'not_checked' | 'checked_in';
  movement_status: MovementStatus | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  arrived_at: string | null;
  manager_memo: string | null;
};

export type ManualStaffRecord = {
  id: string;
  name: string;
  phone: string | null;
  position: string;
  positionState: StaffPosition;
  movementStatus: MovementStatus | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  arrivedAt: string | null;
  memo: string;
};

export type PostRoster = {
  post_id: number;
  title: string;
  location: string | null;
  work_slots: Array<{
    date: string;
    start_time: string;
    end_time: string;
    pay_amount: number;
  }> | null;
  recruit_count: number | null;
  event_positions: string[];
  manual_staff: ManualStaffRecord[];
  participants: RosterParticipant[];
};

// ── Helpers ───────────────────────────────────────────────────────────

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function getManagerId(supabase: SupabaseClient): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userData.user.id)
    .single();

  if (profile?.role !== 'manager') return null;
  return userData.user.id;
}

async function verifyManagerOwnsSchedule(
  supabase: SupabaseClient,
  memberScheduleId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('member_schedules')
    .select('post_id, posts!inner(author_id)')
    .eq('member_schedule_id', memberScheduleId)
    .single();

  if (!data) return false;
  const post = Array.isArray(data.posts) ? data.posts[0] : data.posts;
  return (post as { author_id: string } | null)?.author_id === userId;
}

// ── Roster 조회 ───────────────────────────────────────────────────────

export async function getEventRosterAction(): Promise<ActionResult<PostRoster[]>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'manager') {
      return { ok: false, message: '매니저만 접근할 수 있습니다.', data: [] };
    }

    // ── 공고 조회 (신규 컬럼 없어도 폴백) ───────────────────────────
    let postsData: Array<{
      post_id: number;
      title: string;
      location: string | null;
      work_slots: unknown;
      recruit_count: number | null;
      event_positions?: unknown;
      manual_staff?: unknown;
    }> = [];

    const postsFullResult = await supabase
      .from('posts')
      .select('post_id, title, location, work_slots, recruit_count, event_positions, manual_staff')
      .eq('author_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (!postsFullResult.error) {
      postsData = postsFullResult.data ?? [];
    } else {
      // SQL 마이그레이션 전 폴백
      const postsBasicResult = await supabase
        .from('posts')
        .select('post_id, title, location, work_slots, recruit_count')
        .eq('author_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (postsBasicResult.error || !postsBasicResult.data) {
        return { ok: false, message: '공고를 불러오는데 실패했습니다.', data: [] };
      }
      postsData = postsBasicResult.data;
    }

    const posts = postsData;

    // ── 참가자 조회 (새 컬럼 없어도 폴백) ────────────────────────────
    const postIds = new Set(posts.map((p) => p.post_id));

    // 새 이벤트 컬럼 포함 시도
    const schedulesFullResult = await supabase
      .from('member_schedules')
      .select(
        `member_schedule_id, member_id, post_id,
         staff_status, assigned_role, checkin_status,
         movement_status, checked_in_at, checked_out_at, arrived_at, manager_memo,
         profiles:member_id (name, phone, kakao_id, attendance_score, avatar)`,
      )
      .eq('status', 'accepted');

    // 새 컬럼 없으면 기본 컬럼만 조회
    const schedulesBasicResult = schedulesFullResult.error
      ? await supabase
          .from('member_schedules')
          .select(
            `member_schedule_id, member_id, post_id,
             profiles:member_id (name, phone, kakao_id, attendance_score, avatar)`,
          )
          .eq('status', 'accepted')
      : null;

    const schedules = schedulesFullResult.error
      ? (schedulesBasicResult?.data ?? [])
      : (schedulesFullResult.data ?? []);
    const hasEventColumns = !schedulesFullResult.error;

    const participantsByPost: Record<number, RosterParticipant[]> = {};
    for (const s of schedules) {
      if (!postIds.has(s.post_id)) continue;
      const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
      if (!participantsByPost[s.post_id]) participantsByPost[s.post_id] = [];

      const row = s as Record<string, unknown>;
      // staff_status 'departing' 값은 마이그레이션 전 레거시 → 'waiting'으로 처리
      const rawStaffStatus = (row.staff_status as string) ?? 'waiting';
      const positionStatus: StaffPosition =
        rawStaffStatus === 'assigned' ? 'assigned' : 'waiting';
      participantsByPost[s.post_id].push({
        member_schedule_id: s.member_schedule_id,
        member_id: s.member_id,
        name: (p as { name?: string } | null)?.name ?? null,
        phone: (p as { phone?: string } | null)?.phone ?? null,
        kakao_id: (p as { kakao_id?: string } | null)?.kakao_id ?? null,
        attendance_score: (p as { attendance_score?: number } | null)?.attendance_score ?? null,
        avatar: (p as { avatar?: string } | null)?.avatar ?? null,
        position_status: hasEventColumns ? positionStatus : 'waiting',
        assigned_role: hasEventColumns ? ((row.assigned_role as string) ?? null) : null,
        checkin_status: hasEventColumns
          ? ((row.checkin_status as 'not_checked' | 'checked_in') ?? 'not_checked')
          : 'not_checked',
        movement_status: hasEventColumns ? ((row.movement_status as MovementStatus) ?? null) : null,
        checked_in_at: hasEventColumns ? ((row.checked_in_at as string) ?? null) : null,
        checked_out_at: hasEventColumns ? ((row.checked_out_at as string) ?? null) : null,
        arrived_at: hasEventColumns ? ((row.arrived_at as string) ?? null) : null,
        manager_memo: hasEventColumns ? ((row.manager_memo as string) ?? null) : null,
      });
    }

    const rosters: PostRoster[] = posts.map((post) => ({
      post_id: post.post_id,
      title: post.title,
      location: post.location ?? null,
      work_slots: post.work_slots as PostRoster['work_slots'],
      recruit_count: post.recruit_count ?? null,
      event_positions: (post.event_positions as string[]) ?? [],
      manual_staff: (post.manual_staff as ManualStaffRecord[]) ?? [],
      participants: participantsByPost[post.post_id] ?? [],
    }));

    return { ok: true, message: '', data: rosters };
  } catch (err) {
    console.error('[getEventRosterAction]', err);
    return { ok: false, message: '오류가 발생했습니다.', data: [] };
  }
}

// ── 수동 추가 스탭 저장 ────────────────────────────────────────────────

export async function saveManualStaffAction(
  postId: number,
  manualStaff: ManualStaffRecord[],
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const managerId = await getManagerId(supabase);
    if (!managerId) return { ok: false, message: '매니저 권한이 필요합니다.' };

    const { error } = await supabase
      .from('posts')
      .update({ manual_staff: manualStaff })
      .eq('post_id', postId)
      .eq('author_id', managerId);

    if (error) {
      console.error('[saveManualStaffAction]', error);
      return { ok: false, message: '수동 스탭 저장에 실패했습니다.' };
    }

    return { ok: true, message: '' };
  } catch (err) {
    console.error('[saveManualStaffAction]', err);
    return { ok: false, message: '오류가 발생했습니다.' };
  }
}

// ── 포지션 저장 ────────────────────────────────────────────────────────

export async function saveEventPositionsAction(
  postId: number,
  positions: string[],
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const managerId = await getManagerId(supabase);
    if (!managerId) return { ok: false, message: '매니저 권한이 필요합니다.' };

    const { error } = await supabase
      .from('posts')
      .update({ event_positions: positions })
      .eq('post_id', postId)
      .eq('author_id', managerId);

    if (error) {
      console.error('[saveEventPositionsAction]', error);
      return { ok: false, message: '포지션 저장에 실패했습니다.' };
    }

    return { ok: true, message: '포지션이 저장되었습니다.' };
  } catch (err) {
    console.error('[saveEventPositionsAction]', err);
    return { ok: false, message: '오류가 발생했습니다.' };
  }
}

// ── 포지션 상태 변경 (대기 ↔ 배치완료) ───────────────────────────────

export async function updatePositionStateAction(
  memberScheduleId: string,
  state: StaffPosition,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const managerId = await getManagerId(supabase);
    if (!managerId) return { ok: false, message: '매니저 권한이 필요합니다.' };

    const isOwner = await verifyManagerOwnsSchedule(supabase, memberScheduleId, managerId);
    if (!isOwner) return { ok: false, message: '권한이 없습니다.' };

    const { error } = await supabase
      .from('member_schedules')
      .update({ staff_status: state })
      .eq('member_schedule_id', memberScheduleId);

    if (error) {
      console.error('[updatePositionStateAction]', error);
      return { ok: false, message: '포지션 변경에 실패했습니다.' };
    }

    return { ok: true, message: '' };
  } catch (err) {
    console.error('[updatePositionStateAction]', err);
    return { ok: false, message: '오류가 발생했습니다.' };
  }
}

// ── 스탭 포지션 변경 ───────────────────────────────────────────────────

export async function updateStaffPositionAction(
  memberScheduleId: string,
  role: string,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const managerId = await getManagerId(supabase);
    if (!managerId) return { ok: false, message: '매니저 권한이 필요합니다.' };

    const isOwner = await verifyManagerOwnsSchedule(supabase, memberScheduleId, managerId);
    if (!isOwner) return { ok: false, message: '권한이 없습니다.' };

    const update: Record<string, unknown> = {
      assigned_role: role || null,
      staff_status: role ? 'assigned' : 'waiting',
    };

    const { error } = await supabase
      .from('member_schedules')
      .update(update)
      .eq('member_schedule_id', memberScheduleId);

    if (error) {
      console.error('[updateStaffPositionAction]', error);
      return { ok: false, message: '포지션 변경에 실패했습니다.' };
    }

    return { ok: true, message: '' };
  } catch (err) {
    console.error('[updateStaffPositionAction]', err);
    return { ok: false, message: '오류가 발생했습니다.' };
  }
}

// ── 이동 상태 변경 (출발/도착/출근/퇴근) ─────────────────────────────

export async function updateMovementStatusAction(
  memberScheduleId: string,
  status: MovementStatus,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const managerId = await getManagerId(supabase);
    if (!managerId) return { ok: false, message: '매니저 권한이 필요합니다.' };

    const isOwner = await verifyManagerOwnsSchedule(supabase, memberScheduleId, managerId);
    if (!isOwner) return { ok: false, message: '권한이 없습니다.' };

    const now = new Date().toISOString();
    const update: Record<string, unknown> = { movement_status: status };

    if (status === 'arrived') update.arrived_at = now;
    if (status === 'checked_in') {
      update.checked_in_at = now;
      update.checkin_status = 'checked_in'; // 레거시 호환
    }
    if (status === 'checked_out') update.checked_out_at = now;

    const { error } = await supabase
      .from('member_schedules')
      .update(update)
      .eq('member_schedule_id', memberScheduleId);

    if (error) {
      console.error('[updateMovementStatusAction]', error);
      return { ok: false, message: '상태 변경에 실패했습니다.' };
    }

    return { ok: true, message: '' };
  } catch (err) {
    console.error('[updateMovementStatusAction]', err);
    return { ok: false, message: '오류가 발생했습니다.' };
  }
}

// ── 출근 체크인 (레거시 - 워커 QR 스캔용) ────────────────────────────

export async function updateStaffCheckinAction(
  memberScheduleId: string,
): Promise<ActionResult> {
  return updateMovementStatusAction(memberScheduleId, 'checked_in');
}

// ── 메모 저장 ──────────────────────────────────────────────────────────

export async function updateStaffMemoAction(
  memberScheduleId: string,
  memo: string,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const managerId = await getManagerId(supabase);
    if (!managerId) return { ok: false, message: '매니저 권한이 필요합니다.' };

    const isOwner = await verifyManagerOwnsSchedule(supabase, memberScheduleId, managerId);
    if (!isOwner) return { ok: false, message: '권한이 없습니다.' };

    const { error } = await supabase
      .from('member_schedules')
      .update({ manager_memo: memo || null })
      .eq('member_schedule_id', memberScheduleId);

    if (error) {
      console.error('[updateStaffMemoAction]', error);
      return { ok: false, message: '메모 저장에 실패했습니다.' };
    }

    return { ok: true, message: '' };
  } catch (err) {
    console.error('[updateStaffMemoAction]', err);
    return { ok: false, message: '오류가 발생했습니다.' };
  }
}

// ── 현장 공지 발송 ─────────────────────────────────────────────────────

export async function sendEventBriefingAction(
  postId: number,
  title: string,
  message: string,
  targetMemberIds?: string[],
): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient();
    const managerId = await getManagerId(supabase);
    if (!managerId) return { ok: false, message: '매니저 권한이 필요합니다.', data: 0 };

    // 매니저 공고 소유 확인
    const { data: post } = await supabase
      .from('posts')
      .select('post_id, title')
      .eq('post_id', postId)
      .eq('author_id', managerId)
      .single();

    if (!post) return { ok: false, message: '권한이 없습니다.', data: 0 };

    let memberIds: string[];

    if (targetMemberIds && targetMemberIds.length > 0) {
      memberIds = targetMemberIds;
    } else {
      // 해당 공고의 승인된 참가자 전체
      const { data: schedules } = await supabase
        .from('member_schedules')
        .select('member_id')
        .eq('post_id', postId)
        .eq('status', 'accepted');

      if (!schedules || schedules.length === 0) {
        return { ok: false, message: '발송할 대상이 없습니다.', data: 0 };
      }
      memberIds = schedules.map((s) => s.member_id);
    }

    const notifications = memberIds.map((userId) => ({
      userId,
      type: 'event_briefing' as const,
      title,
      message,
      link: `/worker/schedule`,
    }));

    return await createBulkNotificationsAction(notifications);
  } catch (err) {
    console.error('[sendEventBriefingAction]', err);
    return { ok: false, message: '오류가 발생했습니다.', data: 0 };
  }
}

// ── 이전 액션 (목록/요약용) ──────────────────────────────────────────

export type RosterEvent = {
  post_id: number;
  title: string;
  location: string | null;
  work_slots: Array<{
    date: string;
    start_time: string;
    end_time: string;
    pay_amount: number;
  }> | null;
  recruit_count: number | null;
  status: string;
  schedule_status: 'upcoming' | 'ongoing' | 'completed';
  accepted_count: number;
  created_at: string;
};

export async function getRosterEventsAction(): Promise<ActionResult<RosterEvent[]>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'manager') {
      return { ok: false, message: '매니저만 접근할 수 있습니다.', data: [] };
    }

    const { data: posts, error } = await supabase
      .from('posts')
      .select('post_id, title, location, work_slots, recruit_count, status, created_at')
      .eq('author_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error || !posts) {
      return { ok: false, message: '공고를 불러오는데 실패했습니다.', data: [] };
    }

    if (posts.length === 0) {
      return { ok: true, message: '', data: [] };
    }

    const postIds = posts.map((p) => p.post_id);
    const { data: schedules } = await supabase
      .from('member_schedules')
      .select('post_id')
      .in('post_id', postIds)
      .eq('status', 'accepted');

    const acceptedCounts = (schedules ?? []).reduce(
      (acc, s) => {
        acc[s.post_id] = (acc[s.post_id] ?? 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    const now = new Date();
    const events: RosterEvent[] = posts.map((post) => {
      const workSlots = post.work_slots as RosterEvent['work_slots'];
      let schedule_status: 'upcoming' | 'ongoing' | 'completed' = 'completed';

      if (workSlots && workSlots.length > 0) {
        const dates = workSlots.map((s) => new Date(s.date));
        const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const minOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
        const maxOnly = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());

        if (today < minOnly) schedule_status = 'upcoming';
        else if (today <= maxOnly) schedule_status = 'ongoing';
      }

      return {
        post_id: post.post_id,
        title: post.title,
        location: post.location ?? null,
        work_slots: workSlots,
        recruit_count: post.recruit_count ?? null,
        status: post.status,
        created_at: post.created_at,
        schedule_status,
        accepted_count: acceptedCounts[post.post_id] ?? 0,
      };
    });

    return { ok: true, message: '', data: events };
  } catch (err) {
    console.error('[getRosterEventsAction]', err);
    return { ok: false, message: '오류가 발생했습니다.', data: [] };
  }
}
