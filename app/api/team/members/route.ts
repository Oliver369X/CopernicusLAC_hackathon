import { NextResponse } from 'next/server';
import { getSessionOrg } from '@/lib/auth/org';
import { dbQuery } from '@/lib/db/pool';

export async function GET() {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const members = await dbQuery<{
    user_id: string;
    email: string;
    role: string;
  }>(
    `SELECT om.user_id, u.email, om.role
     FROM organization_members om
     JOIN users u ON u.id = om.user_id
     WHERE om.org_id = $1`,
    [org.orgId]
  );

  return NextResponse.json({ members });
}
