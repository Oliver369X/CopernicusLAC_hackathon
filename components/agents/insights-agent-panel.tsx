'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuraAssistantPanel } from '@/components/agents/aura-assistant-panel';
import { useFields } from '@/hooks/use-fields';
import { getCropLabelEs } from '@/lib/design/tokens';
import { isScienceCrop } from '@/lib/science/crops/registry';
import { buildScreenContext, getScreenQuickPrompts } from '@/lib/agents/screen-context';

export function InsightsAgentPanel() {
  const searchParams = useSearchParams();
  const { getFieldById } = useFields();
  const fieldId = searchParams.get('field') ?? undefined;
  const zoneId = searchParams.get('zone') ?? undefined;
  const promptParam = searchParams.get('prompt') ?? undefined;

  const field = fieldId ? getFieldById(fieldId) : undefined;
  const zone = field?.zones.find((z) => z.id === zoneId) ?? field?.zones[0];

  const quickPrompts = useMemo(() => {
    const base = getScreenQuickPrompts('/insights');
    const chips: string[] = [];
    if (zone) chips.push(`Analizar zona ${zone.name}`);
    if (field && isScienceCrop(field.crop)) {
      chips.push(`Abrir lab de ${getCropLabelEs(field.crop)}`);
    }
    return [...chips, ...base].slice(0, 4);
  }, [field, zone]);

  const screenContext = buildScreenContext('/insights', { field: fieldId, zone: zoneId });
  const autoPrompt = promptParam
    ? decodeURIComponent(promptParam)
    : field
      ? `Resumen del campo ${field.name} hoy`
      : 'Resumen satelital hoy';

  return (
    <AuraAssistantPanel
      fieldId={fieldId}
      zoneId={zoneId}
      screenContext={screenContext}
      quickPrompts={quickPrompts}
      autoPrompt={autoPrompt}
    />
  );
}
