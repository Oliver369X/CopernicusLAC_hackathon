import { CDSE_BASE } from './client';

export function getWmsBaseUrl(): string | null {
  const instanceId = process.env.COPERNICUS_INSTANCE_ID;
  if (!instanceId) return null;
  return `${CDSE_BASE}/ogc/wms/${instanceId}`;
}

export function buildWmsGetMapUrl(params: {
  bbox: [number, number, number, number];
  width: number;
  height: number;
  layers: string;
  time?: string;
}): string | null {
  const base = getWmsBaseUrl();
  if (!base) return null;

  const [minX, minY, maxX, maxY] = params.bbox;
  const url = new URL(base);
  url.searchParams.set('SERVICE', 'WMS');
  url.searchParams.set('REQUEST', 'GetMap');
  url.searchParams.set('VERSION', '1.3.0');
  url.searchParams.set('LAYERS', params.layers);
  url.searchParams.set('CRS', 'EPSG:4326');
  url.searchParams.set('BBOX', `${minY},${minX},${maxY},${maxX}`);
  url.searchParams.set('WIDTH', String(params.width));
  url.searchParams.set('HEIGHT', String(params.height));
  url.searchParams.set('FORMAT', 'image/png');
  if (params.time) url.searchParams.set('TIME', params.time);
  return url.toString();
}
