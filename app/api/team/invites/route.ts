import { NextResponse } from 'next/server';
import { getSessionOrg, canManageTeam } from '@/lib/auth/org';
import { dbQuery } from '@/lib/db/pool';

export async function GET() {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageTeam(org.role)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ?? 'http://localhost:3000';

  const rows = await dbQuery<{
    id: string;
    email: string;
    role: string;
    token: string;
    expires_at: string;
    created_at: string;
  }>(
    `SELECT id, email, role, token, expires_at, created_at
     FROM invites
     WHERE org_id = $1 AND accepted_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC`,
    [org.orgId]
  );

  const invites = rows.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    expires_at: inv.expires_at,
    created_at: inv.created_at,
    inviteUrl: `${base}/invite/${inv.token}`,
  }));

  return NextResponse.json({ invites });
}
