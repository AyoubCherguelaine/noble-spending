import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, getCredentials } from '@/lib/auth';

export async function GET() {
  const rows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  const hasAuth = !!settings.auth_username;
  return NextResponse.json({ ...settings, hasAuth });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === 'changeCredentials') {
      const creds = getCredentials();
      if (!creds) return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });

      const { currentUsername, currentPassword, newUsername, newPassword } = body;
      if (currentUsername !== creds.username) {
        return NextResponse.json({ error: 'Invalid current credentials' }, { status: 401 });
      }
      const valid = await verifyPassword(currentPassword, creds.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid current credentials' }, { status: 401 });
      }

      const newHash = await hashPassword(newPassword);
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('auth_username', newUsername);
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('auth_password_hash', newHash);
      return NextResponse.json({ success: true });
    }

    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(body)) stmt.run(k, String(v));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
