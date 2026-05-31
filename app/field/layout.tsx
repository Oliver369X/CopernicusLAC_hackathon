import type { ReactNode } from 'react';
import { FieldAppShell } from '@/components/field/field-app-shell';

export default function FieldLayout({ children }: { children: ReactNode }) {
  return <FieldAppShell>{children}</FieldAppShell>;
}
