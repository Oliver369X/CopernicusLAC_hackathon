import type { CropType } from '@/lib/mock-data/crops';
import type { GeoBounds } from '@/lib/types/field';

export type ImportErrorCode =
  | 'INVALID_GEOMETRY'
  | 'UNKNOWN_CROP'
  | 'AREA_TOO_SMALL'
  | 'TOO_MANY_FEATURES'
  | 'PARSE_ERROR'
  | 'MISSING_NAME';

export interface ImportError {
  code: ImportErrorCode;
  row?: number;
  featureIndex?: number;
  message: string;
}

export interface ImportParcel {
  name: string;
  crop: CropType;
  areaHa: number;
  plantingDate?: string;
  locationLabel?: string;
  bounds: GeoBounds;
  zoneName?: string;
  center: { lat: number; lng: number };
}

export interface ImportPreviewField {
  tempId: string;
  name: string;
  crop: CropType;
  areaHa: number;
  zoneCount: number;
  warnings: string[];
}

export interface ImportPreview {
  fields: ImportPreviewField[];
  parcels: ImportParcel[];
  errors: ImportError[];
  warnings: string[];
}

export const MAX_IMPORT_FEATURES = 500;
export const MIN_AREA_HA = 0.1;
