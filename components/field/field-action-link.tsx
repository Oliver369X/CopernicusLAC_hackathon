import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldActionLinkProps {
  href?: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
}

export function FieldActionLink({
  href,
  icon: Icon,
  title,
  description,
  variant = 'outline',
  onClick,
  disabled,
}: FieldActionLinkProps) {
  const content = (
    <div
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors',
        variant === 'primary' &&
          'border-primary/30 bg-primary/10 hover:bg-primary/15',
        variant === 'outline' &&
          'border-border/60 bg-muted/10 hover:bg-muted/25',
        variant === 'ghost' && 'border-transparent bg-transparent hover:bg-muted/20',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          variant === 'primary' ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground sm:text-base">{title}</p>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </div>
  );

  if (onClick || !href) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full text-left"
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className="block w-full">
      {content}
    </Link>
  );
}
