import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';

export async function GET(request: Request) {
  try {
    await initSchema();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let sql = 'SELECT * FROM transaction_templates WHERE 1=1';
    const params: any[] = [];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = await db.prepare(sql).all(...params);
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    await initSchema();
    const body = await request.json();

    const {
      name,
      type = 'spend',
      category,
      method,
      account_id,
      merchant,
      original_currency = 'USD',
      original_amount,
      note = '',
    } = body;

    if (!name || !category || !merchant || !original_amount) {
      return NextResponse.json({ error: 'name, category, merchant, and original_amount are required' }, { status: 400 });
    }

    const stmt = db.prepare(
      'INSERT INTO transaction_templates (name, type, category, method, account_id, merchant, original_currency, original_amount, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const result = await stmt.run(
      name.trim(),
      type,
      category,
      method || '',
      account_id ? Number(account_id) : null,
      merchant.trim(),
      original_currency,
      parseFloat(original_amount),
      note
    );

    const row = await db.prepare('SELECT * FROM transaction_templates WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    await initSchema();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await db.prepare('DELETE FROM transaction_templates WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
