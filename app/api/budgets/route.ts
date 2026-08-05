import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || '0', 10);
  const year = parseInt(searchParams.get('year') || '0', 10);

  let sql = 'SELECT * FROM budgets';
  const params: any[] = [];
  if (month && year) {
    sql += ' WHERE month = ? AND year = ?';
    params.push(month, year);
  }
  sql += ' ORDER BY year DESC, month DESC, id DESC';
  const rows = db.prepare(sql).all(...params);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category_key, budget_amount, month, year, currency } = body;
    if (!category_key?.trim()) return NextResponse.json({ error: 'category_key is required' }, { status: 400 });
    const stmt = db.prepare('INSERT INTO budgets (category_key, budget_amount, month, year, currency) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(category_key.trim(), budget_amount || 0, month || new Date().getMonth() + 1, year || new Date().getFullYear(), currency || 'USD');
    const row = db.prepare('SELECT * FROM budgets WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, category_key, budget_amount, month, year, currency } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    db.prepare('UPDATE budgets SET category_key = ?, budget_amount = ?, month = ?, year = ?, currency = ? WHERE id = ?').run(category_key, budget_amount, month, year, currency, id);
    const row = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
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
    db.prepare('DELETE FROM budgets WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
