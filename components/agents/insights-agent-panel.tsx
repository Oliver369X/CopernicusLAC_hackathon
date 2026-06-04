'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { AgentChatResponse } from '@/lib/agents/types';
import { APP_NAME } from '@/lib/constants/app-brand';

const SUGGESTED_CHIPS = [
  'Resumen satelital hoy',
  'Zona con más estrés',
  'Guía demo 3 min',
] as const;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  meta?: AgentChatResponse;
}

export function InsightsAgentPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [briefingDone, setBriefingDone] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setLoading(true);

    try {
      const res = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await res.json()) as AgentChatResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Error del agente');

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply, meta: data },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de conexión';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: msg },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (briefingDone) return;
    setBriefingDone(true);
    void sendMessage('Resumen satelital hoy');
  }, [briefingDone, sendMessage]);

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Bot className="h-5 w-5 text-primary" />
          Asistente {APP_NAME}
          <Badge variant="secondary" className="text-xs font-normal">
            Mistral + Copernicus
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Multiagente: análisis satelital, recomendaciones de campo y guía demo hackathon.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_CHIPS.map((chip) => (
            <Button
              key={chip}
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={loading}
              onClick={() => void sendMessage(chip)}
            >
              <Sparkles className="mr-1 h-3 w-3" />
              {chip}
            </Button>
          ))}
        </div>

        <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-3">
          {messages.map((msg, i) => (
            <div
              key={`${msg.role}-${i}`}
              className={
                msg.role === 'user'
                  ? 'ml-8 rounded-lg bg-primary/10 px-3 py-2 text-sm'
                  : 'mr-4 rounded-lg bg-background px-3 py-2 text-sm shadow-sm'
              }
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.meta && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.meta.sources.map((s) => (
                    <Badge key={s} variant="outline" className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                  <Badge variant="secondary" className="text-[10px]">
                    {msg.meta.agentUsed}
                  </Badge>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analizando…
            </div>
          )}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Preguntá sobre NDVI, alertas o la demo…"
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
