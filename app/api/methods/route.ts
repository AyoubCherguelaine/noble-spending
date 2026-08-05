import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const rows = db.prepare('SELECT * FROM payment_methods ORDER BY name').all();
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, details, icon } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const stmt = db.prepare('INSERT INTO payment_methods (name, type, details, icon) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name.trim(), type || 'card', details || '', icon || '');
    const row = db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
