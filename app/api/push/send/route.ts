import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
  const VAPID_SUBJECT = process.env.VAPID_SUBJECT!;
  const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET!;

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${INTERNAL_API_SECRET}`) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  const body = await request.json();
  const { userId, title, message, link } = body;

  if (!userId || !title) {
    return NextResponse.json({ error: '필수 파라미터가 없습니다.' }, { status: 400 });
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: subscriptions, error } = await service
    .from('push_subscriptions')
    .select('endpoint, auth, p256dh')
    .eq('user_id', userId);

  if (error) {
    console.error('[push/send] select error', error);
    return NextResponse.json({ error: '구독 조회 실패' }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const payload = JSON.stringify({ title, message, link });
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } },
        payload,
      ),
    ),
  );

  // 만료된 구독(410 Gone) 삭제
  const endpointsToDelete = results
    .map((r, i) => {
      if (r.status === 'rejected') {
        const err = r.reason as { statusCode?: number };
        if (err?.statusCode === 410) return subscriptions[i].endpoint;
      }
      return null;
    })
    .filter(Boolean) as string[];

  if (endpointsToDelete.length > 0) {
    await service
      .from('push_subscriptions')
      .delete()
      .in('endpoint', endpointsToDelete);
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return NextResponse.json({ ok: true, sent });
}
