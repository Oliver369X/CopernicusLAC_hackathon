import { renderToBuffer } from '@react-pdf/renderer';
import { DiagnosticPdfDocument } from '@/lib/reports/diagnostic-pdf-document';
import type { SpecialistDiagnosticReport } from '@/lib/diagnostics/types';

export async function generateDiagnosticPdfBuffer(
  report: SpecialistDiagnosticReport
): Promise<Buffer> {
  const buffer = await renderToBuffer(<DiagnosticPdfDocument report={report} />);
  return Buffer.from(buffer);
}
