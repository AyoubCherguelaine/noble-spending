import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';
import { toUsd, getRates } from '@/lib/currency';

export async function GET(request: Request) {
  await initSchema();

  const { searchParams } = new URL(request.url);
  const active = searchParams.get('active');

  let sql = 'SELECT * FROM recurring_transactions WHERE 1=1';
  const params: any[] = [];

  if (active === 'true') {
    sql += ' AND active = 1';
  }

  sql += ' ORDER BY next_occurrence ASC';
  const rows = await db.prepare(sql).all(...params);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    await initSchema();
    const body = await request.json();

    const {
      type = 'spend',
      category,
      method,
      account_id,
      merchant,
      original_currency = 'USD',
      original_amount,
      note = '',
      frequency = 'monthly',
      start_date,
      end_date,
      next_occurrence,
    } = body;

    if (!category || !merchant || !original_amount) {
      return NextResponse.json({ error: 'category, merchant, and original_amount are required' }, { status: 400 });
    }

    const amount = parseFloat(original_amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'original_amount must be a positive number' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const effectiveStart = start_date || today;
    const effectiveNext = next_occurrence || effectiveStart;

    const stmt = db.prepare(
      'INSERT INTO recurring_transactions (type, category, method, account_id, merchant, original_currency, original_amount, note, frequency, start_date, end_date, next_occurrence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const result = await stmt.run(
      type,
      category,
      method || '',
      account_id ? Number(account_id) : null,
      merchant.trim(),
      original_currency,
      amount,
      note,
      frequency,
      effectiveStart,
      end_date || null,
      effectiveNext
    );

    const row = await db.prepare('SELECT * FROM recurring_transactions WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('Failed to create recurring transaction:', e);
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    await initSchema();
    const body = await request.json();
    const { id, type, category, method, account_id, merchant, original_currency, original_amount, note, frequency, start_date, end_date, next_occurrence, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (type !== undefined) { updates.push('type = ?'); values.push(type); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (method !== undefined) { updates.push('method = ?'); values.push(method || ''); }
    if (account_id !== undefined) { updates.push('account_id = ?'); values.push(Number(account_id)); }
    if (merchant !== undefined) { updates.push('merchant = ?'); values.push(merchant.trim()); }
    if (original_currency !== undefined) { updates.push('original_currency = ?'); values.push(original_currency); }
    if (original_amount !== undefined) { updates.push('original_amount = ?'); values.push(parseFloat(original_amount)); }
    if (note !== undefined) { updates.push('note = ?'); values.push(note); }
    if (frequency !== undefined) { updates.push('frequency = ?'); values.push(frequency); }
    if (start_date !== undefined) { updates.push('start_date = ?'); values.push(start_date); }
    if (end_date !== undefined) { updates.push('end_date = ?'); values.push(end_date || null); }
    if (next_occurrence !== undefined) { updates.push('next_occurrence = ?'); values.push(next_occurrence); }
    if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    await db.prepare(`UPDATE recurring_transactions SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const row = await db.prepare('SELECT * FROM recurring_transactions WHERE id = ?').get(id);
    return NextResponse.json(row);
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

    await db.prepare('DELETE FROM recurring_transactions WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
