import { NextResponse } from 'next/server';

const TEMPLATE = `name,crop,area_ha,lat,lng,radius_m,planting_date,fecha_siembra
Lote Norte,soja,120,-34.90,-62.30,250,2024-09-15,
Lote Sur,maiz,85,-35.10,-62.25,200,2024-08-01,
`;

export async function GET() {
  return new NextResponse(TEMPLATE, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="doctor-soya-parcelas-template.csv"',
    },
  });
}
