import type { CropScienceProfile, ScienceCropId } from '../types';
import { CACAO_SCIENCE_PROFILE } from './cacao';
import { COFFEE_SCIENCE_PROFILE } from './coffee';
import { CORN_SCIENCE_PROFILE } from './corn';
import { SOYBEAN_SCIENCE_PROFILE } from './soybean';
import { WHEAT_SCIENCE_PROFILE } from './wheat';

const PROFILES: Record<ScienceCropId, CropScienceProfile> = {
  soybean: SOYBEAN_SCIENCE_PROFILE,
  wheat: WHEAT_SCIENCE_PROFILE,
  corn: CORN_SCIENCE_PROFILE,
  coffee: COFFEE_SCIENCE_PROFILE,
  cacao: CACAO_SCIENCE_PROFILE,
};

export function getScienceProfile(crop: ScienceCropId): CropScienceProfile {
  return PROFILES[crop];
}

export function listScienceCrops(): CropScienceProfile[] {
  return Object.values(PROFILES);
}

export function isScienceCrop(crop: string): crop is ScienceCropId {
  return crop in PROFILES;
}

/** Crops that get full science cron ingest (extended S2/S1). */
export function isScienceIngestCrop(crop: string): boolean {
  return isScienceCrop(crop);
}
