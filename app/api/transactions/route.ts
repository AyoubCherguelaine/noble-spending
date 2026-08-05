import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toUsd, getRates } from '@/lib/currency';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const q = searchParams.get('q');
  const type = searchParams.get('type');

  let sql = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (q) { sql += ' AND (merchant LIKE ? OR category LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }

  sql += ' ORDER BY date DESC, id DESC';
  const rows = db.prepare(sql).all(...params);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, merchant, category, method, original_currency, original_amount, type, note, salary_id } = body;
    const amount = parseFloat(original_amount);
    const settingsRows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const r of settingsRows) settings[r.key] = r.value;
    const rates = getRates(settings);
    const converted = toUsd(amount, original_currency || 'USD', rates);

    const stmt = db.prepare(
      'INSERT INTO transactions (date, merchant, category, method, original_currency, original_amount, converted_amount, type, note, salary_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(date, merchant.trim(), category, method || '', original_currency, amount, converted, type || 'spend', note || '', salary_id || '');
    const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('Failed to insert transaction:', e);
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, date, merchant, category, method, original_currency, original_amount, type, note, salary_id } = body;
    const amount = parseFloat(original_amount);
    const settingsRows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const r of settingsRows) settings[r.key] = r.value;
    const rates = getRates(settings);
    const converted = toUsd(amount, original_currency || 'USD', rates);

    db.prepare('UPDATE transactions SET date = ?, merchant = ?, category = ?, method = ?, original_currency = ?, original_amount = ?, converted_amount = ?, type = ?, note = ?, salary_id = ? WHERE id = ?').run(date, merchant.trim(), category, method || '', original_currency, amount, converted, type || 'spend', note || '', salary_id || '', id);
    const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);

    if (salary_id) {
      const salary = db.prepare('SELECT * FROM salaries WHERE id = ?').get(salary_id) as any;
      if (salary) {
        db.prepare('UPDATE salaries SET date = ? WHERE id = ?').run(date, salary_id);
      }
    }

    return NextResponse.json(row);
  } catch (e) {
    console.error('Failed to update transaction:', e);
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
    if (tx && tx.salary_id) {
      db.prepare('DELETE FROM salaries WHERE id = ?').run(tx.salary_id);
    }
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
