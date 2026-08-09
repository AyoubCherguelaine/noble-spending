import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getSecretFromFile, COOKIE_NAME } from '@/lib/jwt-secret';
import { hasUser } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/api/auth/login', '/api/auth/logout', '/setup', '/api/auth/setup', '/api/analytics', '/api/templates', '/api/cron/generate-recurring', '/api/import-export'];
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith('/_next/') || pathname === '/favicon.ico');

  if (isPublic) {
    return NextResponse.next();
  }

  if (!hasUser()) {
    const setupUrl = new URL('/setup', request.url);
    return NextResponse.redirect(setupUrl);
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = getSecretFromFile();
    const secretKey = new TextEncoder().encode(secret);
    await jwtVerify(token, secretKey);
  } catch {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
