'use server';

import { createClient } from '@/utils/supabase/server';
import { notifyAdminsAction } from '@/app/(protected)/notification/actions';

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

export async function getMyFollowersAction(): Promise<
  ActionResult<{
    count: number;
    followers: Array<{
      userId: string;
      name: string | null;
      avatar: string | null;
      role: string;
    }>;
  }>
> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 매니저만 조회 가능
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'manager') {
      return { ok: false, message: '매니저만 팔로워를 확인할 수 있습니다.' };
    }

    const { data: followRows, count, error } = await supabase
      .from('manager_follows')
      .select('follower_id, created_at', { count: 'exact' })
      .eq('manager_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getMyFollowersAction] Supabase select error', error);
      return { ok: false, message: '팔로워를 불러오는데 실패했습니다.' };
    }

    const followerIds = (followRows || [])
      .map((r) => String((r as { follower_id?: unknown }).follower_id ?? ''))
      .filter(Boolean);

    if (followerIds.length === 0) {
      return { ok: true, message: '', data: { count: count ?? 0, followers: [] } };
    }

    const { data: followerProfiles, error: followerError } = await supabase
      .from('profiles')
      .select('user_id, name, avatar, role')
      .in('user_id', followerIds);

    if (followerError) {
      console.error('[getMyFollowersAction] profiles select error', followerError);
      return { ok: false, message: '팔로워 정보를 불러오는데 실패했습니다.' };
    }

    const profileMap = new Map<
      string,
      { userId: string; name: string | null; avatar: string | null; role: string }
    >();

    (followerProfiles || []).forEach((p) => {
      const userId = String((p as { user_id?: unknown }).user_id ?? '');
      if (!userId) return;
      profileMap.set(userId, {
        userId,
        name: ((p as { name?: unknown }).name as string | null) ?? null,
        avatar: ((p as { avatar?: unknown }).avatar as string | null) ?? null,
        role: (p as { role?: unknown }).role ? String((p as { role?: unknown }).role) : 'member',
      });
    });

    // followRows 순서 유지
    const followers = followerIds
      .map((id) => profileMap.get(id))
      .filter(
        (
          x,
        ): x is { userId: string; name: string | null; avatar: string | null; role: string } =>
          !!x,
      );

    return {
      ok: true,
      message: '',
      data: { count: count ?? followers.length, followers },
    };
  } catch (err) {
    console.error('[getMyFollowersAction] Unexpected error', err);
    return { ok: false, message: '팔로워를 불러오는 중 오류가 발생했습니다.' };
  }
}

export async function getMyFollowingAction(): Promise<
  ActionResult<{
    count: number;
    followings: Array<{
      userId: string;
      name: string | null;
      avatar: string | null;
      role: string;
    }>;
  }>
> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    // 스탭만 조회 가능 (현재 follow 기능은 member -> manager)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'member') {
      return { ok: false, message: '스탭만 팔로잉 목록을 확인할 수 있습니다.' };
    }

    const { data: followRows, count, error } = await supabase
      .from('manager_follows')
      .select('manager_id, created_at', { count: 'exact' })
      .eq('follower_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getMyFollowingAction] Supabase select error', error);
      return { ok: false, message: '팔로잉 목록을 불러오는데 실패했습니다.' };
    }

    const managerIds = (followRows || [])
      .map((r) => String((r as { manager_id?: unknown }).manager_id ?? ''))
      .filter(Boolean);

    if (managerIds.length === 0) {
      return { ok: true, message: '', data: { count: count ?? 0, followings: [] } };
    }

    // 현재 role=manager인 유저만 보여주기
    const { data: managerProfiles, error: managerError } = await supabase
      .from('profiles')
      .select('user_id, name, avatar, role')
      .in('user_id', managerIds)
      .eq('role', 'manager');

    if (managerError) {
      console.error('[getMyFollowingAction] profiles select error', managerError);
      return { ok: false, message: '팔로잉 정보를 불러오는데 실패했습니다.' };
    }

    const profileMap = new Map<
      string,
      { userId: string; name: string | null; avatar: string | null; role: string }
    >();

    (managerProfiles || []).forEach((p) => {
      const userId = String((p as { user_id?: unknown }).user_id ?? '');
      if (!userId) return;
      profileMap.set(userId, {
        userId,
        name: ((p as { name?: unknown }).name as string | null) ?? null,
        avatar: ((p as { avatar?: unknown }).avatar as string | null) ?? null,
        role: (p as { role?: unknown }).role ? String((p as { role?: unknown }).role) : 'manager',
      });
    });

    // followRows 순서 유지
    const followings = managerIds
      .map((id) => profileMap.get(id))
      .filter(
        (
          x,
        ): x is { userId: string; name: string | null; avatar: string | null; role: string } =>
          !!x,
      );

    return {
      ok: true,
      message: '',
      data: { count: count ?? followings.length, followings },
    };
  } catch (err) {
    console.error('[getMyFollowingAction] Unexpected error', err);
    return { ok: false, message: '팔로잉 목록을 불러오는 중 오류가 발생했습니다.' };
  }
}

