import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const rows = await db.prepare('SELECT * FROM people ORDER BY name ASC').all();
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, note } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const stmt = db.prepare('INSERT INTO people (name, type, note) VALUES (?, ?, ?)');
    const result = await stmt.run(name.trim(), type || 'owe', note || '');
    const row = await db.prepare('SELECT * FROM people WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, type, note } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await db.prepare('UPDATE people SET name = ?, type = ?, note = ? WHERE id = ?').run(name, type, note, id);
    const row = await db.prepare('SELECT * FROM people WHERE id = ?').get(id);
    return NextResponse.json(row);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await db.prepare('DELETE FROM people WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
