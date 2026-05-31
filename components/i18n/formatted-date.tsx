'use client';

import { useEffect, useState } from 'react';
import { formatDateTimeEs } from '@/lib/i18n/format-date';
import { cn } from '@/lib/utils';

interface FormattedDateTimeProps {
  value: Date | string | number;
  className?: string;
}

/**
 * Fechas que deben mostrar zona horaria local del usuario (solo tras hidratar).
 * Para listas SSR usar formatDateTimeEs directamente.
 */
export function ClientFormattedDateTime({ value, className }: FormattedDateTimeProps) {
  const [text, setText] = useState(() => formatDateTimeEs(value));

  useEffect(() => {
    const d = value instanceof Date ? value : new Date(value);
    if (!Number.isNaN(d.getTime())) {
      setText(d.toLocaleString('es'));
    }
  }, [value]);

  return (
    <time
      dateTime={new Date(value).toISOString()}
      className={cn(className)}
      suppressHydrationWarning
    >
      {text}
    </time>
  );
}
