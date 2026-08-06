import { NextResponse } from 'next/server';
import { issueToken, verifyPassword, getCredentials } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const creds = getCredentials();
    if (!creds) return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });

    if (username !== creds.username) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPassword(password, creds.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await issueToken(username);
    const response = NextResponse.json({ success: true });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
