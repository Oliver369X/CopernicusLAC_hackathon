import { NextRequest, NextResponse } from 'next/server';
import { getDemoTourLinks } from '@/lib/integrations/geodata/demo-scenarios';
import { buildGeodataLabPayload } from '@/lib/integrations/geodata/lab-payload';
import { isGeodataEnabled } from '@/lib/integrations/geodata/registry';
import type { GeodataLabComparePayload } from '@/lib/integrations/geodata/types';
import type { ScienceCropId } from '@/lib/science/types';

const VALID_CROPS: ScienceCropId[] = ['soybean', 'corn', 'wheat'];

export async function GET(req: NextRequest): Promise<NextResponse<GeodataLabComparePayload>> {
  const crop = (req.nextUrl.searchParams.get('crop') ?? 'soybean') as ScienceCropId;

  if (!VALID_CROPS.includes(crop)) {
    return NextResponse.json(
      { enabled: false, crop: 'soybean', cooperative: { enabled: false, fieldId: '' }, smallholder: { enabled: false, fieldId: '' } },
      { status: 400 }
    );
  }

  if (!isGeodataEnabled()) {
    return NextResponse.json({
      enabled: false,
      crop,
      cooperative: { enabled: false, fieldId: '' },
      smallholder: { enabled: false, fieldId: '' },
    });
  }

  const tour = getDemoTourLinks(crop);
  const coopFieldId = tour.cooperative.split('field=')[1]?.split('&')[0] ?? 'field-sj-norte';
  const smallFieldId = tour.smallholder.split('field=')[1]?.split('&')[0] ?? 'field-pf-soja';

  const [cooperative, smallholder] = await Promise.all([
    buildGeodataLabPayload(coopFieldId),
    buildGeodataLabPayload(smallFieldId),
  ]);

  return NextResponse.json({
    enabled: true,
    crop,
    cooperative,
    smallholder,
  });
}
