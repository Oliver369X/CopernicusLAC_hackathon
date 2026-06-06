import { NextResponse } from 'next/server';

const TEMPLATE = `name,crop,area_ha,lat,lng,radius_m,planting_date,fecha_siembra
Lote Norte San Julián,soja,120,-16.95,-62.85,250,2024-09-15,
Parcela Este San Ramón,maiz,200,-17.05,-62.55,200,2024-08-20,
`;

export async function GET() {
  return new NextResponse(TEMPLATE, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="doctor-soya-parcelas-template.csv"',
    },
  });
}
