import type { GeoBounds } from '@/lib/types/field';
import { generateBoundsFromCenter } from '@/lib/types/field';
import type { ImportParcel, ImportError } from './types';
import { normalizeCropOrDefault } from './normalize-crop';

function parseWktPolygon(wkt: string): GeoBounds | null {
  const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/i);
  if (!m) return null;
  const pairs = m[1].split(',').map((s) => {
    const [lng, lat] = s.trim().split(/\s+/).map(Number);
    return { lat, lng };
  });
  if (pairs.length < 4) return null;
  return pairs as GeoBounds;
}

export function parseParcelCsv(text: string): {
  parcels: ImportParcel[];
  errors: ImportError[];
} {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return {
      parcels: [],
      errors: [{ code: 'PARSE_ERROR', message: 'CSV vacío o sin encabezados' }],
    };
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name);

  const parcels: ImportParcel[] = [];
  const errors: ImportError[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    const row = i + 1;
    const name = cols[idx('name')] ?? cols[idx('nombre')] ?? `Lote ${row}`;
    const crop = normalizeCropOrDefault(cols[idx('crop')] ?? cols[idx('cultivo')]);
    const wkt = cols[idx('wkt')] ?? cols[idx('geometry')];
    const lat = Number(cols[idx('lat')] ?? cols[idx('latitude')]);
    const lng = Number(cols[idx('lng')] ?? cols[idx('longitude')]);
    const radius = Number(cols[idx('radius_m')] ?? 200);

    let bounds: GeoBounds | null = null;
    if (wkt) bounds = parseWktPolygon(wkt);
    else if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const size = (radius / 111000) * 2;
      bounds = generateBoundsFromCenter({ lat, lng }, size);
    }

    if (!bounds) {
      errors.push({
        code: 'INVALID_GEOMETRY',
        row,
        message: `${name}: falta WKT o lat/lng`,
      });
      continue;
    }

    const areaHa = Number(cols[idx('area_ha')] ?? cols[idx('area')] ?? 1);
    parcels.push({
      name,
      crop,
      areaHa: Number.isFinite(areaHa) ? areaHa : 1,
      plantingDate: cols[idx('planting_date')] ?? cols[idx('fecha_siembra')],
      bounds,
      center: { lat, lng: lng || bounds[0].lng },
    });
  }

  return { parcels, errors };
}
