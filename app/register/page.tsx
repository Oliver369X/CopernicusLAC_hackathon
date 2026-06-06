'use client';

import { Suspense } from 'react';
import RegisterPage from './register-page';

export default function Register() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-muted-foreground">Cargando...</div>
      }
    >
      <RegisterPage />
    </Suspense>
  );
}
