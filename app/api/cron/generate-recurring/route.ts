import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';
import { toUsd, getRates } from '@/lib/currency';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function addWeeks(dateStr: string, weeks: number): string {
  return addDays(dateStr, weeks * 7);
}

function getNextOccurrence(dateStr: string, frequency: string): string {
  switch (frequency) {
    case 'daily': return addDays(dateStr, 1);
    case 'weekly': return addWeeks(dateStr, 1);
    case 'biweekly': return addWeeks(dateStr, 2);
    case 'monthly': return addMonths(dateStr, 1);
    case 'quarterly': return addMonths(dateStr, 3);
    case 'yearly': return addMonths(dateStr, 12);
    default: return addMonths(dateStr, 1);
  }
}

export async function POST(request: Request) {
  try {
    initSchema();

    const today = new Date().toISOString().split('T')[0];
    const settingsRows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const r of settingsRows) settings[r.key] = r.value;
    const rates = getRates(settings);
    const currency = settings.currency || 'USD';

    const recurring = db.prepare('SELECT * FROM recurring_transactions WHERE active = 1 AND next_occurrence <= ?').all(today) as any[];

    let generated = 0;

    for (const item of recurring) {
      if (item.end_date && item.next_occurrence > item.end_date) {
        db.prepare('UPDATE recurring_transactions SET active = 0 WHERE id = ?').run(item.id);
        continue;
      }

      const amount = parseFloat(item.original_amount) || 0;
      const converted = toUsd(amount, item.original_currency || 'USD', rates);

      const isTransfer = item.category === 'transfer' || item.method === 'transfer';
      let accountId = item.account_id;

      if (!isTransfer && !accountId) {
        const accounts = db.prepare('SELECT * FROM accounts ORDER BY currency, name').all() as any[];
        const match = accounts.find((a: any) => a.currency === (item.original_currency || 'USD'));
        accountId = match ? match.id : accounts[0]?.id;
      }

      if (!isTransfer && accountId) {
        const existing = db.prepare('SELECT * FROM transactions WHERE date = ? AND merchant = ? AND account_id = ? AND converted_amount = ?').get(item.next_occurrence, item.merchant, accountId, converted) as any;
        if (existing) {
          db.prepare('UPDATE recurring_transactions SET next_occurrence = ? WHERE id = ?').run(getNextOccurrence(item.next_occurrence, item.frequency), item.id);
          continue;
        }
      }

      const stmt = db.prepare(
        'INSERT INTO transactions (date, merchant, category, method, account_id, original_currency, original_amount, converted_amount, type, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );

      const result = stmt.run(
        item.next_occurrence,
        item.merchant,
        item.category,
        item.method || '',
        accountId,
        item.original_currency || 'USD',
        amount,
        converted,
        item.type || 'spend',
        item.note || ''
      );

      if (!isTransfer && accountId) {
        const txType = item.type || 'spend';
        if (txType === 'income') {
          db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(Math.abs(amount), accountId);
        } else {
          db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(Math.abs(amount), accountId);
        }
      }

      const nextDate = getNextOccurrence(item.next_occurrence, item.frequency);
      db.prepare('UPDATE recurring_transactions SET next_occurrence = ?, last_generated_at = ? WHERE id = ?').run(nextDate, today, item.id);

      generated++;
    }

    return NextResponse.json({ success: true, generated });
  } catch (e) {
    console.error('Failed to generate recurring transactions:', e);
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
