'use server';

import { createClient } from '@/utils/supabase/server';

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

// 포스트의 날짜/시간을 확인하여 과거인지 판단하는 헬퍼 함수
function isPostPast(
  post: Record<string, unknown>
): boolean {
  const now = new Date();
  
  // work_slots에서 가장 마지막 날짜와 시간 확인
  if (post.work_slots && Array.isArray(post.work_slots) && post.work_slots.length > 0) {
    const slots = post.work_slots as Array<Record<string, unknown>>;
    // 가장 마지막 날짜 찾기
    const lastSlot = slots[slots.length - 1];
    const lastDate = lastSlot?.date as string;
    const lastEndTime = (lastSlot?.end_time || lastSlot?.end) as string;
    
    if (lastDate && lastEndTime) {
      try {
        // 날짜와 시간을 결합하여 Date 객체 생성
        const [hours, minutes] = lastEndTime.split(':').map(Number);
        const workDateTime = new Date(lastDate);
        workDateTime.setHours(hours, minutes, 0, 0);
        
        return workDateTime < now;
      } catch {
        // 파싱 실패 시 기본값 사용
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
      workDateTime.setHours(hours, minutes, 0, 0);
      
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
    // 포스트 가져오기
    const { data: post } = await supabase
      .from('posts')
      .select('*')
      .eq('post_id', postId)
      .single();
    
    if (!post) return;
    
    // 이미 completed 상태이면 업데이트하지 않음
    if (post.status === 'completed') return;
    
    // 과거 포스트인지 확인
    if (isPostPast(post)) {
      // 상태를 completed로 업데이트
      await supabase
        .from('posts')
        .update({ status: 'completed' })
        .eq('post_id', postId);
    }
  } catch (error) {
    // 에러가 발생해도 조용히 처리 (로그만 남김)
    console.error('[updatePostStatusIfPast] Error updating post status:', error);
  }
}

// 신고 5회 이상인 게시물 ID 조회
async function getHiddenPostIds(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<number[]> {
  try {
    // post_reports 테이블에서 pending/reviewed 상태의 신고를 그룹화하여 5회 이상인 것 조회
    const { data, error } = await supabase
      .from('post_reports')
      .select('post_id')
      .in('status', ['pending', 'reviewed']);

    if (error) {
      console.error('[getHiddenPostIds] Error:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // 게시물별 신고 횟수 카운트
    const reportCounts = new Map<number, number>();
    for (const report of data) {
      const count = reportCounts.get(report.post_id) || 0;
      reportCounts.set(report.post_id, count + 1);
    }

    // 5회 이상인 게시물 ID 반환
    const hiddenPostIds: number[] = [];
    for (const [postId, count] of reportCounts) {
      if (count >= 5) {
        hiddenPostIds.push(postId);
      }
    }

    return hiddenPostIds;
  } catch (err) {
    console.error('[getHiddenPostIds] Unexpected error:', err);
    return [];
  }
}

// 모든 공고 가져오기 (공개 페이지용)
export async function getAllPostsAction(): Promise<
  ActionResult<Array<Record<string, unknown>>>
> {
  try {
    const supabase = await createClient();

    // 신고 5회 이상인 게시물 ID 조회
    const hiddenPostIds = await getHiddenPostIds(supabase);

    // 게시물 조회
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    // 신고 5회 이상인 게시물 제외
    if (hiddenPostIds.length > 0) {
      query = query.not('post_id', 'in', `(${hiddenPostIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[getAllPostsAction] Supabase select error', error);
      return {
        ok: false,
        message: '공고 목록을 불러오는데 실패했습니다.',
        data: [],
      };
    }

    // 각 포스트별 지원자 수 조회 및 과거 포스트 상태 자동 업데이트
    if (data && data.length > 0) {
      await Promise.all(
        data.map(async (post: Record<string, unknown>) => {
          // 과거 포스트 상태 업데이트
          if (isPostPast(post) && post.status !== 'completed') {
            const postId = post.post_id as number | string;
            if (postId !== undefined && postId !== null) {
              await updatePostStatusIfPast(supabase, postId);
              post.status = 'completed';
            }
          }

          // 지원자 수 조회
          const postId = post.post_id as number;
          const { data: applicants } = await supabase
            .from('member_schedules')
            .select('member_schedule_id')
            .eq('post_id', postId);

          post.currentApplicants = applicants?.length || 0;
        })
      );
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

// 모든 프로필 가져오기 (관리자 페이지용)
export async function getAllProfilesAction(): Promise<
  ActionResult<Array<Record<string, unknown>>>
> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return { ok: false, message: '관리자만 접근할 수 있습니다.', data: [] };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getAllProfilesAction] Supabase select error', error);
      return {
        ok: false,
        message: '사용자 목록을 불러오는데 실패했습니다.',
        data: [],
      };
    }

    return { ok: true, message: '', data: data || [] };
  } catch (err) {
    console.error('[getAllProfilesAction] Unexpected error', err);
    return {
      ok: false,
      message: '사용자 목록을 불러오는 중 오류가 발생했습니다.',
      data: [],
    };
  }
}

// 특정 게시물의 신고 횟수 조회
async function getPostReportCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string | number
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('post_reports')
      .select('report_id')
      .eq('post_id', postId)
      .in('status', ['pending', 'reviewed']);

    if (error) {
      console.error('[getPostReportCount] Error:', error);
      return 0;
    }

    return data?.length || 0;
  } catch {
    return 0;
  }
}

// 공개 공고 상세 조회 (ID로)
export async function getPublicPostByIdAction(
  postId: string
): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const supabase = await createClient();

    // 신고 횟수 확인
    const reportCount = await getPostReportCount(supabase, postId);
    if (reportCount >= 5) {
      return {
        ok: false,
        message: '신고가 누적되어 숨겨진 공고입니다.',
      };
    }

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('post_id', postId)
      .single();

    if (error) {
      console.error('[getPublicPostByIdAction] Supabase select error', error);
      return {
        ok: false,
        message: '공고를 찾을 수 없습니다.',
      };
    }

    if (!data) {
      return {
        ok: false,
        message: '공고를 찾을 수 없습니다.',
      };
    }

    // 과거 포스트 상태 자동 업데이트
    if (isPostPast(data) && data.status !== 'completed') {
      await updatePostStatusIfPast(supabase, postId);
      data.status = 'completed';
    }

    // 지원자 수 조회
    const { data: applicants } = await supabase
      .from('member_schedules')
      .select('member_schedule_id')
      .eq('post_id', postId);

    data.currentApplicants = applicants?.length || 0;

    // 작성자 정보 조회
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('name, avatar, company_name')
      .eq('user_id', data.author_id)
      .single();

    if (authorProfile) {
      data.author_name = authorProfile.name;
      data.author_avatar = authorProfile.avatar;
      data.company_name = authorProfile.company_name;
    }

    return { ok: true, message: '', data };
  } catch (err) {
    console.error('[getPublicPostByIdAction] Unexpected error', err);
    return {
      ok: false,
      message: '공고를 불러오는 중 오류가 발생했습니다.',
    };
  }
}

// 워커의 승인된 스케줄 조회 (포스트 페이지용)
export async function getMyAcceptedSchedulesAction(): Promise<
  ActionResult<Array<{
    id: string;
    postId: string;
    title: string;
    date: string;
    salary: number;
    location: string;
  }>>
> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    const { data: schedules, error } = await supabase
      .from('member_schedules')
      .select(`
        member_schedule_id,
        post_id,
        posts (
          post_id,
          title,
          location,
          pay_amount,
          work_date,
          work_slots
        )
      `)
      .eq('member_id', userData.user.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getMyAcceptedSchedulesAction] Error', error);
      return { ok: false, message: '스케줄을 불러오는데 실패했습니다.', data: [] };
    }

    const result = (schedules || []).map((s) => {
      const post = Array.isArray(s.posts) ? s.posts[0] : s.posts;
      const workSlots = post?.work_slots as Array<{ date: string; pay_amount?: number }> | null;
      const firstDate = workSlots?.[0]?.date || post?.work_date || '';
      const salary = workSlots?.[0]?.pay_amount || Number(post?.pay_amount) || 0;

      return {
        id: s.member_schedule_id,
        postId: String(s.post_id),
        title: post?.title || '',
        date: firstDate,
        salary,
        location: post?.location || '',
      };
    });

    return { ok: true, message: '', data: result };
  } catch (err) {
    console.error('[getMyAcceptedSchedulesAction] Unexpected error', err);
    return { ok: false, message: '오류가 발생했습니다.', data: [] };
  }
}

// 매니저의 공고 가져오기
export async function getManagerPostsAction(
  managerId: string
): Promise<ActionResult<Array<Record<string, unknown>>>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', managerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getManagerPostsAction] Supabase select error', error);
      return {
        ok: false,
        message: '공고 목록을 불러오는데 실패했습니다.',
        data: [],
      };
    }

    // 과거 포스트 상태 자동 업데이트
    if (data && data.length > 0) {
      await Promise.all(
        data.map(async (post: Record<string, unknown>) => {
          if (isPostPast(post) && post.status !== 'completed') {
            const postId = post.post_id as number | string;
            if (postId !== undefined && postId !== null) {
              await updatePostStatusIfPast(supabase, postId);
              post.status = 'completed';
            }
          }
        })
      );
    }

    return { ok: true, message: '', data: data || [] };
  } catch (err) {
    console.error('[getManagerPostsAction] Unexpected error', err);
    return {
      ok: false,
      message: '공고 목록을 불러오는 중 오류가 발생했습니다.',
      data: [],
    };
  }
}
