import { NextResponse } from 'next/server';
import { getSessionOrg, canManageFields } from '@/lib/auth/org';
import { parseImportFile } from '@/lib/parcel-import/parse-file';
import { validateImportParcels } from '@/lib/parcel-import/validate-import';
import { persistImportParcels } from '@/lib/parcel-import/persist';
import { createImportJob, triggerOnboardingBackfill } from '@/lib/import-jobs/enqueue-backfill';
import { getOrgHectareUsage } from '@/lib/billing/usage';
import { validateImportAgainstPlan } from '@/lib/billing/enforce';
import { buildOrgBillingProfile } from '@/lib/billing/profile';
import { estimateMonthlyUsd, usagePercent } from '@/lib/billing/plans';
import type { ImportBillingPreview } from '@/lib/billing/types';

function sumImportHa(parcels: { areaHa: number }[]): number {
  return parcels.reduce((s, p) => s + p.areaHa, 0);
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
  const preview = validateImportParcels(parcels, parseErrors);

  const usage = await getOrgHectareUsage(org.orgId);
  const importHa = sumImportHa(preview.parcels);

  const enforcement = validateImportAgainstPlan({
    billingModel: org.billingModel,
    planTier: org.planTier,
    maxZoneSplit: org.maxZoneSplit,
    currentTotalHa: usage.totalHa,
    importTotalHa: importHa,
    requestedZoneSplit,
    isDryRun: dryRun,
  });

  if (!enforcement.ok) {
    return NextResponse.json(
      { error: enforcement.message, code: enforcement.code, ...preview },
      { status: 422 }
    );
  }

  const effectiveZoneSplit = enforcement.effectiveZoneSplit;
  const projectedTotalHa = usage.totalHa + importHa;
  const billingProfile = buildOrgBillingProfile(
    {
      billing_model: org.billingModel,
      plan_tier: org.planTier,
      hectare_limit: org.hectareLimit,
      max_zone_split: org.maxZoneSplit,
    },
    projectedTotalHa
  );

  const billingPreview: ImportBillingPreview = {
    projectedTotalHa,
    estimatedMonthlyUsd: estimateMonthlyUsd(projectedTotalHa, org.billingModel),
    hectareLimit: billingProfile.hectareLimit,
    usagePercent: usagePercent(projectedTotalHa, billingProfile.hectareLimit),
  };

  const mergedWarnings = [...preview.warnings, ...enforcement.warnings];

  if (dryRun) {
    return NextResponse.json({
      ...preview,
      warnings: mergedWarnings,
      billing: billingPreview,
      effectiveZoneSplit,
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
    effectiveZoneSplit
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
    billing: billingPreview,
  });
}
