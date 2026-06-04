import { NextResponse } from 'next/server';
import { getFields, getFieldsForUser } from '@/lib/data/fields';
import { serializeFields } from '@/lib/utils/serialize-field';
import { isDatabaseConfigured } from '@/lib/db/config';
import { getSessionOrg } from '@/lib/auth/org';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      fields: serializeFields(MOCK_FIELDS),
      count: MOCK_FIELDS.length,
      source: 'mock',
    });
  }

  const org = await getSessionOrg();
  const fields = org
    ? await getFieldsForUser(org.user.id, org.orgId)
    : await getFields();

  return NextResponse.json({
    fields: serializeFields(fields),
    count: fields.length,
    source: 'database',
  });
}
