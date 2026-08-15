import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toUsd, getRates } from '@/lib/currency';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || '0', 10);
  const year = parseInt(searchParams.get('year') || '0', 10);

  let sql = 'SELECT * FROM services';
  const params: any[] = [];
  if (month && year) {
    sql += ' WHERE month = ? AND year = ?';
    params.push(month, year);
  }
  sql += ' ORDER BY year DESC, month DESC, id DESC';
  const rows = await db.prepare(sql).all(...params);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, terms, amount, status, next_invoice, month, year, currency } = body;
    if (!name?.trim() || !amount) return NextResponse.json({ error: 'name and amount are required' }, { status: 400 });
    const stmt = db.prepare('INSERT INTO services (name, description, terms, amount, status, next_invoice, month, year, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const result = await stmt.run(name.trim(), description || '', terms || '', amount, status || 'Active', next_invoice || '', month || new Date().getMonth() + 1, year || new Date().getFullYear(), currency || 'USD');
    const row = await db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);

    const settingsRows = await db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const r of settingsRows) settings[r.key] = r.value;
    const rates = getRates(settings);
    const entryCurrency = currency || 'USD';
    const numAmount = parseFloat(amount) || 0;
    const converted = toUsd(numAmount, entryCurrency, rates);

    const today = new Date().toISOString().split('T')[0];
    await db.prepare('INSERT INTO transactions (date, merchant, category, method, original_currency, original_amount, converted_amount, type, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(today, name.trim(), 'income', 'Service', entryCurrency, numAmount, converted, 'income', `Service: ${status || 'Active'}`);

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, terms, amount, status, next_invoice, month, year, currency } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await db.prepare('UPDATE services SET name = ?, description = ?, terms = ?, amount = ?, status = ?, next_invoice = ?, month = ?, year = ?, currency = ? WHERE id = ?').run(name, description, terms, amount, status, next_invoice, month, year, currency, id);
    const row = await db.prepare('SELECT * FROM services WHERE id = ?').get(id);
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
    await db.prepare('DELETE FROM services WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
