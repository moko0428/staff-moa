'use server';

import { createClient } from '@/utils/supabase/server';

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

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
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
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

    // work_slots 기반으로 스케줄 상태 계산
    const now = new Date();
    const schedulesWithStatus = (posts || []).map((post) => {
      const workSlots = post.work_slots as Array<{
        date: string;
        start_time: string;
        end_time: string;
      }>;

      let scheduleStatus: 'upcoming' | 'ongoing' | 'completed' = 'completed';

      if (workSlots && workSlots.length > 0) {
        const dates = workSlots.map((slot) => new Date(slot.date));
        const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

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
    const workSlots = post.work_slots as Array<{
      date: string;
      start_time: string;
      end_time: string;
    }>;

    let scheduleStatus: 'upcoming' | 'ongoing' | 'completed' = 'completed';

    if (workSlots && workSlots.length > 0) {
      const now = new Date();
      const dates = workSlots.map((slot) => new Date(slot.date));
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

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
