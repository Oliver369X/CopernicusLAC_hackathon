'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DEMO_REGION_LABEL } from '@/lib/geo/demo-region';
import {
  buildInsightsUrl,
  buildMonitorUrl,
  buildScienceUrl,
  buildStudiesUrl,
} from '@/lib/navigation/context-links';
import { getCropLabelEs } from '@/lib/design/tokens';
import { useFields } from '@/hooks/use-fields';
import type { ScienceCropId } from '@/lib/science/types';
import { isScienceCrop } from '@/lib/science/crops/registry';

export interface FieldContextBarProps {
  fieldId: string;
  zoneId?: string;
  crop?: ScienceCropId;
  currentPage: 'monitor' | 'science' | 'studies' | 'insights';
}

export function FieldContextBar({
  fieldId,
  zoneId,
  crop,
  currentPage,
}: FieldContextBarProps) {
  const { getFieldById } = useFields();
  const field = getFieldById(fieldId);
  if (!field) return null;

  const zone = zoneId
    ? field.zones.find((z) => z.id === zoneId) ?? field.zones[0]
    : field.zones[0];
  const resolvedCrop = crop ?? (isScienceCrop(field.crop) ? field.crop : undefined);
  const cropLabel = resolvedCrop
    ? getCropLabelEs(resolvedCrop)
    : getCropLabelEs(field.crop);

  const ctx = {
    fieldId: field.id,
    zoneId: zone?.id,
    crop: resolvedCrop ?? field.crop,
  };

  const links = [
    {
      key: 'monitor' as const,
      label: 'Monitoreo',
      href: buildMonitorUrl(ctx),
    },
    ...(resolvedCrop
      ? [
          {
            key: 'science' as const,
            label: 'Lab',
            href: buildScienceUrl({ ...ctx, crop: resolvedCrop, tab: 'lab' }),
          },
          {
            key: 'studies' as const,
            label: 'Estudios',
            href: buildStudiesUrl({ ...ctx, crop: resolvedCrop }),
          },
        ]
      : []),
    {
      key: 'insights' as const,
      label: 'Perspectivas',
      href: buildInsightsUrl({ fieldId: field.id, zoneId: zone?.id }),
    },
  ];

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 space-y-2">
      <p className="text-xs text-muted-foreground truncate">
        <span className="font-medium text-foreground">{field.name}</span>
        {zone ? ` · ${zone.name}` : ''}
        {` · ${cropLabel} · ${DEMO_REGION_LABEL}`}
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Button
            key={link.key}
            variant={currentPage === link.key ? 'secondary' : 'outline'}
            size="sm"
            className="h-8"
            asChild={currentPage !== link.key}
            disabled={currentPage === link.key}
          >
            {currentPage === link.key ? (
              <span>{link.label}</span>
            ) : (
              <Link href={link.href}>{link.label}</Link>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
