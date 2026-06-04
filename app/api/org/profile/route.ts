import { NextResponse } from 'next/server';
import { getSessionOrg, canManageFields } from '@/lib/auth/org';
import { dbQuery } from '@/lib/db/pool';

export async function PATCH(request: Request) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageFields(org.role)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }

  const { name, country, areaUnit } = (await request.json()) as {
    name?: string;
    country?: string;
    areaUnit?: string;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
  }

  await dbQuery(
    `UPDATE organizations SET name = $2, country = COALESCE($3, country),
      area_unit = COALESCE($4, area_unit) WHERE id = $1`,
    [org.orgId, name.trim(), country ?? null, areaUnit ?? null]
  );

  return NextResponse.json({ ok: true });
}
