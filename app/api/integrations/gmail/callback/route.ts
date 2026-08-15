import { NextResponse } from 'next/server';
import { storeToken } from '@/lib/gmail';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const baseUrl = `${url.protocol}//${url.host}`;
  if (state === 'auth') return NextResponse.redirect(`${baseUrl}/login?error=google_auth_disabled`);
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

  const accessToken = tokenData.access_token;
  if (!accessToken) return NextResponse.redirect(`${baseUrl}/?error=no_token`);
  await storeToken(accessToken);
  return NextResponse.redirect(`${baseUrl}/?gmail=connected`);
}
