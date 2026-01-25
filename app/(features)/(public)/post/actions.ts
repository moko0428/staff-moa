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

// 모든 공고 가져오기 (공개 페이지용)
export async function getAllPostsAction(): Promise<
  ActionResult<Array<Record<string, unknown>>>
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

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
