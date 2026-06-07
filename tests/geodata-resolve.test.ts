import { describe, it, expect } from 'vitest';
import {
  getStaticGeodataLink,
  clearGeodataLinkCache,
} from '@/lib/integrations/geodata/resolve-parcel-key';

describe('resolveFieldGeodataLink static fallback', () => {
  it('resuelve parcel_key demo San Julián', () => {
    clearGeodataLinkCache();
    const link = getStaticGeodataLink('field-sj-norte');
    expect(link?.parcelKey).toBe('SJ-NORTE-001');
    expect(link?.regionCode).toBe('SC-BO');
  });

  it('retorna null para campo desconocido', () => {
    expect(getStaticGeodataLink('field-unknown')).toBeNull();
  });
});
