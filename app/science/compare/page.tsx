import { Suspense } from 'react';
import ScienceCompareClient from '@/components/science/science-compare-client';

export default function ScienceComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-muted-foreground">
          Cargando comparador…
        </div>
      }
    >
      <ScienceCompareClient />
    </Suspense>
  );
}
