'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useOrgBilling } from '@/hooks/use-org-billing';
import { isSmallFarmerExperience } from '@/lib/navigation/experience';

export function CooperativeExperienceGuard({
  children,
  redirectTo = '/monitor',
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const { billing, loading } = useOrgBilling();
  const blocked = isSmallFarmerExperience(billing);

  useEffect(() => {
    if (!loading && blocked) {
      router.replace(redirectTo);
    }
  }, [loading, blocked, router, redirectTo]);

  if (loading || blocked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando…
      </div>
    );
  }

  return <>{children}</>;
}
