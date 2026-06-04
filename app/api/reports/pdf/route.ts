import { NextResponse } from 'next/server';
import { getSessionOrg } from '@/lib/auth/org';
import { getFieldsForUser } from '@/lib/data/fields';
import { generateReportPdfBuffer } from '@/lib/reports/generate-pdf';

export async function GET() {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const fields = await getFieldsForUser(org.user.id, org.orgId);
  const buffer = await generateReportPdfBuffer({
    orgName: 'Mi Finca',
    fields: fields.map((f) => ({
      name: f.name,
      crop: f.crop,
      area: f.area,
      riskScore: f.riskScore,
    })),
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="doctor-soya-informe.pdf"',
    },
  });
}
