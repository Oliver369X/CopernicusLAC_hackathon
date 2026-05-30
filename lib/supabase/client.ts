'use client';

export function createClient() {
  return {
    auth: {
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) return { error: { message: data.error ?? 'Login failed' } };
        return { error: null };
      },
      signUp: async ({ email, password }: { email: string; password: string }) => {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) return { data: { user: null }, error: { message: data.error ?? 'Register failed' } };
        return { data: { user: data.user }, error: null };
      },
      signOut: async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        return { error: null };
      },
      getUser: async () => {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return { data: { user: null } };
        const data = await res.json();
        return { data: { user: data.user } };
      },
    },
  };
}
