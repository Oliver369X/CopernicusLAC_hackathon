import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="space-y-1.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'wide' | 'narrow';
}

export function PageContainer({
  children,
  className,
  size = 'default',
}: PageContainerProps) {
  const maxWidth =
    size === 'wide'
      ? 'max-w-[1600px]'
      : size === 'narrow'
        ? 'max-w-4xl'
        : 'max-w-7xl';

  return (
    <div
      className={cn(
        'mx-auto w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 animate-fade-in',
        maxWidth,
        className
      )}
    >
      {children}
    </div>
  );
}
