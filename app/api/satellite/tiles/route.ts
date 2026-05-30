import { NextResponse } from 'next/server';
import type { GeoBounds } from '@/lib/types/field';
import { fetchLayerImage } from '@/lib/services/copernicus/process';
import {
  S2_NDRE_COLOR_EVALSCRIPT,
  S2_NDVI_COLOR_EVALSCRIPT,
  S2_TRUE_COLOR_EVALSCRIPT,
} from '@/lib/services/copernicus/evalscripts';
import { hasSatelliteCredentials } from '@/lib/services/satellite';

function parseBbox(param: string | null): GeoBounds | null {
  if (!param) return null;
  const parts = param.split(',').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  const [west, south, east, north] = parts;
  return [
    { lat: north, lng: west },
    { lat: north, lng: east },
    { lat: south, lng: east },
    { lat: south, lng: west },
  ];
}

export async function GET(request: Request) {
  if (!hasSatelliteCredentials()) {
    return NextResponse.json({ error: 'Satellite not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const layer = searchParams.get('layer') ?? 'ndvi';
  const width = Math.min(Number(searchParams.get('width') ?? 512), 1024);
  const height = Math.min(Number(searchParams.get('height') ?? 512), 1024);

  const bounds = parseBbox(searchParams.get('bbox'));
  if (!bounds) {
    return NextResponse.json(
      { error: 'Missing or invalid bbox (west,south,east,north)' },
      { status: 400 }
    );
  }

  const evalscript =
    layer === 'truecolor'
      ? S2_TRUE_COLOR_EVALSCRIPT
      : layer === 'ndre'
        ? S2_NDRE_COLOR_EVALSCRIPT
        : S2_NDVI_COLOR_EVALSCRIPT;

  const buffer = await fetchLayerImage(bounds, evalscript, width, height);
  if (!buffer) {
    return NextResponse.json({ error: 'Tile generation failed' }, { status: 502 });
  }

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
