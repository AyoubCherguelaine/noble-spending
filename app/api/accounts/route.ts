import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';

export async function GET() {
  initSchema();
  const rows = db.prepare('SELECT * FROM accounts ORDER BY currency, name').all();
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    initSchema();
    const body = await request.json();
    const { name, type, currency, details, icon, openingBalance } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });

    const stmt = db.prepare('INSERT INTO accounts (name, type, currency, details, icon, balance) VALUES (?, ?, ?, ?, ?, ?)');
    const balance = parseFloat(openingBalance || '0');
    const result = stmt.run(name.trim(), type || 'bank', currency || 'USD', details || '', icon || '', balance);
    const row = db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    initSchema();
    const body = await request.json();
    const { id, name, type, currency, details, icon, balance } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    db.prepare('UPDATE accounts SET name = ?, type = ?, currency = ?, details = ?, icon = ?, balance = ? WHERE id = ?')
      .run(name, type, currency, details || '', icon || '', parseFloat(balance || '0'), id);
    const row = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    return NextResponse.json(row);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    initSchema();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const txCount = (db.prepare('SELECT COUNT(*) as count FROM transactions WHERE account_id = ?').get(id) as any).count;
    if (txCount > 0) {
      return NextResponse.json({ error: 'Cannot delete account with existing transactions. Remove transactions first.' }, { status: 400 });
    }

    db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

