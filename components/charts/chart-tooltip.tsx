'use client';

import type { TooltipProps } from 'recharts';
import { chartTooltipStyle } from '@/lib/design/tokens';
import { formatDecimal } from '@/lib/i18n/format-number';

function displayValue(value: number | string | undefined): string | number {
  if (value == null) return '—';
  if (typeof value === 'number') return formatDecimal(value, 2);
  return value;
}

type ChartTooltipPayload = {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: { fill?: string };
};

export function ChartTooltipContent({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        ...chartTooltipStyle,
        padding: '10px 12px',
        minWidth: '120px',
      }}
    >
      {label != null && label !== '' && (
        <p
          style={{
            margin: '0 0 6px',
            fontSize: 13,
            fontWeight: 600,
            color: '#f0fdfa',
          }}
        >
          {label}
        </p>
      )}
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {(payload as ChartTooltipPayload[]).map((entry, i) => (
          <li
            key={`${entry.name}-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#e2e8f0',
              marginTop: i > 0 ? 4 : 0,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                backgroundColor: entry.color ?? entry.payload?.fill ?? '#14b8a6',
                flexShrink: 0,
              }}
            />
            <span style={{ color: '#94a3b8' }}>{entry.name}:</span>
            <span style={{ fontWeight: 600, color: '#f0fdfa' }}>
              {displayValue(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
