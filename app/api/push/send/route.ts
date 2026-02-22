import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import db from '@/app/db';
import { pushSubscriptions } from '@/app/(features)/(protected)/notification/push-schema';
import { eq } from 'drizzle-orm';

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
    return NextResponse.json(
      { error: '필수 파라미터가 없습니다.' },
      { status: 400 },
    );
  }

  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (subscriptions.length === 0) {
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
  const endpointsToDelete: string[] = [];
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const err = result.reason as { statusCode?: number };
      if (err?.statusCode === 410) {
        endpointsToDelete.push(subscriptions[index].endpoint);
      }
    }
  });

  await Promise.all(
    endpointsToDelete.map((endpoint) =>
      db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint)),
    ),
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return NextResponse.json({ ok: true, sent });
}
