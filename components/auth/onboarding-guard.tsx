'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const SKIP_PREFIXES = [
  '/login',
  '/register',
  '/onboarding',
  '/api',
  '/auth',
];

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
      setReady(true);
      return;
    }

    let cancelled = false;
    fetch('/api/org/status')
      .then((r) => r.json())
      .then((data: { fieldCount: number; onboardingComplete: boolean }) => {
        if (cancelled) return;
        if (data.fieldCount === 0 && !data.onboardingComplete) {
          router.replace('/onboarding');
          return;
        }
        setReady(true);
      })
      .catch(() => setReady(true));

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) return null;
  return <>{children}</>;
}
