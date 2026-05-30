'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';

export function AuthHeaderActions() {
  const router = useRouter();

  const handleLogout = async () => {
    if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== 'true') return;
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== 'true') {
    return (
      <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
        <Link href="/login">
          <LogIn className="h-4 w-4" />
          Demo (sin login)
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={handleLogout}>
      <LogOut className="h-4 w-4" />
      Cerrar sesión
    </Button>
  );
}
