'use server';

import { createClient } from '@/utils/supabase/server';

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

// Manager의 공고에 지원한 Member 목록 조회
export async function getApplicantsAction(): Promise<
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

    // 1. 매니저가 작성한 공고들의 ID 가져오기
    const { data: myPosts, error: postsError } = await supabase
      .from('posts')
      .select('post_id')
      .eq('author_id', userData.user.id);

    if (postsError) {
      console.error('[getApplicantsAction] Posts select error', postsError);
      return {
        ok: false,
        message: '공고 목록을 불러오는데 실패했습니다.',
        data: [],
      };
    }

    if (!myPosts || myPosts.length === 0) {
      return { ok: true, message: '', data: [] };
    }

    const postIds = myPosts.map((p) => p.post_id);

    // 2. 해당 공고들에 지원한 member_schedules 조회
    const { data: applicants, error: applicantsError } = await supabase
      .from('member_schedules')
      .select(
        `
        member_schedule_id,
        post_id,
        member_id,
        status,
        message,
        created_at,
        updated_at,
        posts (
          post_id,
          title,
          description,
          work_date,
          location,
          pay_amount,
          pay_type,
          work_slots
        ),
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
      .in('post_id', postIds)
      .order('created_at', { ascending: false });

    if (applicantsError) {
      console.error(
        '[getApplicantsAction] Applicants select error',
        applicantsError
      );
      return {
        ok: false,
        message: '지원자 목록을 불러오는데 실패했습니다.',
        data: [],
      };
    }

    return { ok: true, message: '', data: applicants || [] };
  } catch (err) {
    console.error('[getApplicantsAction] Unexpected error', err);
    return {
      ok: false,
      message: '지원자 목록을 불러오는 중 오류가 발생했습니다.',
      data: [],
    };
  }
}

// 특정 공고의 지원자 목록 조회
export async function getApplicantsByPostAction(
  postId: number
): Promise<ActionResult<Array<Record<string, unknown>>>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    // 공고의 작성자인지 확인
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('post_id', postId)
      .single();

    if (!post || post.author_id !== userData.user.id) {
      return { ok: false, message: '권한이 없습니다.', data: [] };
    }

    // 지원자 목록 조회
    const { data: applicants, error } = await supabase
      .from('member_schedules')
      .select(
        `
        member_schedule_id,
        post_id,
        member_id,
        status,
        message,
        created_at,
        updated_at,
        profiles:member_id (
          user_id,
          name,
          email,
          phone,
          avatar,
          attendance_score,
          experiences,
          documents
        )
      `
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getApplicantsByPostAction] Select error', error);
      return {
        ok: false,
        message: '지원자 목록을 불러오는데 실패했습니다.',
        data: [],
      };
    }

    return { ok: true, message: '', data: applicants || [] };
  } catch (err) {
    console.error('[getApplicantsByPostAction] Unexpected error', err);
    return {
      ok: false,
      message: '지원자 목록을 불러오는 중 오류가 발생했습니다.',
      data: [],
    };
  }
}

// 지원자 상태 변경 (승인/거절)
export async function updateApplicantStatusAction(
  memberScheduleId: string,
  status: 'accepted' | 'rejected'
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 1. member_schedule 정보 조회
    const { data: schedule } = await supabase
      .from('member_schedules')
      .select('post_id')
      .eq('member_schedule_id', memberScheduleId)
      .single();

    if (!schedule) {
      return { ok: false, message: '지원 정보를 찾을 수 없습니다.' };
    }

    // 2. 해당 공고의 작성자인지 확인
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('post_id', schedule.post_id)
      .single();

    if (!post || post.author_id !== userData.user.id) {
      return { ok: false, message: '권한이 없습니다.' };
    }

    // 3. 상태 업데이트
    const { error } = await supabase
      .from('member_schedules')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('member_schedule_id', memberScheduleId);

    if (error) {
      console.error('[updateApplicantStatusAction] Update error', error);
      return { ok: false, message: '상태 변경에 실패했습니다.' };
    }

    const statusText = status === 'accepted' ? '승인' : '거절';
    return { ok: true, message: `지원자를 ${statusText}했습니다.` };
  } catch (err) {
    console.error('[updateApplicantStatusAction] Unexpected error', err);
    return { ok: false, message: '상태 변경 중 오류가 발생했습니다.' };
  }
}

// 지원자 일괄 승인/거절
export async function bulkUpdateApplicantsAction(
  memberScheduleIds: string[],
  status: 'accepted' | 'rejected'
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    if (memberScheduleIds.length === 0) {
      return { ok: false, message: '선택된 지원자가 없습니다.' };
    }

    // 각 schedule에 대해 권한 확인 및 업데이트
    let successCount = 0;
    const errors: string[] = [];

    for (const scheduleId of memberScheduleIds) {
      const result = await updateApplicantStatusAction(scheduleId, status);
      if (result.ok) {
        successCount++;
      } else {
        errors.push(result.message);
      }
    }

    if (successCount === 0) {
      return {
        ok: false,
        message: '모든 업데이트가 실패했습니다: ' + errors[0],
      };
    }

    if (errors.length > 0) {
      return {
        ok: true,
        message: `${successCount}명 처리 완료, ${errors.length}명 실패`,
      };
    }

    const statusText = status === 'accepted' ? '승인' : '거절';
    return {
      ok: true,
      message: `${successCount}명의 지원자를 ${statusText}했습니다.`,
    };
  } catch (err) {
    console.error('[bulkUpdateApplicantsAction] Unexpected error', err);
    return { ok: false, message: '일괄 처리 중 오류가 발생했습니다.' };
  }
}

// 워커 관리 데이터 가져오기
export async function getWorkerManagementAction(
  workerId: string
): Promise<ActionResult<Record<string, unknown>>> {
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

    if (profile?.role !== 'manager') {
      return { ok: false, message: '매니저만 접근할 수 있습니다.' };
    }

    // 워커 관리 정보 조회
    const { data, error } = await supabase
      .from('manager_worker_management')
      .select('*')
      .eq('manager_id', userData.user.id)
      .eq('worker_id', workerId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[getWorkerManagementAction] Select error', error);
      return { ok: false, message: '워커 관리 정보를 불러오는데 실패했습니다.' };
    }

    return { ok: true, message: '', data: data || {} };
  } catch (err) {
    console.error('[getWorkerManagementAction] Unexpected error', err);
    return {
      ok: false,
      message: '워커 관리 정보를 불러오는 중 오류가 발생했습니다.',
    };
  }
}

// 워커 즐겨찾기 토글
export async function toggleFavoriteAction(
  workerId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 기존 데이터 확인
    const { data: existing } = await supabase
      .from('manager_worker_management')
      .select('*')
      .eq('manager_id', userData.user.id)
      .eq('worker_id', workerId)
      .maybeSingle();

    if (existing) {
      // 업데이트
      const { error } = await supabase
        .from('manager_worker_management')
        .update({
          is_favorite: !existing.is_favorite,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('[toggleFavoriteAction] Update error', error);
        return { ok: false, message: '즐겨찾기 변경에 실패했습니다.' };
      }

      return {
        ok: true,
        message: existing.is_favorite
          ? '즐겨찾기에서 제거했습니다.'
          : '즐겨찾기에 추가했습니다.',
      };
    } else {
      // 생성
      const { error } = await supabase
        .from('manager_worker_management')
        .insert({
          manager_id: userData.user.id,
          worker_id: workerId,
          is_favorite: true,
          is_blacklisted: false,
        });

      if (error) {
        console.error('[toggleFavoriteAction] Insert error', error);
        return { ok: false, message: '즐겨찾기 추가에 실패했습니다.' };
      }

      return { ok: true, message: '즐겨찾기에 추가했습니다.' };
    }
  } catch (err) {
    console.error('[toggleFavoriteAction] Unexpected error', err);
    return { ok: false, message: '즐겨찾기 변경 중 오류가 발생했습니다.' };
  }
}

// 워커 블랙리스트 토글
export async function toggleBlacklistAction(
  workerId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 기존 데이터 확인
    const { data: existing } = await supabase
      .from('manager_worker_management')
      .select('*')
      .eq('manager_id', userData.user.id)
      .eq('worker_id', workerId)
      .maybeSingle();

    if (existing) {
      // 업데이트
      const { error } = await supabase
        .from('manager_worker_management')
        .update({
          is_blacklisted: !existing.is_blacklisted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('[toggleBlacklistAction] Update error', error);
        return { ok: false, message: '블랙리스트 변경에 실패했습니다.' };
      }

      return {
        ok: true,
        message: existing.is_blacklisted
          ? '블랙리스트에서 제거했습니다.'
          : '블랙리스트에 추가했습니다.',
      };
    } else {
      // 생성
      const { error } = await supabase
        .from('manager_worker_management')
        .insert({
          manager_id: userData.user.id,
          worker_id: workerId,
          is_favorite: false,
          is_blacklisted: true,
        });

      if (error) {
        console.error('[toggleBlacklistAction] Insert error', error);
        return { ok: false, message: '블랙리스트 추가에 실패했습니다.' };
      }

      return { ok: true, message: '블랙리스트에 추가했습니다.' };
    }
  } catch (err) {
    console.error('[toggleBlacklistAction] Unexpected error', err);
    return { ok: false, message: '블랙리스트 변경 중 오류가 발생했습니다.' };
  }
}

// 워커 평가 저장
export async function updateWorkerRatingAction(
  workerId: string,
  rating: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    if (rating < 1 || rating > 5) {
      return { ok: false, message: '평점은 1-5 사이여야 합니다.' };
    }

    // 기존 데이터 확인
    const { data: existing } = await supabase
      .from('manager_worker_management')
      .select('*')
      .eq('manager_id', userData.user.id)
      .eq('worker_id', workerId)
      .maybeSingle();

    if (existing) {
      // 업데이트
      const { error } = await supabase
        .from('manager_worker_management')
        .update({
          rating,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('[updateWorkerRatingAction] Update error', error);
        return { ok: false, message: '평가 저장에 실패했습니다.' };
      }
    } else {
      // 생성
      const { error } = await supabase
        .from('manager_worker_management')
        .insert({
          manager_id: userData.user.id,
          worker_id: workerId,
          is_favorite: false,
          is_blacklisted: false,
          rating,
        });

      if (error) {
        console.error('[updateWorkerRatingAction] Insert error', error);
        return { ok: false, message: '평가 저장에 실패했습니다.' };
      }
    }

    return { ok: true, message: '평가가 저장되었습니다.' };
  } catch (err) {
    console.error('[updateWorkerRatingAction] Unexpected error', err);
    return { ok: false, message: '평가 저장 중 오류가 발생했습니다.' };
  }
}

// 워커 메모 저장
export async function updateWorkerNotesAction(
  workerId: string,
  notes: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 기존 데이터 확인
    const { data: existing } = await supabase
      .from('manager_worker_management')
      .select('*')
      .eq('manager_id', userData.user.id)
      .eq('worker_id', workerId)
      .maybeSingle();

    if (existing) {
      // 업데이트
      const { error } = await supabase
        .from('manager_worker_management')
        .update({
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('[updateWorkerNotesAction] Update error', error);
        return { ok: false, message: '메모 저장에 실패했습니다.' };
      }
    } else {
      // 생성
      const { error } = await supabase
        .from('manager_worker_management')
        .insert({
          manager_id: userData.user.id,
          worker_id: workerId,
          is_favorite: false,
          is_blacklisted: false,
          notes,
        });

      if (error) {
        console.error('[updateWorkerNotesAction] Insert error', error);
        return { ok: false, message: '메모 저장에 실패했습니다.' };
      }
    }

    return { ok: true, message: '메모가 저장되었습니다.' };
  } catch (err) {
    console.error('[updateWorkerNotesAction] Unexpected error', err);
    return { ok: false, message: '메모 저장 중 오류가 발생했습니다.' };
  }
}
