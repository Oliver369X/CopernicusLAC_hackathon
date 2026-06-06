import { NextResponse } from 'next/server';
import { getSessionOrg } from '@/lib/auth/org';
import { getFields, getFieldsForUser } from '@/lib/data/fields';
import { generateReportPdfBuffer } from '@/lib/reports/generate-pdf';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';
import { dbQueryOne } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';

export async function GET() {
  try {
    const org = await getSessionOrg();
    let fields = MOCK_FIELDS;
    let orgName = 'Aura Agro — informe demo';

    if (org) {
      fields = await getFieldsForUser(org.user.id, org.orgId);
      if (!fields.length) {
        fields = await getFields(org.orgId);
      }
      if (isDatabaseConfigured()) {
        const orgRow = await dbQueryOne<{ name: string }>(
          `SELECT name FROM organizations WHERE id = $1`,
          [org.orgId]
        );
        orgName = orgRow?.name ?? 'Mi Finca';
      }
    } else if (isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Iniciá sesión para descargar el informe PDF' },
        { status: 401 }
      );
    }

    if (!fields.length) {
      return NextResponse.json(
        { error: 'No hay parcelas para incluir en el informe' },
        { status: 422 }
      );
    }

    const buffer = await generateReportPdfBuffer({
      orgName,
      fields: fields.map((f) => ({
        name: f.name,
        crop: f.crop ?? '—',
        area: f.area,
        riskScore: f.riskScore,
      })),
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="aura-informe.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al generar PDF';
    console.error('[reports/pdf]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
