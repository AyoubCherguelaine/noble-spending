import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toUsd, getRates } from '@/lib/currency';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || '0', 10);
  const year = parseInt(searchParams.get('year') || '0', 10);

  let sql = 'SELECT * FROM subscriptions';
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
    const { name, plan, cost, next_billing, month, year, currency } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const stmt = db.prepare('INSERT INTO subscriptions (name, plan, cost, next_billing, month, year, currency) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const result = await stmt.run(name.trim(), plan || '', cost || 0, next_billing || '', month || new Date().getMonth() + 1, year || new Date().getFullYear(), currency || 'USD');
    const row = await db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(result.lastInsertRowid);
    
    const settingsRows = await db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const r of settingsRows) settings[r.key] = r.value;
    const rates = getRates(settings);
    const entryCurrency = currency || 'USD';
    const amount = parseFloat(cost) || 0;
    const converted = toUsd(amount, entryCurrency, rates);
    const today = new Date().toISOString().split('T')[0];
    await db.prepare('INSERT INTO transactions (date, merchant, category, method, original_currency, original_amount, converted_amount, type, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(today, name.trim(), 'subs', 'Subscription', entryCurrency, amount, converted, 'spend', `Subscription: ${plan || 'monthly'}`);
    
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, plan, cost, next_billing, month, year, currency } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await db.prepare('UPDATE subscriptions SET name = ?, plan = ?, cost = ?, next_billing = ?, month = ?, year = ?, currency = ? WHERE id = ?').run(name, plan, cost, next_billing, month, year, currency, id);
    const row = await db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id);
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
    await db.prepare('DELETE FROM subscriptions WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
