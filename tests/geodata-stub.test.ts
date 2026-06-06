import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isGeodataEnabled } from '@/lib/integrations/geodata/registry';
import { getParcelIntelligence } from '@/lib/integrations/geodata/client';

describe('geodata stub', () => {
  beforeEach(() => {
    vi.stubEnv('GEODATA_ENABLED', 'false');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('GEODATA_ENABLED=false no hace fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(isGeodataEnabled()).toBe(false);
    const result = await getParcelIntelligence('SJ-NORTE-001');
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('isGeodataEnabled lee env', () => {
    vi.stubEnv('GEODATA_ENABLED', 'true');
    expect(isGeodataEnabled()).toBe(true);
  });
});
