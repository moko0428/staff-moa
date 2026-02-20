'use server';

import { createClient } from '@/utils/supabase/server';
import { createNotificationAction } from '@/app/(features)/(protected)/notification/actions';

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
      console.log('[getApplicantsAction] No posts found for manager');
      return { ok: true, message: '', data: [] };
    }

    const postIds = myPosts.map((p) => p.post_id);
    console.log('[getApplicantsAction] Post IDs:', postIds);

    // 먼저 간단한 쿼리로 데이터가 있는지 확인
    const { data: simpleCheck, error: simpleError } = await supabase
      .from('member_schedules')
      .select('member_schedule_id, post_id, member_id')
      .in('post_id', postIds);

    console.log('[getApplicantsAction] Simple check:', simpleCheck?.length || 0, 'records');
    if (simpleError) {
      console.error('[getApplicantsAction] Simple check error:', simpleError);
    }

    // 2. 해당 공고들에 지원한 member_schedules 조회
    // profiles는 별도로 조회 (foreign key 이름 문제 회피)
    const { data: schedules, error: schedulesError } = await supabase
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
        posts!inner (
          post_id,
          title,
          description,
          work_date,
          location,
          pay_amount,
          pay_type,
          work_slots,
          status
        )
      `
      )
      .in('post_id', postIds)
      .order('created_at', { ascending: false });

    if (schedulesError) {
      console.error('[getApplicantsAction] Schedules select error', schedulesError);
      return {
        ok: false,
        message: '지원자 목록을 불러오는데 실패했습니다.',
        data: [],
      };
    }

    if (!schedules || schedules.length === 0) {
      console.log('[getApplicantsAction] No schedules found');
      return { ok: true, message: '', data: [] };
    }

    // 3. 각 지원자의 프로필 정보 가져오기
    const memberIds = schedules.map((s) => s.member_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(
        `
        user_id,
        name,
        email,
        phone,
        avatar,
        attendance_score,
        birth_date,
        gender,
        kakao_id,
        bio,
        experiences,
        documents,
        profile_visibility
      `
      )
      .in('user_id', memberIds);

    if (profilesError) {
      console.error('[getApplicantsAction] Profiles select error', profilesError);
      return {
        ok: false,
        message: '지원자 정보를 불러오는데 실패했습니다.',
        data: [],
      };
    }

    // 4. 데이터 결합
    const applicants = schedules.map((schedule) => {
      const profile = profiles?.find((p) => p.user_id === schedule.member_id);
      return {
        ...schedule,
        profiles: profile || null,
      };
    });

    console.log('[getApplicantsAction] Applicants found:', applicants?.length || 0);
    if (applicants && applicants.length > 0) {
      console.log('[getApplicantsAction] First applicant:', JSON.stringify(applicants[0], null, 2));
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

// 지원자 상태 변경 (승인/거절/대기로 번복)
export async function updateApplicantStatusAction(
  memberScheduleId: string,
  status: 'pending' | 'accepted' | 'rejected'
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 1. member_schedule 정보 조회 (member_id, 현재 status 포함)
    const { data: schedule } = await supabase
      .from('member_schedules')
      .select('post_id, member_id, status')
      .eq('member_schedule_id', memberScheduleId)
      .single();

    if (!schedule) {
      return { ok: false, message: '지원 정보를 찾을 수 없습니다.' };
    }

    const previousStatus = schedule.status;

    // 2. 해당 공고의 작성자인지 확인 (공고 제목도 가져오기)
    const { data: post } = await supabase
      .from('posts')
      .select('author_id, title')
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

    // 4. 지원자에게 알림 발송
    let notificationType: 'application_accepted' | 'application_rejected' | 'system';
    let notificationTitle: string;
    let notificationMessage: string;

    if (status === 'accepted') {
      notificationType = 'application_accepted';
      notificationTitle = '지원이 승인되었습니다';
      notificationMessage = `"${post.title}" 공고에 대한 지원이 승인되었습니다. 스케줄을 확인해주세요.`;
    } else if (status === 'rejected') {
      notificationType = 'application_rejected';
      notificationTitle = '지원이 거절되었습니다';
      notificationMessage = `"${post.title}" 공고에 대한 지원이 거절되었습니다.`;
    } else {
      // pending으로 변경 (번복)
      notificationType = 'system';
      if (previousStatus === 'accepted') {
        notificationTitle = '지원 승인이 취소되었습니다';
        notificationMessage = `"${post.title}" 공고에 대한 승인이 취소되어 대기 상태로 변경되었습니다.`;
      } else {
        notificationTitle = '지원 상태가 변경되었습니다';
        notificationMessage = `"${post.title}" 공고에 대한 지원이 다시 검토 중입니다.`;
      }
    }

    await createNotificationAction({
      userId: schedule.member_id,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      link: '/worker/schedule',
    });

    const statusText = status === 'accepted' ? '승인' : status === 'rejected' ? '거절' : '대기로 변경';
    return { ok: true, message: `지원자를 ${statusText}했습니다.` };
  } catch (err) {
    console.error('[updateApplicantStatusAction] Unexpected error', err);
    return { ok: false, message: '상태 변경 중 오류가 발생했습니다.' };
  }
}

// 지원자 일괄 승인/거절/대기
export async function bulkUpdateApplicantsAction(
  memberScheduleIds: string[],
  status: 'pending' | 'accepted' | 'rejected'
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

// 즐겨찾기 또는 블랙리스트에 등록된 워커 목록 (프로필 포함)
export async function getManagedWorkersAction(): Promise<
  ActionResult<
    Array<{
      worker_id: string;
      is_favorite: boolean;
      is_blacklisted: boolean;
      rating: number | null;
      notes: string | null;
      profile: {
        name: string;
        email: string;
        phone: string | null;
        avatar: string | null;
        attendance_score: number;
        birth_date: string | null;
        gender: string | null;
        kakao_id: string | null;
      } | null;
    }>
  >
> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    const { data, error } = await supabase
      .from('manager_worker_management')
      .select('worker_id, is_favorite, is_blacklisted, rating, notes')
      .eq('manager_id', userData.user.id)
      .or('is_favorite.eq.true,is_blacklisted.eq.true');

    if (error) {
      console.error('[getManagedWorkersAction] Select error', error);
      return { ok: false, message: '관리 워커 목록을 불러오는데 실패했습니다.', data: [] };
    }

    if (!data || data.length === 0) {
      return { ok: true, message: '', data: [] };
    }

    // 프로필 조회
    const workerIds = data.map((d) => d.worker_id as string);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name, email, phone, avatar, attendance_score, birth_date, gender, kakao_id')
      .in('user_id', workerIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    return {
      ok: true,
      message: '',
      data: data.map((d) => ({
        worker_id: d.worker_id as string,
        is_favorite: d.is_favorite as boolean,
        is_blacklisted: d.is_blacklisted as boolean,
        rating: d.rating as number | null,
        notes: d.notes as string | null,
        profile: profileMap.get(d.worker_id as string) as {
          name: string;
          email: string;
          phone: string | null;
          avatar: string | null;
          attendance_score: number;
          birth_date: string | null;
          gender: string | null;
          kakao_id: string | null;
        } | null,
      })),
    };
  } catch (err) {
    console.error('[getManagedWorkersAction] Unexpected error', err);
    return { ok: false, message: '관리 워커 목록을 불러오는 중 오류가 발생했습니다.', data: [] };
  }
}
