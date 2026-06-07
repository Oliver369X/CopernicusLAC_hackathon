import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  APP_NAME,
  AURA_LOGO_DARK,
  AURA_LOGO_TRANSPARENT,
} from '@/lib/constants/app-brand';

export type AuraLogoVariant = 'mark' | 'full' | 'dark';

export interface AuraLogoProps {
  variant?: AuraLogoVariant;
  className?: string;
  /** Ancho en px (altura proporcional en full). */
  size?: number;
  priority?: boolean;
}

export function AuraLogo({
  variant = 'mark',
  className,
  size,
  priority = false,
}: AuraLogoProps) {
  const src = variant === 'dark' ? AURA_LOGO_DARK : AURA_LOGO_TRANSPARENT;
  const width = size ?? (variant === 'full' ? 168 : 36);
  const height =
    variant === 'full' ? Math.round(width * 1.15) : Math.round(width * 1.05);

  return (
    <Image
      src={src}
      alt={`Logo ${APP_NAME}`}
      width={width}
      height={height}
      priority={priority}
      className={cn('object-contain', className)}
    />
  );
}
