import type { GroundTruthRow } from './types';
import type { ScienceCropId } from '../types';

const CROP_ALIASES: Record<string, ScienceCropId> = {
  soybean: 'soybean',
  soja: 'soybean',
  soy: 'soybean',
  wheat: 'wheat',
  trigo: 'wheat',
  corn: 'corn',
  maize: 'corn',
  maíz: 'corn',
  coffee: 'coffee',
  cafe: 'coffee',
  café: 'coffee',
  cacao: 'cacao',
  cocoa: 'cacao',
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (c === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

function normalizeCrop(raw: string): ScienceCropId | null {
  const key = raw.trim().toLowerCase();
  return CROP_ALIASES[key] ?? null;
}

function normalizeDate(raw: string): string {
  const d = raw.trim();
  if (d.includes('T')) return d;
  return `${d}T12:00:00.000Z`;
}

export function parseGroundTruthCsv(text: string): GroundTruthRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const rows: GroundTruthRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = cells[idx] ?? '';
    });

    const crop = normalizeCrop(rec.crop ?? '');
    if (!crop) continue;

    rows.push({
      crop,
      fieldId: rec.field_id || rec.fieldid || '',
      zoneId: rec.zone_id || rec.zoneid || undefined,
      capturedAt: normalizeDate(rec.captured_at || rec.date || rec.capturedat || ''),
      diseaseLabel: rec.disease_label || rec.disease || undefined,
      severity: (rec.severity as GroundTruthRow['severity']) || undefined,
      healthLabel: (rec.health_label as GroundTruthRow['healthLabel']) || undefined,
      lat: rec.lat ? parseFloat(rec.lat) : undefined,
      lng: rec.lng ? parseFloat(rec.lng) : undefined,
      observationId: rec.observation_id || undefined,
      productionClass: rec.production_class || undefined,
      source: rec.source || 'manual_csv',
      notes: rec.notes || undefined,
    });
  }

  return rows;
}
