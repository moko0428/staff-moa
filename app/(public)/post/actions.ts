'use server';

import { createClient } from '@/utils/supabase/server';

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

const isPostPast = (post: Record<string, unknown>): boolean => {
  const now = new Date();

  if (post.work_slots && Array.isArray(post.work_slots) && post.work_slots.length > 0) {
    const slots = post.work_slots as Array<Record<string, unknown>>;
    const lastSlot = slots[slots.length - 1];
    const lastDate = lastSlot?.date as string;
    const lastEndTime = (lastSlot?.end_time || lastSlot?.end) as string;

    if (lastDate && lastEndTime) {
      try {
        const [hours, minutes] = lastEndTime.split(':').map(Number);
        const workDateTime = new Date(lastDate);
        workDateTime.setHours(hours, minutes, 0, 0);
        return workDateTime < now;
      } catch {
        // 파싱 실패 시 기본값 사용
      }
    }
  }

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
};

const updatePostStatusIfPast = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: number | string
): Promise<void> => {
  try {
    const { data: post } = await supabase
      .from('posts')
      .select('*')
      .eq('post_id', postId)
      .single();

    if (!post || post.status === 'completed') return;

    if (isPostPast(post)) {
      await supabase.from('posts').update({ status: 'completed' }).eq('post_id', postId);
    }
  } catch (error) {
    console.error('[updatePostStatusIfPast] Error:', error);
  }
};

const getHiddenPostIds = async (
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<number[]> => {
  try {
    const { data, error } = await supabase
      .from('post_reports')
      .select('post_id')
      .in('status', ['pending', 'reviewed']);

    if (error || !data?.length) return [];

    const reportCounts = new Map<number, number>();
    for (const report of data) {
      reportCounts.set(report.post_id, (reportCounts.get(report.post_id) || 0) + 1);
    }

    return [...reportCounts.entries()]
      .filter(([, count]) => count >= 5)
      .map(([postId]) => postId);
  } catch {
    return [];
  }
};

const getPostReportCount = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string | number
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('post_reports')
      .select('report_id')
      .eq('post_id', postId)
      .in('status', ['pending', 'reviewed']);

    if (error) return 0;
    return data?.length || 0;
  } catch {
    return 0;
  }
};

export const getAllPostsAction = async (): Promise<
  ActionResult<Array<Record<string, unknown>>>
