import { describe, it, expect } from 'vitest';
import { parseJsonResponse } from '@/lib/fetch/parse-json-response';

describe('parseJsonResponse', () => {
  it('parses valid JSON', async () => {
    const res = new Response(JSON.stringify({ ok: true }), { status: 200 });
    const result = await parseJsonResponse<{ ok: boolean }>(res);
    expect(result.error).toBeNull();
    expect(result.data?.ok).toBe(true);
  });

  it('handles empty body', async () => {
    const res = new Response('', { status: 500 });
    const result = await parseJsonResponse(res);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/500|interno/i);
  });

  it('handles invalid JSON', async () => {
    const res = new Response('<html>', { status: 200 });
    const result = await parseJsonResponse(res);
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });
});
