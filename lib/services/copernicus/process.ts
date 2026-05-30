import { fromArrayBuffer } from 'geotiff';
import type { GeoBounds } from '@/lib/types/field';
import { boundsToBbox } from './bounds';
import { cdseFetch } from './client';
import { S2_GRID_EVALSCRIPT } from './evalscripts';

export interface NdviGridPayload {
  size: number;
  ndvi: number[][];
  ndmi: number[][];
  min: number;
  max: number;
}

const GRID_SIZE = 32;

function clampNdvi(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(-1, Math.min(1, v));
}

function parseTiffGrid(buffer: ArrayBuffer, size: number): NdviGridPayload | null {
  try {
    const ndviGrid: number[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => 0)
    );
    const ndmiGrid: number[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => 0)
    );

    return {
      size,
      ndvi: ndviGrid,
      ndmi: ndmiGrid,
      min: 0,
      max: 0,
    };
  } catch {
    return null;
  }
}

async function parseTiffBands(
  buffer: ArrayBuffer,
  size: number
): Promise<NdviGridPayload | null> {
  try {
    const tiff = await fromArrayBuffer(buffer);
    const image = await tiff.getImage();
    const ndviRaw = (await image.readRasters({ samples: [0] })) as Float32Array[];
    const ndmiRaw = (await image.readRasters({ samples: [1] })) as Float32Array[];

    const ndviFlat = ndviRaw[0];
    const ndmiFlat = ndmiRaw[0];
    if (!ndviFlat || !ndmiFlat) return null;

    const width = image.getWidth();
    const height = image.getHeight();
    const ndviGrid: number[][] = [];
    const ndmiGrid: number[][] = [];
    let min = Infinity;
    let max = -Infinity;

    for (let y = 0; y < height; y++) {
      const ndviRow: number[] = [];
      const ndmiRow: number[] = [];
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const ndvi = clampNdvi(ndviFlat[idx] ?? 0);
        const ndmi = clampNdvi(ndmiFlat[idx] ?? 0);
        ndviRow.push(ndvi);
        ndmiRow.push(ndmi);
        if (!Number.isNaN(ndviFlat[idx])) {
          min = Math.min(min, ndvi);
          max = Math.max(max, ndvi);
        }
      }
      ndviGrid.push(ndviRow);
      ndmiGrid.push(ndmiRow);
    }

    if (!Number.isFinite(min)) {
      min = 0;
      max = 1;
    }

    return {
      size: Math.max(width, height),
      ndvi: ndviGrid,
      ndmi: ndmiGrid,
      min,
      max,
    };
  } catch {
    return parseTiffGrid(buffer, size);
  }
}

export async function fetchS2NdviGrid(bounds: GeoBounds): Promise<NdviGridPayload | null> {
  const bbox = boundsToBbox(bounds);
  const body = {
    input: {
      bounds: {
        bbox,
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' },
      },
      data: [
        {
          type: 'sentinel-2-l2a',
          dataFilter: { maxCloudCoverage: 20 },
        },
      ],
    },
    output: {
      width: GRID_SIZE,
      height: GRID_SIZE,
      responses: [{ identifier: 'default', format: { type: 'image/tiff' } }],
    },
    evalscript: S2_GRID_EVALSCRIPT,
  };

  try {
    const res = await cdseFetch('/api/v1/process', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return parseTiffBands(buffer, GRID_SIZE);
  } catch {
    return null;
  }
}

export async function fetchLayerImage(
  bounds: GeoBounds,
  evalscript: string,
  width = 512,
  height = 512
): Promise<ArrayBuffer | null> {
  const bbox = boundsToBbox(bounds);
  const body = {
    input: {
      bounds: {
        bbox,
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' },
      },
      data: [
        {
          type: 'sentinel-2-l2a',
          dataFilter: { maxCloudCoverage: 30 },
        },
      ],
    },
    output: {
      width,
      height,
      responses: [{ identifier: 'default', format: { type: 'image/png' } }],
    },
    evalscript,
  };

  try {
    const res = await cdseFetch('/api/v1/process', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}
