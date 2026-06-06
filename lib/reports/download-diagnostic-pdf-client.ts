import type { SpecialistDiagnosticReport } from '@/lib/diagnostics/types';

export async function downloadDiagnosticPdf(
  report: SpecialistDiagnosticReport
): Promise<void> {
  const res = await fetch('/api/diagnostics/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(report),
  });

  const contentType = res.headers.get('Content-Type') ?? '';

  if (!res.ok || !contentType.includes('application/pdf')) {
    let message = 'No se pudo generar el informe PDF';
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // respuesta no JSON
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const slug = report.fieldName.replace(/\s+/g, '-').toLowerCase().slice(0, 24);
  const date = new Date(report.generatedAt).toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `aura-diagnostico-${slug}-${date}.pdf`;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
