import { NextResponse } from 'next/server';
import type { SpecialistDiagnosticReport } from '@/lib/diagnostics/types';
import { generateDiagnosticPdfBuffer } from '@/lib/reports/generate-diagnostic-pdf';

export async function POST(request: Request) {
  try {
    const report = (await request.json()) as SpecialistDiagnosticReport;

    if (!report?.reportId || !report.executiveSummary) {
      return NextResponse.json(
        { error: 'Informe de diagnóstico incompleto' },
        { status: 422 }
      );
    }

    const buffer = await generateDiagnosticPdfBuffer(report);
    const slug = (report.fieldName ?? 'campo').replace(/\s+/g, '-').toLowerCase().slice(0, 24);
    const date = new Date(report.generatedAt).toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="aura-diagnostico-${slug}-${date}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al generar PDF';
    console.error('[diagnostics/pdf]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
