'use client';

import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/** Renderizado ligero de markdown del agente (listas, negritas, títulos). */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let listOrdered = false;
  let key = 0;

  const flushList = () => {
    if (!listItems.length) return;
    const ListTag = listOrdered ? 'ol' : 'ul';
    blocks.push(
      <ListTag
        key={key++}
        className={cn(
          'space-y-1 pl-5 text-sm leading-relaxed text-foreground/90',
          listOrdered ? 'list-decimal' : 'list-disc'
        )}
      >
        {listItems.map((item, idx) => (
          <li key={idx}>{renderInline(item)}</li>
        ))}
      </ListTag>
    );
    listItems = [];
    listOrdered = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^[-*]\s+/.test(trimmed)) {
      if (listOrdered) flushList();
      listItems.push(trimmed.replace(/^[-*]\s+/, ''));
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (!listOrdered && listItems.length) flushList();
      listOrdered = true;
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
      continue;
    }

    flushList();

    if (!trimmed) continue;

    if (/^#{1,3}\s+/.test(trimmed)) {
      const title = trimmed.replace(/^#{1,3}\s+/, '');
      blocks.push(
        <h4 key={key++} className="text-sm font-semibold text-foreground">
          {renderInline(title)}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.indexOf('**', 2) === trimmed.length - 2) {
      blocks.push(
        <p key={key++} className="text-sm font-semibold text-foreground">
          {trimmed.slice(2, -2)}
        </p>
      );
      continue;
    }

    blocks.push(
      <p key={key++} className="text-sm leading-relaxed text-foreground/90">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className={cn('space-y-2', className)}>{blocks}</div>;
}