export async function removeMyFollowingAction(managerId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }
    if (!managerId) {
      return { ok: false, message: '올바른 매니저가 아닙니다.' };
    }

    // 스탭만 가능
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'member') {
      return { ok: false, message: '스탭만 팔로잉을 삭제할 수 있습니다.' };
    }

    const { error } = await supabase
      .from('manager_follows')
      .delete()
      .eq('follower_id', userData.user.id)
      .eq('manager_id', managerId);

    if (error) {
      console.error('[removeMyFollowingAction] Supabase delete error', error);
      return { ok: false, message: '팔로잉 삭제에 실패했습니다.' };
    }

    return { ok: true, message: '팔로잉이 삭제되었습니다.' };
  } catch (err) {
    console.error('[removeMyFollowingAction] Unexpected error', err);
    return { ok: false, message: '팔로잉 삭제 중 오류가 발생했습니다.' };
  }
}

export async function removeMyFollowerAction(followerId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }
    if (!followerId) {
      return { ok: false, message: '올바른 팔로워가 아닙니다.' };
    }

    // 매니저만 가능
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'manager') {
      return { ok: false, message: '매니저만 팔로워를 삭제할 수 있습니다.' };
    }

    const { error } = await supabase
      .from('manager_follows')
      .delete()
      .eq('manager_id', userData.user.id)
      .eq('follower_id', followerId);

    if (error) {
      console.error('[removeMyFollowerAction] Supabase delete error', error);
      return { ok: false, message: '팔로워 삭제에 실패했습니다.' };
    }

    return { ok: true, message: '팔로워가 삭제되었습니다.' };
  } catch (err) {
    console.error('[removeMyFollowerAction] Unexpected error', err);
    return { ok: false, message: '팔로워 삭제 중 오류가 발생했습니다.' };
  }
}

export async function getProfileForModalAction(
  userId: string,
): Promise<
  ActionResult<{
    id: string;
    name: string | null;
    email: string | null;
    photo: string | null;
    role: string;
    introduction: string | null;
    attendanceScore: number | null;
    followerCount: number;
    companyName: string | null;
    companyVerifyStatus: string | null;
  }>
> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, name, email, avatar, role, bio, attendance_score, company_name, company_verify_status')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[getProfileForModalAction] Supabase select error', error);
      return { ok: false, message: '프로필을 불러오는데 실패했습니다.' };
    }

    // 팔로워 수 (manager_follows 기준)
    const { count: followerCount, error: countError } = await supabase
      .from('manager_follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('manager_id', userId);

    if (countError) {
      console.error('[getProfileForModalAction] Count error', countError);
    }

    return {
      ok: true,
      message: '',
      data: {
        id: data.user_id as string,
        name: (data.name as string | null) ?? null,
        email: (data.email as string | null) ?? null,
        photo: (data.avatar as string | null) ?? null,
        role: (data.role as string) ?? 'member',
        introduction: (data.bio as string | null) ?? null,
        attendanceScore: (data.attendance_score as number | null) ?? null,
        followerCount: followerCount ?? 0,
        companyName: (data.company_name as string | null) ?? null,
        companyVerifyStatus: (data.company_verify_status as string | null) ?? null,
      },
    };
  } catch (err) {
    console.error('[getProfileForModalAction] Unexpected error', err);
    return { ok: false, message: '프로필을 불러오는 중 오류가 발생했습니다.' };
  }
}

// 거절된 매니저의 승인 재요청
export async function reRequestManagerApprovalAction(): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name, company_verify_status')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'pending_manager') {
      return { ok: false, message: '승인 요청 권한이 없습니다.' };
    }

    if (profile?.company_verify_status !== 'rejected') {
      return { ok: false, message: '거절된 경우에만 재요청이 가능합니다.' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ company_verify_status: 'pending' })
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('[reRequestManagerApprovalAction] Update error', error);
      return { ok: false, message: '재요청에 실패했습니다.' };
    }

    // 어드민에게 알림 발송 (fire-and-forget)
    const managerName = (profile?.name as string | null) || '매니저';
    notifyAdminsAction({
      title: '매니저 승인 재요청이 있습니다',
      message: `${managerName}님이 매니저 승인을 재요청하였습니다. 지금 바로 확인해보세요.`,
      link: '/admin',
    }).catch((err) =>
      console.error('[reRequestManagerApprovalAction] Notification error', err),
    );

    return { ok: true, message: '재요청이 접수되었습니다. 승인 대기 목록에 반영됩니다.' };
  } catch (err) {
    console.error('[reRequestManagerApprovalAction] Unexpected error', err);
    return { ok: false, message: '재요청 중 오류가 발생했습니다.' };
  }
}
