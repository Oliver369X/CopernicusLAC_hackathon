import { renderToBuffer } from '@react-pdf/renderer';
import { ReportPdfDocument } from '@/lib/reports/pdf-document';

export async function generateReportPdfBuffer(props: {
  orgName: string;
  fields: Array<{ name: string; crop: string; area: number; riskScore: number }>;
}): Promise<Buffer> {
  const buffer = await renderToBuffer(<ReportPdfDocument {...props} />);
  return Buffer.from(buffer);
}
