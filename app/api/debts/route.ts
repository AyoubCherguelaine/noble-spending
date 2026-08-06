import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  let sql = 'SELECT * FROM debts WHERE status != \'paid\'';
  const params: any[] = [];
  sql += ' ORDER BY year DESC, month DESC, id DESC';
  const rows = db.prepare(sql).all(...params);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { person, type, total, remaining, due, date, note, month, year, currency, status } = body;
    if (!person?.trim()) return NextResponse.json({ error: 'person is required' }, { status: 400 });
    const stmt = db.prepare('INSERT INTO debts (person, type, total, remaining, due, date, note, month, year, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(person.trim(), type || 'owe', total || 0, remaining || 0, due || '', date || '', note || '', month || new Date().getMonth() + 1, year || new Date().getFullYear(), currency || 'USD', status || 'active');
    const row = db.prepare('SELECT * FROM debts WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, person, type, total, remaining, due, date, note, month, year, currency, status } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    db.prepare('UPDATE debts SET person = ?, type = ?, total = ?, remaining = ?, due = ?, date = ?, note = ?, month = ?, year = ?, currency = ?, status = ? WHERE id = ?').run(person, type, total, remaining, due, date, note, month, year, currency, status || 'active', id);
    const row = db.prepare('SELECT * FROM debts WHERE id = ?').get(id);
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
    db.prepare('DELETE FROM debts WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
