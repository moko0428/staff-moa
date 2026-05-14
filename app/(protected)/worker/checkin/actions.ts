'use server';

import { createClient } from '@/utils/supabase/server';

type ActionResult = {
  ok: boolean;
  message: string;
};

export async function workerCheckinAction(postId: number): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 해당 공고에 승인된 스케줄 찾기
    const { data: schedule, error: scheduleError } = await supabase
      .from('member_schedules')
      .select('member_schedule_id, checkin_status')
      .eq('post_id', postId)
      .eq('member_id', userData.user.id)
      .eq('status', 'accepted')
      .single();

    if (scheduleError || !schedule) {
      return { ok: false, message: '참여 확정된 공고가 아닙니다.' };
    }

    if (schedule.checkin_status === 'checked_in') {
      return { ok: true, message: '이미 출근 처리되었습니다.' };
    }

    const { error: updateError } = await supabase
      .from('member_schedules')
      .update({
        checkin_status: 'checked_in',
        movement_status: 'checked_in',
        checked_in_at: new Date().toISOString(),
      })
      .eq('member_schedule_id', schedule.member_schedule_id);

    if (updateError) {
      console.error('[workerCheckinAction]', updateError);
      return { ok: false, message: '출근 처리에 실패했습니다.' };
    }

    return { ok: true, message: '출근이 확인되었습니다.' };
  } catch (err) {
    console.error('[workerCheckinAction]', err);
    return { ok: false, message: '오류가 발생했습니다.' };
  }
}
