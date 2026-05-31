import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db/config';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_SETTINGS = {
  threshold: { enabled: true, channels: ['in-app'], severity: 'warning', cooldown: 60 },
  predictive: { enabled: true, channels: ['in-app', 'push'], severity: 'warning', cooldown: 120 },
  anomaly: { enabled: true, channels: ['in-app'], severity: 'info', cooldown: 180 },
  disease: { enabled: true, channels: ['in-app', 'push', 'email'], severity: 'critical', cooldown: 30 },
  weather: { enabled: true, channels: ['in-app'], severity: 'warning', cooldown: 60 },
  pest: { enabled: true, channels: ['in-app'], severity: 'info', cooldown: 120 },
};

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      config: DEFAULT_SETTINGS,
      profile: { phone: null, whatsapp_opt_in: false },
    });
  }

  try {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      config: DEFAULT_SETTINGS,
      profile: { phone: null, whatsapp_opt_in: false },
    });
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({
      config: DEFAULT_SETTINGS,
      profile: { phone: null, whatsapp_opt_in: false },
    });
  }

  const { data } = await supabase
    .from('alert_settings')
    .select('config')
    .eq('org_id', membership.org_id)
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('phone, whatsapp_opt_in')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({
    config: data?.config ?? DEFAULT_SETTINGS,
    profile: profile ?? { phone: null, whatsapp_opt_in: false },
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Settings load failed';
    console.error('[alerts/settings GET]', message);
    return NextResponse.json({
      config: DEFAULT_SETTINGS,
      profile: { phone: null, whatsapp_opt_in: false },
    });
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    phone?: string;
    whatsappOptIn?: boolean;
  };

  const { error } = await supabase.from('user_profiles').upsert(
    {
      user_id: user.id,
      phone: body.phone ?? null,
      whatsapp_opt_in: body.whatsappOptIn ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { config } = (await request.json()) as { config: Record<string, unknown> };

  const { data: membership } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  const { error } = await supabase.from('alert_settings').upsert(
    {
      org_id: membership.org_id,
      user_id: user.id,
      config,
    },
    { onConflict: 'org_id,user_id' }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
