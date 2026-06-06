import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveLocalExperiment,
  listLocalExperiments,
  mergeExperiments,
  STORAGE_KEY,
  MAX_LOCAL,
} from '@/lib/science/experiments-local';
import type { MultisensorAnalysis } from '@/lib/science/types';

const mockResult: MultisensorAnalysis = {
  crop: 'soybean',
  fieldId: 'field-sj-norte',
  zoneId: 'zone-sj-n-1',
  capturedAt: '2026-03-15T00:00:00.000Z',
  fusionScore: 0.72,
  healthLabel: 'good',
  optical: { ndvi: 0.6, ndre: 0.35 },
  radar: { dpRvi: 0.1 },
  temporal: {
    sampleCount: 5,
    phenologyMatch: 'match',
    phenologyPhase: 'R5',
    ndviSlope7d: -0.01,
    ndreSlope7d: -0.02,
    ndviSlope14d: null,
    dpRviSlope7d: null,
    peakNdvi: null,
    peakDpRvi: null,
  },
  anomalyFlags: [],
  source: 'mock',
  narrative: 'Demo San Julián',
  references: [],
};

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => storage.clear(),
    key: () => null,
    length: 0,
  });
  vi.stubGlobal('crypto', {
    randomUUID: () => `uuid-${Math.random().toString(36).slice(2)}`,
  });
});

describe('experiments-local', () => {

  it('saves and lists local experiments', () => {
    const id = saveLocalExperiment({
      crop: 'soybean',
      fieldId: 'field-sj-norte',
      zoneId: 'zone-sj-n-1',
      hypothesis: 'H3 test',
      notes: null,
      result: mockResult,
    });
    expect(id).toBeTruthy();
    const list = listLocalExperiments({ crop: 'soybean', fieldId: 'field-sj-norte' });
    expect(list).toHaveLength(1);
    expect(list[0].hypothesis).toBe('H3 test');
  });

  it('merges remote and local without duplicate ids', () => {
    saveLocalExperiment({
      crop: 'soybean',
      fieldId: 'field-sj-norte',
      zoneId: 'zone-sj-n-1',
      hypothesis: 'local',
      notes: null,
      result: mockResult,
      id: 'exp-local-1',
    });
    const merged = mergeExperiments(
      [
        {
          id: 'exp-remote-1',
          crop: 'soybean',
          field_id: 'field-sj-norte',
          hypothesis: 'remote',
          created_at: '2026-03-14T00:00:00.000Z',
        },
      ],
      listLocalExperiments({})
    );
    expect(merged).toHaveLength(2);
    expect(merged.map((m) => m.id)).toContain('exp-local-1');
    expect(merged.map((m) => m.id)).toContain('exp-remote-1');
  });

  it('trims to MAX_LOCAL entries', () => {
    for (let i = 0; i < MAX_LOCAL + 5; i++) {
      saveLocalExperiment({
        crop: 'soybean',
        fieldId: 'field-sj-norte',
        zoneId: 'zone-sj-n-1',
        hypothesis: `H${i}`,
        notes: null,
        result: mockResult,
      });
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw ?? '[]') as unknown[];
    expect(parsed.length).toBe(MAX_LOCAL);
  });
});
