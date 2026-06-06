import { NextResponse } from 'next/server';

const TEMPLATE = `name,crop,area_ha,lat,lng,radius_m,planting_date,fecha_siembra
Chacra Norte,soybean,8,-16.97,-62.83,120,2024-10-05,
Parcela Maíz,corn,6,-16.93,-62.87,100,2024-09-20,
Huerta Trigo,wheat,5,-16.99,-62.81,90,2024-04-15,
`;

export async function GET() {
  return new NextResponse(TEMPLATE, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="doctor-soya-parcelas-template.csv"',
    },
  });
}
