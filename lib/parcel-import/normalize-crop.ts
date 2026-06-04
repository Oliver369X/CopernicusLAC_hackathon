import type { CropType } from '@/lib/mock-data/crops';

const ALIASES: Record<string, CropType> = {
  soja: 'soybean',
  soybean: 'soybean',
  soy: 'soybean',
  maiz: 'corn',
  maíz: 'corn',
  corn: 'corn',
  trigo: 'wheat',
  wheat: 'wheat',
  algodon: 'cotton',
  algodón: 'cotton',
  cotton: 'cotton',
  girasol: 'sunflower',
  sunflower: 'sunflower',
  canola: 'canola',
  colza: 'canola',
  cebada: 'barley',
  barley: 'barley',
  arroz: 'rice',
  rice: 'rice',
};

export function normalizeCropInput(raw: string | undefined): CropType | null {
  if (!raw?.trim()) return null;
  const key = raw.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  return ALIASES[key] ?? (key in ALIASES ? ALIASES[key] : null);
}

export function normalizeCropOrDefault(raw: string | undefined): CropType {
  return normalizeCropInput(raw) ?? 'soybean';
}