> => {
  try {
    const supabase = await createClient();
    const hiddenPostIds = await getHiddenPostIds(supabase);

    const LIST_FIELDS = [
      'post_id',
      'title',
      'description',
      'status',
      'pay_amount',
      'pay_type',
      'location',
      'manager_name',
      'keywords',
      'work_slots',
      'work_date',
      'work_time_start',
      'work_time_end',
      'created_at',
      'recruit_count',
      'external_link',
      'author_id',
    ].join(', ');

    let query = supabase.from('posts').select(LIST_FIELDS).order('created_at', { ascending: false });
    if (hiddenPostIds.length > 0) {
      query = query.not('post_id', 'in', `(${hiddenPostIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[getAllPostsAction] Error:', error);
      return { ok: false, message: '공고 목록을 불러오는데 실패했습니다.', data: [] };
    }

    if (data?.length) {
      await Promise.all(
        (data as unknown as Record<string, unknown>[]).map(async (post) => {
          if (isPostPast(post) && post.status !== 'completed') {
            const postId = post.post_id as number | string;
            if (postId != null) {
              await updatePostStatusIfPast(supabase, postId);
              post.status = 'completed';
            }
          }
          const { data: applicants } = await supabase
            .from('member_schedules')
            .select('member_schedule_id')
            .eq('post_id', post.post_id as number);
          post.currentApplicants = applicants?.length || 0;
        })
      );
    }

    const posts = (data as unknown as Record<string, unknown>[]) || [];

    // 배치 조회로 커버 이미지 주입 (N+1 방지)
    if (posts.length > 0) {
      const authorIds = [...new Set(posts.map((p) => p.author_id as string).filter(Boolean))];
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, cover_image')
          .in('user_id', authorIds);

        if (profiles) {
          const coverMap = Object.fromEntries(
            profiles.map((p) => [
              (p as { user_id: string }).user_id,
              (p as { cover_image?: string | null }).cover_image ?? null,
            ])
          );
          posts.forEach((post) => {
            post.authorCoverImage = coverMap[post.author_id as string] ?? null;
          });
        }
      }
    }

    return { ok: true, message: '', data: posts };
  } catch (err) {
    console.error('[getAllPostsAction] Unexpected error:', err);
    return { ok: false, message: '공고 목록을 불러오는 중 오류가 발생했습니다.', data: [] };
  }
};

export const getAllProfilesAction = async (): Promise<
  ActionResult<Array<Record<string, unknown>>>
> => {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { ok: false, message: '로그인이 필요합니다.', data: [] };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'admin')
      return { ok: false, message: '관리자만 접근할 수 있습니다.', data: [] };

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getAllProfilesAction] Error:', error);
      return { ok: false, message: '사용자 목록을 불러오는데 실패했습니다.', data: [] };
    }

    return { ok: true, message: '', data: data || [] };
  } catch (err) {
    console.error('[getAllProfilesAction] Unexpected error:', err);
    return { ok: false, message: '사용자 목록을 불러오는 중 오류가 발생했습니다.', data: [] };
  }
};

export const getPublicPostByIdAction = async (
  postId: string
): Promise<ActionResult<Record<string, unknown>>> => {
  try {
    const supabase = await createClient();

    const reportCount = await getPostReportCount(supabase, postId);
    if (reportCount >= 5) {
      return { ok: false, message: '신고가 누적되어 숨겨진 공고입니다.' };
    }

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('post_id', postId)
      .single();

    if (error || !data) {
      return { ok: false, message: '공고를 찾을 수 없습니다.' };
    }

    if (isPostPast(data) && data.status !== 'completed') {
      await updatePostStatusIfPast(supabase, postId);
      data.status = 'completed';
    }

    const { data: applicants } = await supabase
      .from('member_schedules')
      .select('member_schedule_id')
      .eq('post_id', postId);
    data.currentApplicants = applicants?.length || 0;

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
    console.error('[getPublicPostByIdAction] Unexpected error:', err);
    return { ok: false, message: '공고를 불러오는 중 오류가 발생했습니다.' };
  }
};

export const getMyAcceptedSchedulesAction = async (): Promise<
  ActionResult<
    Array<{
      id: string;
      postId: string;
      title: string;
      date: string;
      salary: number;
      location: string;
    }>
  >
> => {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { ok: false, message: '로그인이 필요합니다.', data: [] };

    const { data: schedules, error } = await supabase
      .from('member_schedules')
      .select(
        `member_schedule_id, post_id,
         posts (post_id, title, location, pay_amount, work_date, work_slots)`
      )
      .eq('member_id', userData.user.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getMyAcceptedSchedulesAction] Error:', error);
      return { ok: false, message: '스케줄을 불러오는데 실패했습니다.', data: [] };
    }

    const result = (schedules || []).map((s) => {
      const post = Array.isArray(s.posts) ? s.posts[0] : s.posts;
      const workSlots = post?.work_slots as Array<{
        date: string;
        pay_amount?: number;
      }> | null;
      return {
        id: s.member_schedule_id,
        postId: String(s.post_id),
        title: post?.title || '',
        date: workSlots?.[0]?.date || post?.work_date || '',
        salary: workSlots?.[0]?.pay_amount || Number(post?.pay_amount) || 0,
        location: post?.location || '',
      };
    });

    return { ok: true, message: '', data: result };
  } catch (err) {
    console.error('[getMyAcceptedSchedulesAction] Unexpected error:', err);
    return { ok: false, message: '오류가 발생했습니다.', data: [] };
  }
};

export const getUserPostStateAction = async (): Promise<
  ActionResult<{
    userId: string | null;
    userName: string | null;
    favoriteIds: string[];
    appliedIds: string[];
  }>
> => {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id ?? null;

    if (!userId) {
      return { ok: true, message: '', data: { userId: null, userName: null, favoriteIds: [], appliedIds: [] } };
    }

    const [profileResult, favResult, appliedResult] = await Promise.all([
      supabase.from('profiles').select('name').eq('user_id', userId).single(),
      supabase.from('favorites_posts').select('post_id').eq('user_id', userId),
      supabase.from('member_schedules').select('post_id').eq('member_id', userId),
    ]);

    const userName = (profileResult.data as { name?: string | null } | null)?.name ?? null;
    const favoriteIds = (favResult.data || []).map((r) => String((r as { post_id: number }).post_id));
    const appliedIds = (appliedResult.data || []).map((r) => String((r as { post_id: number }).post_id));

    return { ok: true, message: '', data: { userId, userName, favoriteIds, appliedIds } };
  } catch (err) {
    console.error('[getUserPostStateAction] Unexpected error:', err);
    return { ok: true, message: '', data: { userId: null, userName: null, favoriteIds: [], appliedIds: [] } };
  }
};

export const getManagerPostsAction = async (
  managerId: string
): Promise<ActionResult<Array<Record<string, unknown>>>> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', managerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getManagerPostsAction] Error:', error);
      return { ok: false, message: '공고 목록을 불러오는데 실패했습니다.', data: [] };
    }

    if (data?.length) {
      await Promise.all(
        data.map(async (post: Record<string, unknown>) => {
          if (isPostPast(post) && post.status !== 'completed') {
            const postId = post.post_id as number | string;
            if (postId != null) {
              await updatePostStatusIfPast(supabase, postId);
              post.status = 'completed';
            }
          }
        })
      );
    }

    return { ok: true, message: '', data: data || [] };
  } catch (err) {
    console.error('[getManagerPostsAction] Unexpected error:', err);
    return { ok: false, message: '공고 목록을 불러오는 중 오류가 발생했습니다.', data: [] };
  }
};
