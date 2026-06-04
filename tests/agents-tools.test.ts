import { describe, expect, it } from 'vitest';
import {
  AGENT_TOOLS,
  executeAgentTool,
  getFieldsSummary,
  listDemoCredentials,
} from '@/lib/agents/tools';

describe('agent tools', () => {
  it('exports all planned tools', () => {
    const names = AGENT_TOOLS.map((t) => t.name);
    expect(names).toContain('getFieldsSummary');
    expect(names).toContain('getZoneSatelliteDetail');
    expect(names).toContain('getActiveAlerts');
    expect(names).toContain('getScienceAnalysis');
    expect(names).toContain('getPlatformGuide');
    expect(names).toContain('listDemoCredentials');
  });

  it('listDemoCredentials returns hackathon accounts', () => {
    const creds = listDemoCredentials();
    expect(creds.users.length).toBeGreaterThanOrEqual(3);
    expect(creds.password).toBe('demo123456');
  });

  it('getFieldsSummary returns portfolio shape', async () => {
    const summary = await getFieldsSummary();
    expect(summary.fieldCount).toBeGreaterThan(0);
    expect(Array.isArray(summary.fields)).toBe(true);
  });

  it('getPlatformGuide returns markdown content', async () => {
    const guide = await executeAgentTool('getPlatformGuide', { topic: 'demo' });
    expect(guide).toHaveProperty('content');
    expect(String((guide as { content: string }).content)).toContain('Aura Agro');
  });

  it('unknown tool returns error', async () => {
    const result = await executeAgentTool('unknownTool', {});
    expect(result).toEqual({ error: 'Tool desconocida: unknownTool' });
  });
});
