import { NextResponse } from 'next/server';
import { getSessionOrg, canManageFields } from '@/lib/auth/org';
import { dbQuery, dbQueryOne } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageFields(org.role)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'DB no configurada' }, { status: 503 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    name?: string;
    crop_type?: string;
    planting_date?: string;
  };

  const owned = await dbQueryOne(
    `SELECT id FROM fields WHERE id = $1 AND org_id = $2`,
    [id, org.orgId]
  );
  if (!owned) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  await dbQuery(
    `UPDATE fields SET
      name = COALESCE($3, name),
      crop_type = COALESCE($4, crop_type),
      planting_date = COALESCE($5, planting_date)
     WHERE id = $1 AND org_id = $2`,
    [id, org.orgId, body.name ?? null, body.crop_type ?? null, body.planting_date ?? null]
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageFields(org.role)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }

  const { id } = await context.params;
  const result = await dbQuery(
    `DELETE FROM fields WHERE id = $1 AND org_id = $2 RETURNING id`,
    [id, org.orgId]
  );

  if (!result.length) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
