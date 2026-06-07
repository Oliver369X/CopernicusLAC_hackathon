import { NextRequest, NextResponse } from 'next/server';
import {
  getParcelIntelligence,
  getParcelSeries,
  getRegionIntelligence,
} from '@/lib/integrations/geodata/client';
import {
  DEMO_PERSONAS,
  getDemoScenario,
} from '@/lib/integrations/geodata/demo-scenarios';
import { isGeodataEnabled } from '@/lib/integrations/geodata/registry';
import { resolveFieldGeodataLink } from '@/lib/integrations/geodata/resolve-parcel-key';
import type { GeodataLabPayload } from '@/lib/integrations/geodata/types';

export async function GET(req: NextRequest): Promise<NextResponse<GeodataLabPayload>> {
  const fieldId = req.nextUrl.searchParams.get('fieldId') ?? '';
  if (!fieldId) {
    return NextResponse.json({ enabled: false, fieldId: '' }, { status: 400 });
  }

  if (!isGeodataEnabled()) {
    return NextResponse.json({ enabled: false, fieldId });
  }

  const scenario = getDemoScenario(fieldId);
  const link = await resolveFieldGeodataLink(fieldId);
  const parcelKey = link?.parcelKey;
  const regionCode = link?.regionCode ?? 'SC-BO';

  const [intelligence, series, region] = await Promise.all([
    parcelKey ? getParcelIntelligence(parcelKey, true) : Promise.resolve(null),
    parcelKey ? getParcelSeries(parcelKey, 365, 'optical') : Promise.resolve(null),
    getRegionIntelligence(regionCode),
  ]);

  const persona = scenario?.persona;

  return NextResponse.json({
    enabled: true,
    fieldId,
    parcelKey,
    persona,
    personaLabel: persona ? DEMO_PERSONAS[persona].label : undefined,
    highlight: scenario?.highlight,
    intelligence,
    series,
    region,
  });
}
