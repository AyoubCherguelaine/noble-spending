import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';
import { toUsd, getRates, convertToDisplay } from '@/lib/currency';

export async function GET(request: Request) {
  await initSchema();

  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const category = url.searchParams.get('category') || '';
  const type = url.searchParams.get('type') || '';
  const account = url.searchParams.get('account') || '';
  const startDate = url.searchParams.get('startDate') || '';
  const endDate = url.searchParams.get('endDate') || '';
  const minAmount = url.searchParams.get('minAmount') || '';
  const maxAmount = url.searchParams.get('maxAmount') || '';

  const settingsRows = await db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const r of settingsRows) settings[r.key] = r.value;
  const currency = settings.currency || 'USD';
  const rates = getRates(settings);

  let sql = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (q) {
    sql += ' AND (merchant LIKE ? OR category LIKE ? OR method LIKE ? OR note LIKE ?)';
    const pattern = `%${q}%`;
    params.push(pattern, pattern, pattern, pattern);
  }

  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (account) { sql += ' AND account_id = ?'; params.push(parseInt(account)); }
  if (startDate) { sql += ' AND date >= ?'; params.push(startDate); }
  if (endDate) { sql += ' AND date <= ?'; params.push(endDate); }
  if (minAmount) { sql += ' AND ABS(original_amount) >= ?'; params.push(parseFloat(minAmount)); }
  if (maxAmount) { sql += ' AND ABS(original_amount) <= ?'; params.push(parseFloat(maxAmount)); }

  sql += ' ORDER BY date DESC, id DESC';
  const rows = await db.prepare(sql).all(...params) as any[];

  const results = rows.map((t: any) => ({
    id: t.id,
    date: t.date,
    merchant: t.merchant,
    category: t.category,
    method: t.method,
    account_id: t.account_id,
    original_currency: t.original_currency,
    original_amount: t.original_amount,
    converted_amount: t.converted_amount,
    type: t.type,
    note: t.note,
    amount_display: convertToDisplay(parseFloat(t.converted_amount || 0), 'USD', currency, rates),
  }));

  return NextResponse.json({
    query: q,
    results,
    count: results.length,
  });
}
