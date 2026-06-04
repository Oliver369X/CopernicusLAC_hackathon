import { NextResponse } from 'next/server';

import { APP_SLUG } from '@/lib/constants/app-brand';

export async function GET() {
  return NextResponse.json({ ok: true, service: APP_SLUG });
}
