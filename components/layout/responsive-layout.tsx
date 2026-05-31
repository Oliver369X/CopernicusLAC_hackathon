import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HorizontalScrollRowProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

/** Fila horizontal con scroll en móvil (tabs, filtros). */
export function HorizontalScrollRow({
  children,
  className,
  'aria-label': ariaLabel,
}: HorizontalScrollRowProps) {
  return (
    <div
      className={cn(
        '-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory scrollbar-thin',
        className
      )}
      role={ariaLabel ? 'toolbar' : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

interface ResponsiveToolbarProps {
  children: ReactNode;
  className?: string;
}

/** Toolbar: scroll en móvil, wrap en sm+. */
export function ResponsiveToolbar({ children, className }: ResponsiveToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center',
        className
      )}
    >
      <div className="-mx-1 flex w-full gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {children}
      </div>
    </div>
  );
}

interface BadgeRowProps {
  children: ReactNode;
  className?: string;
}

/** Badges que envuelven en móvil sin recortar. */
export function BadgeRow({ children, className }: BadgeRowProps) {
  return (
    <div className={cn('flex max-w-full flex-wrap gap-1.5', className)}>
      {children}
    </div>
  );
}
