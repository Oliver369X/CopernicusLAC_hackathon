import { NextResponse } from 'next/server';
import type { Polygon } from 'geojson';
import { getFields, getFieldsForUser } from '@/lib/data/fields';
import { serializeFields } from '@/lib/utils/serialize-field';
import { isDatabaseConfigured } from '@/lib/db/config';
import { getSessionOrg, canManageFields } from '@/lib/auth/org';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';
import { createImportParcelFromPolygon } from '@/lib/parcel-import/create-from-polygon';
import { runImportEnforcement } from '@/lib/parcel-import/enforce-and-preview';
import { persistImportParcels } from '@/lib/parcel-import/persist';
import { createImportJob, triggerOnboardingBackfill } from '@/lib/import-jobs/enqueue-backfill';
import { getDefaultZoneSplit } from '@/lib/billing/plans';
import { isScienceCrop } from '@/lib/science/crops/registry';
import type { CropType } from '@/lib/mock-data/crops';

const SCIENCE_CROPS = new Set(['soybean', 'wheat', 'corn']);

interface CreateFieldBody {
  name?: string;
  crop_type?: string;
  bounds?: Polygon;
  planting_date?: string;
  location_label?: string;
  dry_run?: boolean;
  zone_split?: number;
}

function parseCrop(value: string | undefined): CropType | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'soja') return 'soybean';
  if (normalized === 'trigo') return 'wheat';
  if (normalized === 'maiz' || normalized === 'maíz') return 'corn';
  if (isScienceCrop(normalized) || SCIENCE_CROPS.has(normalized)) {
    return normalized as CropType;
  }
  return null;
}

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

export async function POST(request: Request) {
  const org = await getSessionOrg();
  if (!org) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!canManageFields(org.role)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }

  const url = new URL(request.url);
  const dryRunQuery = url.searchParams.get('dryRun') === '1';

  let body: CreateFieldBody;
  try {
    body = (await request.json()) as CreateFieldBody;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const dryRun = dryRunQuery || body.dry_run === true;
  const crop = parseCrop(body.crop_type);
  if (!crop) {
    return NextResponse.json(
      { error: 'cultivo inválido; use soybean, wheat o corn' },
      { status: 400 }
    );
  }

  if (!body.bounds || body.bounds.type !== 'Polygon') {
    return NextResponse.json({ error: 'bounds debe ser un GeoJSON Polygon' }, { status: 400 });
  }

  const parcelResult = createImportParcelFromPolygon({
    name: body.name ?? '',
    crop,
    bounds: body.bounds,
    plantingDate: body.planting_date,
    locationLabel: body.location_label,
  });

  if ('error' in parcelResult) {
    return NextResponse.json(
      { error: parcelResult.error.message, code: parcelResult.error.code },
      { status: 400 }
    );
  }

  const defaultSplit =
    org.billingModel === 'zone' ? getDefaultZoneSplit('zone') : 1;
  const requestedZoneSplit = body.zone_split ?? defaultSplit;

  const enforcement = await runImportEnforcement({
    org,
    parcels: [parcelResult.parcel],
    requestedZoneSplit,
    dryRun,
  });

  if (!enforcement.ok) {
    return NextResponse.json(
      { error: enforcement.message, code: enforcement.code },
      { status: enforcement.status }
    );
  }

  const zoneCount = parcelResult.parcel.zoneName ? 1 : enforcement.effectiveZoneSplit;

  if (dryRun) {
    return NextResponse.json({
      preview: {
        name: parcelResult.parcel.name,
        crop: parcelResult.parcel.crop,
        areaHa: parcelResult.parcel.areaHa,
        zoneCount,
      },
      billing: enforcement.billingPreview,
      effectiveZoneSplit: enforcement.effectiveZoneSplit,
      warnings: enforcement.warnings,
      errors: [],
    });
  }

  const { fieldIds, zoneIds } = await persistImportParcels(
    org.orgId,
    [parcelResult.parcel],
    enforcement.effectiveZoneSplit
  );

  const jobId = await createImportJob(org.orgId, zoneIds.length);
  const cronSecret = process.env.CRON_SECRET?.trim();
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? 'http://localhost:3000';
  if (cronSecret) {
    void triggerOnboardingBackfill(base, cronSecret, org.orgId);
  }

  return NextResponse.json({
    ok: true,
    fieldId: fieldIds[0],
    zoneIds,
    zoneCount: zoneIds.length,
    importJobId: jobId,
    billing: enforcement.billingPreview,
    warnings: enforcement.warnings,
  });
}
