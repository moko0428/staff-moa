'use server';

import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { createClient } from '@/utils/supabase/server';
import { PENALTY_TYPES } from './constants';
import type { PenaltyItem } from './constants';

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

/**
 * 근태 점수 계산 (0~100)
 * = 참여점수(0~50) + 태도점수(0~50)
 *
 * 참여점수: 최근 180일 내 승인된 스케줄의 근무일 수 / 180 × 50
 * 태도점수: 매니저 평가 평균(20~100) / 100 × 50
 */
async function calculateAttendanceScore(
  supabase: Awaited<ReturnType<typeof createClient>>,
  memberId: string
): Promise<number> {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 180);
  const cutoffStr = cutoff.toISOString().split('T')[0]; // yyyy-MM-dd

  // 참여점수 + 태도점수 병렬 조회
  const [schedulesResult, reviewsResult] = await Promise.all([
    supabase
      .from('member_schedules')
      .select('post_id, posts (work_slots, work_date)')
      .eq('member_id', memberId)
      .eq('status', 'accepted'),
    supabase
      .from('attendance_reviews')
      .select('score, penalty_items')
      .eq('member_id', memberId),
  ]);

  // 1. 참여점수: 180일 내 승인된 스케줄의 work_slots 근무일 수
  const schedules = schedulesResult.data;
  const workDays = new Set<string>();
  if (schedules) {
    for (const s of schedules) {
      const post = Array.isArray(s.posts) ? s.posts[0] : s.posts;
      if (!post) continue;

      const rawSlots = post.work_slots;
      if (rawSlots && Array.isArray(rawSlots)) {
        for (const item of rawSlots) {
          if (typeof item !== 'object' || item === null) continue;
          const part = item as { shifts?: Array<{ date: string; date_end?: string }>; date?: string };
          if (Array.isArray(part.shifts)) {
            // v3 WorkPart format
            for (const shift of part.shifts) {
              if (shift.date_end && shift.date_end > shift.date) {
                // 기간 근무: date ~ date_end 범위 내 모든 날짜 enumerate
                const days = eachDayOfInterval({
                  start: parseISO(shift.date),
                  end: parseISO(shift.date_end),
                });
                for (const d of days) {
                  const ds = format(d, 'yyyy-MM-dd');
                  if (ds >= cutoffStr) workDays.add(ds);
                }
              } else if (shift.date >= cutoffStr) {
                workDays.add(shift.date);
              }
            }
          } else if (typeof part.date === 'string' && part.date >= cutoffStr) {
            // Legacy flat format
            workDays.add(part.date);
          }
        }
      } else if (post.work_date && post.work_date >= cutoffStr) {
        workDays.add(post.work_date);
      }
    }
  }

  const participationRate = Math.min(workDays.size / 180, 1);
  const participationScore = participationRate * 50;

  // 2. 태도점수: 매니저 평가 평균 (score: 20~100) → 0~50 환산
  const reviews = reviewsResult.data;

  let attitudeScore = 25; // 평가 없으면 중간값 (초기 50점의 절반)
  let totalPenalty = 0;
  if (reviews && reviews.length > 0) {
    const avgReviewScore =
      reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;
    attitudeScore = (avgReviewScore / 100) * 50;

    // 감점 합산
    for (const r of reviews) {
      const items = r.penalty_items as PenaltyItem[] | null;
      if (items && Array.isArray(items)) {
        totalPenalty += items.reduce((sum, item) => sum + item.deduction, 0);
      }
    }
  }

  return Math.max(0, Math.round(participationScore + attitudeScore - totalPenalty));
}

// Manager의 스케줄 조회 (본인이 작성한 posts)
export async function getManagerSchedulesAction(): Promise<
  ActionResult<Array<Record<string, unknown>>>
> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    // profiles에서 role 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'manager') {
      return { ok: false, message: '매니저만 접근할 수 있습니다.', data: [] };
    }

    // 본인이 작성한 공고들 조회 (스케줄로 사용)
    const SCHEDULE_FIELDS = [
      'post_id', 'author_id', 'title', 'description', 'status',
      'location', 'pay_amount', 'pay_type', 'work_date', 'work_time_start', 'work_time_end',
      'work_slots', 'recruit_count', 'manager_name', 'manager_contact_type', 'manager_phone',
      'equipments', 'qualifications', 'preferences', 'notes',
      'keywords', 'external_link', 'form_type', 'created_at', 'updated_at',
    ].join(', ');

    const { data: rawPosts, error } = await supabase
      .from('posts')
      .select(SCHEDULE_FIELDS)
      .eq('author_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getManagerSchedulesAction] Select error', error);
      return {
        ok: false,
        message: '스케줄을 불러오는데 실패했습니다.',
        data: [],
      };
    }

    const posts = (rawPosts || []) as unknown as Array<Record<string, unknown>>;

    // work_slots 기반으로 스케줄 상태 계산
    const now = new Date();
    const schedulesWithStatus = posts.map((post) => {
      const rawSlots = post.work_slots as Array<Record<string, unknown>> | null;
      const allShiftDates: Date[] = [];

      if (Array.isArray(rawSlots)) {
        for (const item of rawSlots) {
          if (typeof item !== 'object' || item === null) continue;
          const part = item as { shifts?: Array<{ date: string; date_end?: string }>; date?: string };
          if (Array.isArray(part.shifts)) {
            // v3 WorkPart format
            for (const shift of part.shifts) {
              if (shift.date) allShiftDates.push(new Date(shift.date));
              if (shift.date_end) allShiftDates.push(new Date(shift.date_end));
            }
          } else if (typeof part.date === 'string') {
            // Legacy flat format
            allShiftDates.push(new Date(part.date));
          }
        }
      }

      let scheduleStatus: 'upcoming' | 'ongoing' | 'completed' = 'completed';

      if (allShiftDates.length > 0) {
        const minDate = new Date(Math.min(...allShiftDates.map((d) => d.getTime())));
        const maxDate = new Date(Math.max(...allShiftDates.map((d) => d.getTime())));

        // 오늘 날짜 기준으로 상태 계산
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const minDateOnly = new Date(
          minDate.getFullYear(),
          minDate.getMonth(),
          minDate.getDate()
        );
        const maxDateOnly = new Date(
          maxDate.getFullYear(),
          maxDate.getMonth(),
          maxDate.getDate()
        );

        if (today < minDateOnly) {
          scheduleStatus = 'upcoming';
        } else if (today >= minDateOnly && today <= maxDateOnly) {
          scheduleStatus = 'ongoing';
        } else {
          scheduleStatus = 'completed';
        }
      }

      return {
        ...post,
        schedule_status: scheduleStatus,
      };
    });

    return { ok: true, message: '', data: schedulesWithStatus };
  } catch (err) {
    console.error('[getManagerSchedulesAction] Unexpected error', err);
    return {
      ok: false,
      message: '스케줄을 불러오는 중 오류가 발생했습니다.',
      data: [],
    };
  }
}

// 특정 공고의 스케줄 상세 정보 (지원자 포함)
export async function getScheduleDetailAction(
  postId: number
): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 공고 조회 및 작성자 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('post_id', postId)
      .single();

    if (postError || !post) {
      console.error('[getScheduleDetailAction] Post select error', postError);
      return { ok: false, message: '공고를 찾을 수 없습니다.' };
    }

    if (post.author_id !== userData.user.id) {
      return { ok: false, message: '권한이 없습니다.' };
    }

    // 해당 공고의 지원자 목록 조회
    const { data: applicants, error: applicantsError } = await supabase
      .from('member_schedules')
      .select(
        `
        member_schedule_id,
        member_id,
        status,
        message,
        created_at,
        profiles:member_id (
          user_id,
          name,
          email,
          phone,
          avatar,
          attendance_score
        )
      `
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (applicantsError) {
      console.error(
        '[getScheduleDetailAction] Applicants select error',
        applicantsError
      );
      // 지원자 조회 실패는 치명적이지 않으므로 빈 배열로 계속 진행
    }

    // 스케줄 상태 계산
    const rawSlots = post.work_slots as Array<Record<string, unknown>> | null;
    const allShiftDates: Date[] = [];

    if (Array.isArray(rawSlots)) {
      for (const item of rawSlots) {
        if (typeof item !== 'object' || item === null) continue;
        const part = item as { shifts?: Array<{ date: string; date_end?: string }>; date?: string };
        if (Array.isArray(part.shifts)) {
          // v3 WorkPart format
          for (const shift of part.shifts) {
            if (shift.date) allShiftDates.push(new Date(shift.date));
            if (shift.date_end) allShiftDates.push(new Date(shift.date_end));
          }
        } else if (typeof part.date === 'string') {
          // Legacy flat format
          allShiftDates.push(new Date(part.date));
        }
      }
    }

    let scheduleStatus: 'upcoming' | 'ongoing' | 'completed' = 'completed';

    if (allShiftDates.length > 0) {
      const now = new Date();
      const minDate = new Date(Math.min(...allShiftDates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...allShiftDates.map((d) => d.getTime())));

      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const minDateOnly = new Date(
        minDate.getFullYear(),
        minDate.getMonth(),
        minDate.getDate()
      );
      const maxDateOnly = new Date(
        maxDate.getFullYear(),
        maxDate.getMonth(),
        maxDate.getDate()
      );

      if (today < minDateOnly) {
        scheduleStatus = 'upcoming';
      } else if (today >= minDateOnly && today <= maxDateOnly) {
        scheduleStatus = 'ongoing';
      } else {
        scheduleStatus = 'completed';
      }
    }

    return {
      ok: true,
      message: '',
      data: {
        ...post,
        schedule_status: scheduleStatus,
        applicants: applicants || [],
        applicant_count: {
          total: applicants?.length || 0,
          pending: applicants?.filter((a) => a.status === 'pending').length || 0,
          accepted:
            applicants?.filter((a) => a.status === 'accepted').length || 0,
          rejected:
            applicants?.filter((a) => a.status === 'rejected').length || 0,
        },
      },
    };
  } catch (err) {
    console.error('[getScheduleDetailAction] Unexpected error', err);
    return {
      ok: false,
      message: '스케줄 상세 정보를 불러오는 중 오류가 발생했습니다.',
    };
  }
}

