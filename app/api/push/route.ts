import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db/config';
import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await request.json();

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    },
    { onConflict: 'endpoint' }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  const secret = process.env.INTERNAL_API_SECRET ?? process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { title, body, userId } = (await request.json()) as {
    title: string;
    body: string;
    userId?: string;
  };

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@doctorsoya.app';

  if (!publicKey || !privateKey || !isDatabaseConfigured()) {
    return NextResponse.json({ sent: 0, reason: 'push_not_configured' });
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const { createServiceClient } = await import('@/lib/supabase/server');
  const service = await createServiceClient();

  let query = service.from('push_subscriptions').select('*');
  if (userId) query = query.eq('user_id', userId);

  const { data: subs } = await query;
  let sent = 0;

  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint as string,
          keys: sub.keys as webpush.PushSubscription['keys'],
        },
        JSON.stringify({ title, body })
      );
      sent++;
    } catch {
      // expired subscription — ignore
    }
  }

  return NextResponse.json({ sent });
}
