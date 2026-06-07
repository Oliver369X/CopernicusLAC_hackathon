import { NextRequest, NextResponse } from 'next/server';
import { buildGeodataLabPayload } from '@/lib/integrations/geodata/lab-payload';
import type { GeodataLabPayload } from '@/lib/integrations/geodata/types';

export async function GET(req: NextRequest): Promise<NextResponse<GeodataLabPayload>> {
  const fieldId = req.nextUrl.searchParams.get('fieldId') ?? '';
  if (!fieldId) {
    return NextResponse.json({ enabled: false, fieldId: '' }, { status: 400 });
  }

  return NextResponse.json(await buildGeodataLabPayload(fieldId));
}
