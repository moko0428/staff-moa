import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import db from '@/app/db';
import { pushSubscriptions } from '@/app/(features)/(protected)/notification/push-schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.auth || !keys?.p256dh) {
    return NextResponse.json(
      { error: '구독 정보가 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  await db
    .insert(pushSubscriptions)
    .values({
      userId: user.id,
      endpoint,
      auth: keys.auth,
      p256dh: keys.p256dh,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId: user.id,
        auth: keys.auth,
        p256dh: keys.p256dh,
      },
    });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json();
  const { endpoint } = body;

  if (!endpoint) {
    return NextResponse.json(
      { error: 'endpoint가 필요합니다.' },
      { status: 400 },
    );
  }

  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));

  return NextResponse.json({ ok: true });
}
