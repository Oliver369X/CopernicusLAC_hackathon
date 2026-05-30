import type { HealthLabel, MlFeatureVector } from '../types';

export interface MlModelRule {
  feature: keyof MlFeatureVector;
  op: 'lt' | 'gt';
  threshold: number;
  classDelta: Record<HealthLabel, number>;
}

export interface MlModelJson {
  crop: string;
  version: string;
  inferenceFormat?: 'ruleSurrogate' | 'treeFlat';
  featureOrder?: (keyof MlFeatureVector)[];
  rules: MlModelRule[];
  baseScores: Record<HealthLabel, number>;
}

const DEFAULT_BASE: Record<HealthLabel, number> = {
  excellent: 0.25,
  good: 0.25,
  warning: 0.25,
  critical: 0.25,
};

const EMBEDDED: Record<string, MlModelJson> = {
  soybean: {
    crop: 'soybean',
    version: '1.0.0',
    inferenceFormat: 'ruleSurrogate',
    baseScores: DEFAULT_BASE,
    rules: [
      { feature: 'ndre', op: 'lt', threshold: 0.28, classDelta: { excellent: -0.2, good: -0.1, warning: 0.15, critical: 0.15 } },
      { feature: 'ndreSlope7d', op: 'lt', threshold: -0.03, classDelta: { excellent: -0.15, good: -0.05, warning: 0.1, critical: 0.1 } },
      { feature: 'dpRvi', op: 'lt', threshold: 0.12, classDelta: { excellent: -0.1, good: 0, warning: 0.05, critical: 0.05 } },
      { feature: 'msi', op: 'gt', threshold: 1.8, classDelta: { excellent: -0.1, good: 0, warning: 0.1, critical: 0 } },
      { feature: 'lst', op: 'gt', threshold: 34, classDelta: { excellent: -0.1, good: -0.05, warning: 0.1, critical: 0.05 } },
    ],
  },
  wheat: {
    crop: 'wheat',
    version: '1.0.0',
    inferenceFormat: 'ruleSurrogate',
    baseScores: DEFAULT_BASE,
    rules: [
      { feature: 'ndre', op: 'lt', threshold: 0.26, classDelta: { excellent: -0.15, good: -0.05, warning: 0.1, critical: 0.1 } },
      { feature: 'ndreSlope7d', op: 'lt', threshold: -0.025, classDelta: { excellent: -0.1, good: 0, warning: 0.15, critical: 0.05 } },
    ],
  },
  corn: {
    crop: 'corn',
    version: '1.0.0',
    inferenceFormat: 'ruleSurrogate',
    baseScores: DEFAULT_BASE,
    rules: [
      { feature: 'ndre', op: 'lt', threshold: 0.3, classDelta: { excellent: -0.15, good: -0.05, warning: 0.1, critical: 0.1 } },
      { feature: 'ndvi', op: 'gt', threshold: 0.7, classDelta: { excellent: 0.05, good: 0.05, warning: 0, critical: 0 } },
      { feature: 'evi', op: 'lt', threshold: 0.35, classDelta: { excellent: -0.1, good: 0, warning: 0.1, critical: 0 } },
    ],
  },
  coffee: {
    crop: 'coffee',
    version: '1.0.0',
    inferenceFormat: 'ruleSurrogate',
    baseScores: DEFAULT_BASE,
    rules: [
      { feature: 'ndvi', op: 'lt', threshold: 0.55, classDelta: { excellent: -0.1, good: 0, warning: 0.1, critical: 0 } },
      { feature: 'dpRvi', op: 'lt', threshold: 0.1, classDelta: { excellent: -0.05, good: 0, warning: 0.05, critical: 0 } },
    ],
  },
  cacao: {
    crop: 'cacao',
    version: '1.0.0',
    inferenceFormat: 'ruleSurrogate',
    baseScores: DEFAULT_BASE,
    rules: [
      { feature: 'ndvi', op: 'lt', threshold: 0.58, classDelta: { excellent: -0.1, good: 0, warning: 0.1, critical: 0 } },
    ],
  },
};

const cache = new Map<string, MlModelJson>();

function resolveModelPath(crop: string): string | null {
  if (typeof process === 'undefined') return null;

  if (process.env.ML_MODEL_PATH) {
    const p = process.env.ML_MODEL_PATH;
    if (p.includes('{crop}')) return p.replace('{crop}', crop);
    if (crop === 'soybean' || !p.includes('soybean')) return p;
  }

  try {
    const cwd = process.cwd();
    const candidate = `${cwd}/models/${crop}_rf_v1.json`;
    return candidate;
  } catch {
    return null;
  }
}

function fileExists(filePath: string): boolean {
  if (typeof process === 'undefined' || !process.versions?.node) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('fs');
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function loadFromDisk(filePath: string): MlModelJson | null {
  if (typeof process === 'undefined' || !process.versions?.node) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('fs');
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as MlModelJson;
  } catch {
    return null;
  }
}

export function getModel(crop: string): MlModelJson {
  if (cache.has(crop)) return cache.get(crop)!;

  const filePath = resolveModelPath(crop);
  if (filePath && fileExists(filePath)) {
    const loaded = loadFromDisk(filePath);
    if (loaded && (loaded.crop === crop || !loaded.crop)) {
      cache.set(crop, loaded);
      return loaded;
    }
  }

  const embedded = EMBEDDED[crop] ?? EMBEDDED.soybean;
  cache.set(crop, embedded);
  return embedded;
}

export function getModelVersion(crop: string): string {
  return getModel(crop).version;
}

export function clearModelCache(): void {
  cache.clear();
}

export function applyModelRules(
  model: MlModelJson,
  features: MlFeatureVector
): Record<HealthLabel, number> {
  const scores = { ...model.baseScores };
  for (const rule of model.rules) {
    const val = features[rule.feature];
    const match = rule.op === 'lt' ? val < rule.threshold : val > rule.threshold;
    if (match) {
      for (const k of Object.keys(rule.classDelta) as HealthLabel[]) {
        scores[k] += rule.classDelta[k];
      }
    }
  }
  return scores;
}

export function scoresToHealth(scores: Record<HealthLabel, number>): {
  label: HealthLabel;
  score: number;
} {
  const entries = Object.entries(scores) as [HealthLabel, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries[0];
  const sum = entries.reduce((s, [, v]) => s + Math.max(0, v), 0);
  return { label: top[0], score: sum > 0 ? Math.max(0, Math.min(1, top[1] / sum)) : 0.5 };
}
