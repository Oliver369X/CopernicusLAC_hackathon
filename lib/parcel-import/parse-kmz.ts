import { unzipSync } from 'fflate';
import type { ImportParcel, ImportError } from './types';
import { parseParcelKml } from './parse-kml';

function findKmlEntry(files: Record<string, Uint8Array>): string | null {
  const names = Object.keys(files).filter(
    (n) => n.toLowerCase().endsWith('.kml') && !n.startsWith('__MACOSX')
  );
  if (names.length === 0) return null;
  const docKml = names.find((n) => n.toLowerCase().endsWith('doc.kml'));
  return docKml ?? names[0];
}

export function parseParcelKmz(buffer: ArrayBuffer): {
  parcels: ImportParcel[];
  errors: ImportError[];
} {
  try {
    const files = unzipSync(new Uint8Array(buffer));
    const kmlName = findKmlEntry(files);
    if (!kmlName) {
      return {
        parcels: [],
        errors: [
          {
            code: 'PARSE_ERROR',
            message: 'KMZ sin archivo KML interno',
          },
        ],
      };
    }
    const text = new TextDecoder().decode(files[kmlName]);
    return parseParcelKml(text);
  } catch (e) {
    return {
      parcels: [],
      errors: [
        {
          code: 'PARSE_ERROR',
          message: `KMZ inválido: ${e instanceof Error ? e.message : 'error'}`,
        },
      ],
    };
  }
}
