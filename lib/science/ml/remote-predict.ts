import type { HealthLabel, MlFeatureVector } from '../types';
import { getModel, applyModelRules, scoresToHealth } from './model-registry';

export async function predictRemoteMlHealth(
  crop: string,
  features: MlFeatureVector
): Promise<{ score: number; label: HealthLabel } | null> {
  const url = process.env.ML_REMOTE_URL;
  if (!url) return null;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crop, features }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { score: number; label: HealthLabel };
    return data;
  } catch {
    return null;
  }
}

export async function predictMlHealthAsync(
  crop: string,
  features: MlFeatureVector
): Promise<{ score: number; label: HealthLabel; source: 'remote' | 'local' }> {
  if (process.env.ML_ENABLED === 'false') {
    return { score: 0.5, label: 'good', source: 'local' };
  }

  const remote = await predictRemoteMlHealth(crop, features);
  if (remote) return { ...remote, source: 'remote' };

  const model = getModel(crop);
  const scores = applyModelRules(model, features);
  const { label, score } = scoresToHealth(scores);
  return { score, label, source: 'local' };
}
