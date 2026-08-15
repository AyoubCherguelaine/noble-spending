import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { initSchema } from '@/lib/schema';
import { db } from '@/lib/db';
import { getRuntimeEnv } from '@/lib/jwt-secret';

export async function GET() {
  try {
    if (getRuntimeEnv('AUTH_USERNAME') && getRuntimeEnv('AUTH_PASSWORD')) {
      return NextResponse.json({ hasUser: true });
    }
    initSchema();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'auth_username'").get() as { value: string } | undefined;
    return NextResponse.json({ hasUser: !!row?.value });
  } catch {
    return NextResponse.json({ hasUser: false });
  }
}

export async function POST(request: Request) {
  try {
    if (getRuntimeEnv('AUTH_USERNAME') && getRuntimeEnv('AUTH_PASSWORD')) {
      return NextResponse.json({ error: 'Authentication is configured by the deployment environment' }, { status: 409 });
    }
    initSchema();
    const { username, password } = await request.json();
    if (!username || !password || password.length < 6) {
      return NextResponse.json({ error: 'Username and password (min 6 chars) are required' }, { status: 400 });
    }

    const hash = await hashPassword(password);
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('auth_username', username);
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('auth_password_hash', hash);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 400 });
  }
}
