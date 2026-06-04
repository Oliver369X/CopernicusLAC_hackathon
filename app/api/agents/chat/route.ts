import { NextResponse } from 'next/server';
import { runAgentChat } from '@/lib/agents/mistral-orchestrator';
import type { AgentChatRequest } from '@/lib/agents/types';

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

    const result = await runAgentChat(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Agent chat failed';
    console.error('[agents/chat]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
