import { NextResponse } from 'next/server';
import { getSessionOrg } from '@/lib/auth/org';
import { countFieldsForOrg } from '@/lib/data/fields';
import { dbQueryOne } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ fieldCount: 0, onboardingComplete: false });
  }

  const org = await getSessionOrg();
  if (!org) {
    return NextResponse.json({ fieldCount: 0, onboardingComplete: false });
  }

  const fieldCount = await countFieldsForOrg(org.orgId);
  const orgRow = await dbQueryOne<{ onboarding_completed_at: string | null }>(
    `SELECT onboarding_completed_at FROM organizations WHERE id = $1`,
    [org.orgId]
  );

  return NextResponse.json({
    fieldCount,
    onboardingComplete:
      Boolean(orgRow?.onboarding_completed_at) || fieldCount > 0,
    orgId: org.orgId,
    role: org.role,
  });
}
