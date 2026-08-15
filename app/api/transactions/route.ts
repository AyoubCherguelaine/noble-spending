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
  const rows = await db.prepare(sql).all(...params);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, merchant, category, method, account_id, original_currency, original_amount, type, note, salary_id } = body;

    if (!account_id) {
      return NextResponse.json({ error: 'account_id is required. Every transaction must be linked to an account.' }, { status: 400 });
    }

    const amount = parseFloat(original_amount);
    const settingsRows = await db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const r of settingsRows) settings[r.key] = r.value;
    const rates = getRates(settings);
    const converted = toUsd(amount, original_currency || 'USD', rates);

    const account = await db.prepare('SELECT * FROM accounts WHERE id = ?').get(account_id) as any;
    if (!account) {
      return NextResponse.json({ error: 'Invalid account_id' }, { status: 400 });
    }

    const effectiveCurrency = original_currency || account.currency || 'USD';

    const stmt = db.prepare(
      'INSERT INTO transactions (date, merchant, category, method, account_id, original_currency, original_amount, converted_amount, type, note, salary_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const result = await stmt.run(date, merchant.trim(), category, method || '', account_id, effectiveCurrency, amount, converted, type || 'spend', note || '', salary_id || '');

    const isTransfer = category === 'transfer' || method === 'transfer';
    if (!isTransfer) {
      const accountType = type || 'spend';
      if (accountType === 'income') {
        await db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(Math.abs(amount), account_id);
      } else {
        await db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(Math.abs(amount), account_id);
      }
    }

    const row = await db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('Failed to insert transaction:', e);
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, date, merchant, category, method, account_id, original_currency, original_amount, type, note, salary_id } = body;

    if (!account_id) {
      return NextResponse.json({ error: 'account_id is required. Every transaction must be linked to an account.' }, { status: 400 });
    }

    const amount = parseFloat(original_amount);
    const settingsRows = await db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const r of settingsRows) settings[r.key] = r.value;
    const rates = getRates(settings);
    const converted = toUsd(amount, original_currency || 'USD', rates);

    const existing = await db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;

    const isTransfer = category === 'transfer' || method === 'transfer';

    if (existing?.account_id && !isTransfer) {
      const oldType = existing.type || 'spend';
      const oldAmount = Math.abs(existing.original_amount || 0);
      if (oldType === 'income') {
        await db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(oldAmount, existing.account_id);
      } else {
        await db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(oldAmount, existing.account_id);
      }
    }

    const account = await db.prepare('SELECT * FROM accounts WHERE id = ?').get(account_id) as any;
    if (!account) {
      return NextResponse.json({ error: 'Invalid account_id' }, { status: 400 });
    }

    const effectiveCurrency = original_currency || account.currency || 'USD';

    await db.prepare('UPDATE transactions SET date = ?, merchant = ?, category = ?, method = ?, account_id = ?, original_currency = ?, original_amount = ?, converted_amount = ?, type = ?, note = ?, salary_id = ? WHERE id = ?')
      .run(date, merchant.trim(), category, method || '', account_id, effectiveCurrency, amount, converted, type || 'spend', note || '', salary_id || '', id);

    if (!isTransfer) {
      const newType = type || 'spend';
      if (newType === 'income') {
        await db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(Math.abs(amount), account_id);
      } else {
        await db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(Math.abs(amount), account_id);
      }
    }

    const row = await db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);

    if (salary_id) {
      const salary = await db.prepare('SELECT * FROM salaries WHERE id = ?').get(salary_id) as any;
      if (salary) {
        await db.prepare('UPDATE salaries SET date = ? WHERE id = ?').run(date, salary_id);
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
    const tx = await db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
    if (tx) {
      if (tx.salary_id) {
        await db.prepare('DELETE FROM salaries WHERE id = ?').run(tx.salary_id);
      }
      if (tx.account_id && tx.category !== 'transfer' && tx.method !== 'transfer') {
        const txType = tx.type || 'spend';
        const txAmount = Math.abs(tx.original_amount || 0);
        if (txType === 'income') {
          await db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(txAmount, tx.account_id);
        } else {
          await db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(txAmount, tx.account_id);
        }
      }
    }
    await db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
