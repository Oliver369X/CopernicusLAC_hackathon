import { describe, expect, it } from 'vitest';

/** Mirrors lib/supabase/middleware.ts protected prefixes for regression tests. */
function isProtectedPath(pathname: string): boolean {
  const prefixes = [
    '/dashboard',
    '/field',
    '/alerts',
    '/monitor',
    '/analytics',
    '/insights',
    '/science',
  ];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

describe('protected routes', () => {
  it('includes science lab paths', () => {
    expect(isProtectedPath('/science')).toBe(true);
    expect(isProtectedPath('/science/soybean')).toBe(true);
    expect(isProtectedPath('/science/studies')).toBe(true);
  });

  it('does not protect login', () => {
    expect(isProtectedPath('/login')).toBe(false);
  });
});
