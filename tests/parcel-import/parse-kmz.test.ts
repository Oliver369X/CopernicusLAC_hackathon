import { describe, it, expect } from 'vitest';
import { zipSync } from 'fflate';
import { parseParcelKmz } from '@/lib/parcel-import/parse-kmz';

const sampleKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Lote KMZ</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              -63.15,-17.78,0 -63.14,-17.78,0 -63.14,-17.77,0 -63.15,-17.77,0 -63.15,-17.78,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

function buildKmzBuffer(): ArrayBuffer {
  const zipped = zipSync({ 'doc.kml': new TextEncoder().encode(sampleKml) });
  return zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength);
}

describe('parseParcelKmz', () => {
  it('extracts parcels from KMZ archive', () => {
    const { parcels, errors } = parseParcelKmz(buildKmzBuffer());
    expect(errors).toHaveLength(0);
    expect(parcels.length).toBe(1);
    expect(parcels[0].name).toBe('Lote KMZ');
    expect(parcels[0].areaHa).toBeGreaterThan(0);
  });

  it('reports error when KMZ has no KML', () => {
    const zipped = zipSync({ 'readme.txt': new TextEncoder().encode('no kml') });
    const buf = zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength);
    const { parcels, errors } = parseParcelKmz(buf);
    expect(parcels).toHaveLength(0);
    expect(errors[0]?.code).toBe('PARSE_ERROR');
  });
});
