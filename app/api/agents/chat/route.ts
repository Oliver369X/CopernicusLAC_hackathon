import { NextResponse } from 'next/server';
import { runAgentChat } from '@/lib/agents/mistral-orchestrator';
import { buildAgentContextPack } from '@/lib/agents/context-pack';
import { resolveScopedFieldContext, scopeFromSession } from '@/lib/agents/scope';
import type { AgentChatRequest } from '@/lib/agents/types';
import { getSessionOrg } from '@/lib/auth/org';
import { dbQueryOne } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'local';

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const body = (await request.json()) as AgentChatRequest;
    if (!body.message?.trim()) {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }

    const org = await getSessionOrg();
    if (!org) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const orgRow = isDatabaseConfigured()
      ? await dbQueryOne<{ name: string }>(
          `SELECT name FROM organizations WHERE id = $1`,
          [org.orgId]
        )
      : null;

    const scope = scopeFromSession(org, orgRow?.name ?? 'Mi finca');
    const resolved = await resolveScopedFieldContext(scope, body.fieldId, body.zoneId);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 403 });
    }

    const contextPack = await buildAgentContextPack(scope, resolved.ctx);
    const fieldId = resolved.ctx.field.id;
    const zoneId = resolved.ctx.zone?.id;

    const result = await runAgentChat(
      {
        ...body,
        fieldId,
        zoneId,
      },
      {
        scope,
        contextPackJson: JSON.stringify(contextPack, null, 2),
      }
    );

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Agent chat failed';
    console.error('[agents/chat]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
