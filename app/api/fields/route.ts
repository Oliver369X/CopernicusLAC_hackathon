import { NextResponse } from 'next/server';
import { getFields } from '@/lib/data/fields';
import { serializeFields } from '@/lib/utils/serialize-field';

import { isDatabaseConfigured } from '@/lib/db/config';

export async function GET() {
  const fields = await getFields();
  return NextResponse.json({
    fields: serializeFields(fields),
    count: fields.length,
    source: isDatabaseConfigured() ? 'database' : 'mock',
  });
}
