import { Suspense } from 'react';
import ScienceCompareClient from '@/components/science/science-compare-client';

export default function ScienceComparePage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando…</div>}>
      <ScienceCompareClient />
    </Suspense>
  );
}
