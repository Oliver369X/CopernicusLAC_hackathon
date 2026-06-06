'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { AgentChatResponse } from '@/lib/agents/types';
import { ASSISTANT_NAME } from '@/lib/constants/app-brand';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { uniqueSources } from '@/lib/agents/unique-sources';
import { buildScienceUrl } from '@/lib/navigation/context-links';
import { isScienceCrop } from '@/lib/science/crops/registry';
import type { ScienceCropId } from '@/lib/science/types';
import { getCropLabelEs } from '@/lib/design/tokens';
import { useFields } from '@/hooks/use-fields';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  meta?: AgentChatResponse;
}

export interface AuraAssistantPanelProps {
  fieldId?: string;
  zoneId?: string;
  screenContext?: string;
  quickPrompts?: string[];
  /** Mensaje inicial automático (solo una vez). */
  autoPrompt?: string;
  /** Sin Card wrapper (para sheet). */
  bare?: boolean;
}

export function AuraAssistantPanel({
  fieldId,
  zoneId,
  screenContext,
  quickPrompts = [],
  autoPrompt,
  bare = false,
}: AuraAssistantPanelProps) {
  const { getFieldById } = useFields();
  const field = fieldId ? getFieldById(fieldId) : undefined;
  const zone = zoneId
    ? field?.zones.find((z) => z.id === zoneId)
    : field?.zones[0];

  const chips = quickPrompts.length
    ? quickPrompts.slice(0, 4)
    : ['Explicá lo que veo en pantalla', '¿Está bien o mal?', '¿Qué hago hoy?'];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const briefingStarted = useRef(false);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setInput('');
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      setLoading(true);

      try {
        const res = await fetch('/api/agents/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            fieldId,
            zoneId: zone?.id,
            screenContext,
          }),
        });
        const data = (await res.json()) as AgentChatResponse & { error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Error del agente');

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply, meta: data },
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error de conexión';
        setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
      } finally {
        setLoading(false);
      }
    },
    [loading, fieldId, zone?.id, screenContext]
  );

  useEffect(() => {
    if (briefingStarted.current || !autoPrompt) return;
    briefingStarted.current = true;
    void sendMessage(autoPrompt);
  }, [autoPrompt, sendMessage]);

  const handleChip = (chip: string) => {
    if (chip.startsWith('Abrir lab de') && field && isScienceCrop(field.crop)) {
      window.location.href = buildScienceUrl({
        fieldId: field.id,
        zoneId: zone?.id,
        crop: field.crop as ScienceCropId,
        tab: 'lab',
      });
      return;
    }
    void sendMessage(chip);
  };

  const body = (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Button
            key={chip}
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={loading}
            onClick={() => handleChip(chip)}
          >
            <Sparkles className="mr-1 h-3 w-3" />
            {chip}
          </Button>
        ))}
      </div>

      <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg border border-border/60 bg-muted/30 p-3 scrollbar-thin">
        {messages.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Preguntame qué significan los números, si un indicador está bien o mal, o qué hacer
            con lo que ves en pantalla.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={`${msg.role}-${i}-${msg.content.slice(0, 24)}`}
            className={
              msg.role === 'user'
                ? 'ml-6 rounded-lg border border-border/50 bg-muted/50 px-3 py-2'
                : 'mr-2 rounded-lg border border-border/50 bg-background px-3 py-3'
            }
          >
            {msg.role === 'user' ? (
              <p className="text-sm text-foreground">{msg.content}</p>
            ) : (
              <MarkdownContent content={msg.content} />
            )}
            {msg.meta && msg.role === 'assistant' && (
              <div className="mt-3 flex flex-wrap gap-1 border-t border-border/40 pt-2">
                {uniqueSources(msg.meta.sources).map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px] font-normal">
                    {s}
                  </Badge>
                ))}
                <Badge variant="secondary" className="text-[10px] font-normal">
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
          placeholder="¿Qué significa este NDVI? ¿Está bien?"
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );

  if (bare) {
    return (
      <div className="space-y-3">
        <div>
          <p className="font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {ASSISTANT_NAME}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Te explica los datos en pantalla{field ? ` · ${field.name}` : ''}.
          </p>
        </div>
        {body}
      </div>
    );
  }

  return (
    <Card className="border-border/80 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Bot className="h-5 w-5 text-primary" />
          {ASSISTANT_NAME}
          <Badge variant="secondary" className="text-xs font-normal">
            Copernicus + IA
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Explicá métricas, salud del cultivo y próximos pasos según lo que ves en pantalla.
          {field ? ` Contexto: ${field.name}${zone ? ` · ${zone.name}` : ''}.` : ''}
          {field && isScienceCrop(field.crop)
            ? ` Cultivo: ${getCropLabelEs(field.crop)}.`
            : ''}
        </p>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
