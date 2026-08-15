import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  let sql = 'SELECT * FROM merchants';
  const params: any[] = [];
  if (q) {
    sql += ' WHERE name LIKE ?';
    params.push(`%${q}%`);
  }
  sql += ' ORDER BY name LIMIT 50';
  const rows = await db.prepare(sql).all(...params);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const stmt = db.prepare('INSERT OR IGNORE INTO merchants (name, category) VALUES (?, ?)');
    await stmt.run(name.trim(), category || '');
    const row = await db.prepare('SELECT * FROM merchants WHERE name = ?').get(name.trim());
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
