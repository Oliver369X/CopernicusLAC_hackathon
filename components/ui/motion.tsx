import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MotionProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'ul' | 'article';
}

export function FadeIn({
  children,
  className,
  as: Tag = 'div',
}: MotionProps) {
  return (
    <Tag className={cn('animate-fade-in-up motion-reduce:animate-none', className)}>
      {children}
    </Tag>
  );
}

export function StaggerList({
  children,
  className,
  as: Tag = 'ul',
}: MotionProps) {
  return (
    <Tag
      className={cn(
        'stagger-children motion-reduce:[&>*]:!animate-none',
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function ScaleIn({
  children,
  className,
  as: Tag = 'div',
}: MotionProps) {
  return (
    <Tag className={cn('animate-scale-in motion-reduce:animate-none', className)}>
      {children}
    </Tag>
  );
}

/** Elevación sutil al hover en cards de listado. */
export function HoverLift({
  children,
  className,
  as: Tag = 'div',
}: MotionProps) {
  return (
    <Tag
      className={cn(
        'transition-[transform,box-shadow] duration-200 motion-reduce:transition-none',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 motion-reduce:hover:translate-y-0',
        className
      )}
    >
      {children}
    </Tag>
  );
}
