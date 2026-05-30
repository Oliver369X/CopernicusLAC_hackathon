import { NextResponse } from 'next/server';
import { getDbService } from '@/lib/db/get-service';
import { runValidationStudy, getLatestValidationRun } from '@/lib/science/validation/run-study';
import { metricsSummaryForUi } from '@/lib/science/validation/metrics';
import { isScienceCrop } from '@/lib/science/crops/registry';
import type { ScienceCropId } from '@/lib/science/types';

async function getService() {
  return getDbService();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const crop = searchParams.get('crop') ?? 'soybean';
  const run = searchParams.get('run') === 'true';

  if (!isScienceCrop(crop)) {
    return NextResponse.json({ error: 'Invalid crop' }, { status: 400 });
  }

  const service = await getService();
  if (!service) {
    return NextResponse.json({
      metrics: null,
      summary: null,
      message: 'Supabase not configured',
    });
  }

  if (run) {
    const result = await runValidationStudy(service, crop as ScienceCropId);
    return NextResponse.json({
      runId: result.runId,
      metrics: result.metrics,
      summary: metricsSummaryForUi(result.metrics),
    });
  }

  const latest = await getLatestValidationRun(service, crop as ScienceCropId);
  if (!latest) {
    return NextResponse.json({ metrics: null, summary: null });
  }

  return NextResponse.json({
    runId: latest.id,
    runAt: latest.run_at,
    metrics: latest.metrics,
    summary: metricsSummaryForUi(latest.metrics),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { crop?: string };
  const crop = body.crop ?? 'soybean';

  if (!isScienceCrop(crop)) {
    return NextResponse.json({ error: 'Invalid crop' }, { status: 400 });
  }

  const service = await getService();
  if (!service) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const result = await runValidationStudy(service, crop as ScienceCropId);
  return NextResponse.json({
    runId: result.runId,
    metrics: result.metrics,
    summary: metricsSummaryForUi(result.metrics),
  });
}
