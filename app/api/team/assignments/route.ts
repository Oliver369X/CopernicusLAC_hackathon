import { NextResponse } from 'next/server';
import { getSessionOrg, canManageTeam } from '@/lib/auth/org';
import { dbQuery } from '@/lib/db/pool';

export async function GET() {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageTeam(org.role)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }

  const members = await dbQuery<{
    user_id: string;
    email: string;
    role: string;
  }>(
    `SELECT om.user_id, u.email, om.role
     FROM organization_members om
     JOIN users u ON u.id = om.user_id
     WHERE om.org_id = $1
     ORDER BY om.created_at`,
    [org.orgId]
  );

  const assignments = await dbQuery<{ user_id: string; zone_id: string }>(
    `SELECT user_id, zone_id FROM member_zone_assignments WHERE org_id = $1`,
    [org.orgId]
  );

  const byUser = new Map<string, string[]>();
  for (const a of assignments) {
    const list = byUser.get(a.user_id) ?? [];
    list.push(a.zone_id);
    byUser.set(a.user_id, list);
  }

  return NextResponse.json({
    members: members.map((m) => ({
      userId: m.user_id,
      email: m.email,
      role: m.role,
      zoneIds: byUser.get(m.user_id) ?? [],
    })),
  });
}

export async function PUT(request: Request) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageTeam(org.role)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }

  const { userId, zoneIds } = (await request.json()) as {
    userId?: string;
    zoneIds?: string[];
  };

  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
  }

  const member = await dbQuery(
    `SELECT 1 FROM organization_members WHERE org_id = $1 AND user_id = $2`,
    [org.orgId, userId]
  );
  if (!member.length) {
    return NextResponse.json({ error: 'Usuario no pertenece a la org' }, { status: 404 });
  }

  await dbQuery(
    `DELETE FROM member_zone_assignments WHERE org_id = $1 AND user_id = $2`,
    [org.orgId, userId]
  );

  const ids = (zoneIds ?? []).filter(Boolean);
  for (const zoneId of ids) {
    await dbQuery(
      `INSERT INTO member_zone_assignments (org_id, user_id, zone_id)
       SELECT $1, $2, z.id FROM zones z
       JOIN fields f ON f.id = z.field_id
       WHERE z.id = $3 AND f.org_id = $1
       ON CONFLICT DO NOTHING`,
      [org.orgId, userId, zoneId]
    );
  }

  return NextResponse.json({ ok: true, zoneIds: ids });
}