// 근태 평가 저장 (upsert)
export async function submitAttendanceReviewAction(
  postId: number,
  memberId: string,
  score: number,
  comment: string,
  penaltyItems: PenaltyItem[] = []
): Promise<ActionResult<{ reviewId: string }>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 매니저 확인 및 공고 소유 확인
    const [{ data: profile }, { data: post }] = await Promise.all([
      supabase.from('profiles').select('role').eq('user_id', userData.user.id).single(),
      supabase.from('posts').select('author_id').eq('post_id', postId).single(),
    ]);

    if (profile?.role !== 'manager') {
      return { ok: false, message: '매니저만 근태 평가를 작성할 수 있습니다.' };
    }
    if (post?.author_id !== userData.user.id) {
      return { ok: false, message: '본인의 공고에 대한 평가만 작성할 수 있습니다.' };
    }

    if (![20, 40, 60, 80, 100].includes(score)) {
      return { ok: false, message: '올바르지 않은 점수입니다.' };
    }

    // 감점 항목 유효성 검증
    for (const item of penaltyItems) {
      const penaltyType = PENALTY_TYPES[item.reason];
      if (!penaltyType) {
        return { ok: false, message: `올바르지 않은 감점 항목입니다: ${item.reason}` };
      }
      if (item.deduction < penaltyType.min || item.deduction > penaltyType.max) {
        return { ok: false, message: `${item.reason}의 감점 범위는 ${penaltyType.min}~${penaltyType.max}입니다.` };
      }
    }

    // upsert: (post_id, member_id) 기준
    const { data: upsertedReview, error: upsertError } = await supabase
      .from('attendance_reviews')
      .upsert(
        {
          post_id: postId,
          member_id: memberId,
          reviewed_by: userData.user.id,
          score,
          comment,
          penalty_items: penaltyItems,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'post_id,member_id' }
      )
      .select('review_id')
      .single();

    if (upsertError || !upsertedReview) {
      console.error('[submitAttendanceReviewAction] Upsert error', upsertError);
      return { ok: false, message: '평가 저장에 실패했습니다.' };
    }

    // 워커의 attendance_score 재계산 (참여점수 + 태도점수)
    const newScore = await calculateAttendanceScore(supabase, memberId);
    await supabase
      .from('profiles')
      .update({ attendance_score: newScore })
      .eq('user_id', memberId);

    return {
      ok: true,
      message: '평가가 저장되었습니다.',
      data: { reviewId: upsertedReview.review_id },
    };
  } catch (err) {
    console.error('[submitAttendanceReviewAction] Unexpected error', err);
    return { ok: false, message: '평가 저장 중 오류가 발생했습니다.' };
  }
}

// 특정 공고의 모든 근태 평가 조회
export async function getReviewsByPostAction(
  postId: number
): Promise<ActionResult<Array<{
  review_id: string;
  member_id: string;
  score: number;
  comment: string;
  penalty_items: PenaltyItem[] | null;
  updated_at: string;
}>>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('post_id', postId)
      .single();

    if (post?.author_id !== userData.user.id) {
      return { ok: false, message: '권한이 없습니다.', data: [] };
    }

    const { data, error } = await supabase
      .from('attendance_reviews')
      .select('review_id, member_id, score, comment, penalty_items, updated_at')
      .eq('post_id', postId);

    if (error) {
      return { ok: false, message: '평가 목록을 불러오는데 실패했습니다.', data: [] };
    }

    return { ok: true, message: '', data: data || [] };
  } catch (err) {
    console.error('[getReviewsByPostAction] Unexpected error', err);
    return { ok: false, message: '오류가 발생했습니다.', data: [] };
  }
}

// 스케줄 상태별 필터링
export async function getManagerSchedulesByStatusAction(
  status: 'upcoming' | 'ongoing' | 'completed' | 'all'
): Promise<ActionResult<Array<Record<string, unknown>>>> {
  try {
    const result = await getManagerSchedulesAction();

    if (!result.ok || !result.data) {
      return result;
    }

    if (status === 'all') {
      return result;
    }

    const filtered = result.data.filter(
      (schedule) => schedule.schedule_status === status
    );

    return { ok: true, message: '', data: filtered };
  } catch (err) {
    console.error('[getManagerSchedulesByStatusAction] Unexpected error', err);
    return {
      ok: false,
      message: '스케줄을 필터링하는 중 오류가 발생했습니다.',
      data: [],
    };
  }
}
