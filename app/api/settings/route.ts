import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const rows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(body)) stmt.run(k, String(v));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
