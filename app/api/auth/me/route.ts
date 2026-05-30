import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isDatabaseConfigured } from '@/lib/db/config';

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ user: null });
  }
  const user = await getSessionUser();
  return NextResponse.json({ user });
}
