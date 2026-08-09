import { NextResponse } from 'next/server';
import { storeToken } from '@/lib/gmail';
import { issueToken } from '@/lib/auth';
import { initSchema } from '@/lib/schema';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const baseUrl = `${url.protocol}//${url.host}`;
  if (error) return NextResponse.redirect(`${baseUrl}/login?error=oauth_denied`);
  if (!code) return NextResponse.redirect(`${baseUrl}/login?error=missing_code`);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId || '',
      client_secret: clientSecret || '',
      redirect_uri: redirectUri || '',
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) return NextResponse.redirect(`${baseUrl}/login?error=token_failed`);
  const tokenData = await tokenRes.json();

  if (state === 'auth') {
    const idToken = tokenData.id_token;
    if (!idToken) return NextResponse.redirect(`${baseUrl}/login?error=no_token`);
    const payloadRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!payloadRes.ok) return NextResponse.redirect(`${baseUrl}/login?error=invalid_token`);
    const payload = await payloadRes.json();
    const email = payload.email;
    if (!email) return NextResponse.redirect(`${baseUrl}/login?error=no_email`);

    initSchema();
    const existing = db.prepare("SELECT value FROM settings WHERE key = 'auth_username'").get() as { value: string } | undefined;
    const username = existing?.value || email.split('@')[0];

    if (!existing?.value) {
      const randomPassword = crypto.randomUUID();
      const { hashPassword } = await import('@/lib/auth');
      const hash = await hashPassword(randomPassword);
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('auth_username', username);
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('auth_password_hash', hash);
    }

    const token = await issueToken(username);
    const response = NextResponse.redirect(`${baseUrl}/`);
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  }

  const accessToken = tokenData.access_token;
  if (!accessToken) return NextResponse.redirect(`${baseUrl}/?error=no_token`);
  await storeToken(accessToken);
  return NextResponse.redirect(`${baseUrl}/?gmail=connected`);
}
