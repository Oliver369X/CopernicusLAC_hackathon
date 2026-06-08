'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { usePlainExperience } from '@/hooks/use-plain-experience';
import { shouldBlockTechnicalRoute } from '@/lib/navigation/experience';

export function PlainExperienceGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { plain, technicalMode, billing, loading } = usePlainExperience();
  const blocked =
    !loading && plain && shouldBlockTechnicalRoute(pathname, billing, technicalMode);

  useEffect(() => {
    if (blocked) {
      router.replace('/inicio');
    }
  }, [blocked, router]);

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
