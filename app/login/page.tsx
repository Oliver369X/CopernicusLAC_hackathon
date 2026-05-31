'use client';

import { Suspense } from 'react';
import LoginPage from './login-page';

export default function Login() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Cargando...</div>}>
      <LoginPage />
    </Suspense>
  );
}
