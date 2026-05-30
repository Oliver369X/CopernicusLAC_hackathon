/** @deprecated Import from @/lib/mock-data/fields and @/lib/types/field instead */
export type {
  GeoPoint,
  GeoBounds,
  FieldZone as Zone,
  Field,
  HealthStatus,
} from '@/lib/types/field';

export {
  MOCK_FIELDS,
  getFieldById,
  getZoneById,
  getFieldZones,
} from './fields';
