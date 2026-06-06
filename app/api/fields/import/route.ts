import { NextResponse } from 'next/server';
import { getSessionOrg, canManageFields } from '@/lib/auth/org';
import { parseImportFile } from '@/lib/parcel-import/parse-file';
import { validateImportParcels } from '@/lib/parcel-import/validate-import';
import { persistImportParcels } from '@/lib/parcel-import/persist';
import { createImportJob, triggerOnboardingBackfill } from '@/lib/import-jobs/enqueue-backfill';
import { runImportEnforcement } from '@/lib/parcel-import/enforce-and-preview';
import { capZoneSplit, getDefaultZoneSplit } from '@/lib/billing/plans';

export async function POST(request: Request) {
  const org = await getSessionOrg();
  if (!org) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!canManageFields(org.role)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === '1';
  const requestedZoneSplit = Number(url.searchParams.get('zoneSplit') ?? 4);
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const { parcels, errors: parseErrors } = await parseImportFile(
    file.name,
    buffer,
    file.type
  );

  const previewZoneSplit =
    org.billingModel === 'hectare'
      ? 1
      : capZoneSplit(
          requestedZoneSplit || getDefaultZoneSplit('zone'),
          org.maxZoneSplit
        );
  const previewDraft = validateImportParcels(parcels, parseErrors, previewZoneSplit);

  const enforcement = await runImportEnforcement({
    org,
    parcels: previewDraft.parcels,
    requestedZoneSplit,
    dryRun,
  });

  if (!enforcement.ok) {
    return NextResponse.json(
      { error: enforcement.message, code: enforcement.code, ...previewDraft },
      { status: enforcement.status }
    );
  }

  const preview = validateImportParcels(
    parcels,
    parseErrors,
    enforcement.effectiveZoneSplit
  );

  const mergedWarnings = [...preview.warnings, ...enforcement.warnings];

  if (dryRun) {
    return NextResponse.json({
      ...preview,
      warnings: mergedWarnings,
      billing: enforcement.billingPreview,
      effectiveZoneSplit: enforcement.effectiveZoneSplit,
    });
  }

  const errorRate =
    preview.errors.length /
    Math.max(1, preview.errors.length + preview.parcels.length);
  if (errorRate > 0.1 && preview.parcels.length === 0) {
    return NextResponse.json(
      { ...preview, error: 'Demasiados errores en el archivo' },
      { status: 422 }
    );
  }

  if (!preview.parcels.length) {
    return NextResponse.json(
      { ...preview, error: 'No hay lotes válidos para importar' },
      { status: 422 }
    );
  }

  const { fieldIds, zoneIds } = await persistImportParcels(
    org.orgId,
    preview.parcels,
    enforcement.effectiveZoneSplit
  );

  const jobId = await createImportJob(org.orgId, zoneIds.length);
  const cronSecret = process.env.CRON_SECRET?.trim();
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ?? 'http://localhost:3000';
  if (cronSecret) {
    void triggerOnboardingBackfill(base, cronSecret, org.orgId);
  }

  return NextResponse.json({
    ok: true,
    fieldIds,
    zoneCount: zoneIds.length,
    importJobId: jobId,
    warnings: mergedWarnings,
    errors: preview.errors,
    billing: enforcement.billingPreview,
  });
}
