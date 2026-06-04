import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getSessionOrg, canManageTeam } from '@/lib/auth/org';
import { dbQuery, dbQueryOne } from '@/lib/db/pool';

export async function POST(request: Request) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageTeam(org.role)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }

  const { email, role } = (await request.json()) as {
    email?: string;
    role?: string;
  };

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  }

  const allowed = ['admin', 'viewer', 'field_worker'];
  const memberRole = allowed.includes(role ?? '') ? role : 'viewer';

  const existing = await dbQueryOne(
    `SELECT id FROM invites WHERE org_id = $1 AND email = $2 AND accepted_at IS NULL`,
    [org.orgId, email.trim().toLowerCase()]
  );
  if (existing) {
    return NextResponse.json({ error: 'Invitación pendiente ya existe' }, { status: 409 });
  }

  const token = randomBytes(24).toString('hex');
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  await dbQuery(
    `INSERT INTO invites (org_id, email, role, token, expires_at) VALUES ($1,$2,$3,$4,$5)`,
    [org.orgId, email.trim().toLowerCase(), memberRole, token, expires.toISOString()]
  );

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ?? 'http://localhost:3000';
  const inviteUrl = `${base}/invite/${token}`;

  return NextResponse.json({ ok: true, token, inviteUrl });
}
