'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

async function sendPushToUser(
  userId: string,
  payload: { title: string; message: string; link?: string },
) {
  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  await fetch(`${baseUrl}/api/push/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
    },
    body: JSON.stringify({ userId, ...payload }),
  });
}

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

export type NotificationType =
  | 'application_accepted'
  | 'application_rejected'
  | 'new_application'
  | 'schedule_reminder'
  | 'system'
  | 'event_briefing';

export type Notification = {
  notification_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

// 알림 생성 유틸리티 함수 (다른 액션에서 호출 가능)
export async function createNotificationAction(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('notifications').insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link || null,
      is_read: false,
    });

    if (error) {
      console.error('[createNotificationAction] Insert error', error);
      return { ok: false, message: '알림 생성에 실패했습니다.' };
    }

    // 비동기 fire-and-forget (푸시 실패해도 인앱 알림은 저장됨)
    sendPushToUser(data.userId, {
      title: data.title,
      message: data.message,
      link: data.link,
    }).catch((err) => console.error('[createNotificationAction] Push error', err));

    return { ok: true, message: '알림이 생성되었습니다.' };
  } catch (err) {
    console.error('[createNotificationAction] Unexpected error', err);
    return { ok: false, message: '알림 생성 중 오류가 발생했습니다.' };
  }
}

// 여러 사용자에게 알림 일괄 생성
export async function createBulkNotificationsAction(
  notifications: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }>
): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient();

    const insertData = notifications.map((n) => ({
      user_id: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link || null,
      is_read: false,
    }));

    const { error } = await supabase.from('notifications').insert(insertData);

    if (error) {
      console.error('[createBulkNotificationsAction] Insert error', error);
      return { ok: false, message: '알림 일괄 생성에 실패했습니다.', data: 0 };
    }

    // 각 사용자에게 웹 푸시 (fire-and-forget)
    Promise.all(
      notifications.map((n) =>
        sendPushToUser(n.userId, { title: n.title, message: n.message, link: n.link }).catch(
          (err) => console.error('[createBulkNotificationsAction] Push error', err),
        ),
      ),
    ).catch(() => {});

    return { ok: true, message: `${notifications.length}개의 알림이 생성되었습니다.`, data: notifications.length };
  } catch (err) {
    console.error('[createBulkNotificationsAction] Unexpected error', err);
    return { ok: false, message: '알림 일괄 생성 중 오류가 발생했습니다.', data: 0 };
  }
}

// 시스템 공지사항 전체 발송 (관리자 전용)
export async function sendSystemNotificationAction(data: {
  title: string;
  message: string;
  link?: string;
  targetRole?: 'all' | 'member' | 'manager' | 'admin';
}): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: 0 };
    }

    // 관리자 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return { ok: false, message: '관리자만 시스템 공지를 발송할 수 있습니다.', data: 0 };
    }

    // 대상 사용자 조회
    let query = supabase.from('profiles').select('user_id');

    if (data.targetRole && data.targetRole !== 'all') {
      query = query.eq('role', data.targetRole);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error('[sendSystemNotificationAction] Users select error', usersError);
      return { ok: false, message: '사용자 목록 조회에 실패했습니다.', data: 0 };
    }

    if (!users || users.length === 0) {
      return { ok: false, message: '알림을 받을 사용자가 없습니다.', data: 0 };
    }

    // 알림 일괄 생성
    const notifications = users.map((user) => ({
      userId: user.user_id,
      type: 'system' as NotificationType,
      title: data.title,
      message: data.message,
      link: data.link,
    }));

    return await createBulkNotificationsAction(notifications);
  } catch (err) {
    console.error('[sendSystemNotificationAction] Unexpected error', err);
    return { ok: false, message: '시스템 공지 발송 중 오류가 발생했습니다.', data: 0 };
  }
}

// 알림 목록 조회
export async function getNotificationsAction(
  page = 0,
  limit = 20,
): Promise<ActionResult<Notification[]>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: [] };
    }

    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[getNotificationsAction] Select error', error);
      return { ok: false, message: '알림을 불러오는데 실패했습니다.', data: [] };
    }

    return { ok: true, message: '', data: data || [] };
  } catch (err) {
    console.error('[getNotificationsAction] Unexpected error', err);
    return { ok: false, message: '알림을 불러오는 중 오류가 발생했습니다.', data: [] };
  }
}

// 읽지 않은 알림 개수 조회
export async function getUnreadNotificationCountAction(): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.', data: 0 };
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)
      .eq('is_read', false);

    if (error) {
      console.error('[getUnreadNotificationCountAction] Count error', error);
      return { ok: false, message: '읽지 않은 알림 개수를 가져오는데 실패했습니다.', data: 0 };
    }

    return { ok: true, message: '', data: count || 0 };
  } catch (err) {
    console.error('[getUnreadNotificationCountAction] Unexpected error', err);
    return { ok: false, message: '읽지 않은 알림 개수를 가져오는 중 오류가 발생했습니다.', data: 0 };
  }
}

// 알림 읽음 처리
export async function markNotificationAsReadAction(notificationId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('notification_id', notificationId)
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('[markNotificationAsReadAction] Update error', error);
      return { ok: false, message: '알림 읽음 처리에 실패했습니다.' };
    }

    return { ok: true, message: '알림을 읽음 처리했습니다.' };
  } catch (err) {
    console.error('[markNotificationAsReadAction] Unexpected error', err);
    return { ok: false, message: '알림 읽음 처리 중 오류가 발생했습니다.' };
  }
}

// 모든 알림 읽음 처리
export async function markAllNotificationsAsReadAction(): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userData.user.id)
      .eq('is_read', false);

    if (error) {
      console.error('[markAllNotificationsAsReadAction] Update error', error);
      return { ok: false, message: '모든 알림 읽음 처리에 실패했습니다.' };
    }

    return { ok: true, message: '모든 알림을 읽음 처리했습니다.' };
  } catch (err) {
    console.error('[markAllNotificationsAsReadAction] Unexpected error', err);
    return { ok: false, message: '모든 알림 읽음 처리 중 오류가 발생했습니다.' };
  }
}

// 모든 어드민에게 알림 발송 공통 유틸 (service role 사용 - RLS 우회)
export async function notifyAdminsAction(payload: {
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  try {
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: admins } = await serviceClient
      .from('profiles')
      .select('user_id')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) return;

    await serviceClient.from('notifications').insert(
      admins.map((admin) => ({
        user_id: admin.user_id,
        type: 'system',
        title: payload.title,
        message: payload.message,
        link: payload.link ?? null,
        is_read: false,
      })),
    );

    // 웹 푸시 (fire-and-forget)
    Promise.all(
      admins.map((admin) =>
        sendPushToUser(admin.user_id, {
          title: payload.title,
          message: payload.message,
          link: payload.link,
        }).catch((err) =>
          console.error('[notifyAdminsAction] Push error', err),
        ),
      ),
    ).catch(() => {});
  } catch (err) {
    console.error('[notifyAdminsAction] Error', err);
  }
}

// 신규 가입 시 모든 어드민에게 알림 발송
export async function notifyAdminsNewUserAction(data: {
  userName: string;
  userRole: 'member' | 'pending_manager';
}): Promise<void> {
  const roleLabel =
    data.userRole === 'pending_manager' ? '매니저 (승인 대기)' : '스탭 (멤버)';
  await notifyAdminsAction({
    title: '새 회원이 가입했습니다',
    message: `${data.userName}님이 ${roleLabel}으로 가입하였습니다.`,
    link: '/admin',
  });
}

// 알림 삭제
export async function deleteNotificationAction(notificationId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('notification_id', notificationId)
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('[deleteNotificationAction] Delete error', error);
      return { ok: false, message: '알림 삭제에 실패했습니다.' };
    }

    return { ok: true, message: '알림이 삭제되었습니다.' };
  } catch (err) {
    console.error('[deleteNotificationAction] Unexpected error', err);
    return { ok: false, message: '알림 삭제 중 오류가 발생했습니다.' };
  }
}
