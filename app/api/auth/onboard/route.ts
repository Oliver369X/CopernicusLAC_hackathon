import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { seedFieldsForOrg } from '@/lib/data/fields';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orgName } = (await request.json()) as { orgName?: string };

  const service = await createServiceClient();
  const { data: existing } = await service
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ orgId: existing.org_id });
  }

  const { data: org, error: orgError } = await service
    .from('organizations')
    .insert({ name: orgName ?? 'Mi Finca' })
    .select()
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: orgError?.message }, { status: 500 });
  }

  await service.from('organization_members').insert({
    org_id: org.id,
    user_id: user.id,
    role: 'owner',
  });

  await seedFieldsForOrg(org.id as string);

  return NextResponse.json({ orgId: org.id });
}
