import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';
import { toUsd, getRates } from '@/lib/currency';

export async function GET(request: Request) {
  try {
    initSchema();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'transactions';
    const format = searchParams.get('format') || 'csv';

    if (type === 'transactions') {
      const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC, id DESC').all() as any[];

      if (format === 'json') {
        return NextResponse.json(transactions);
      }

      const headers = ['id', 'date', 'merchant', 'category', 'method', 'account_id', 'original_currency', 'original_amount', 'converted_amount', 'type', 'note'];
      const csvRows = [headers.join(',')];

      transactions.forEach((t: any) => {
        const row = headers.map(h => {
          const val = t[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
          return val;
        });
        csvRows.push(row.join(','));
      });

      const csv = csvRows.join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=transactions_${new Date().toISOString().split('T')[0]}.csv`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    initSchema();
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const expectedHeaders = ['date', 'merchant', 'category', 'method', 'account_id', 'original_currency', 'original_amount', 'type'];

    const hasRequired = expectedHeaders.every(h => headers.includes(h));
    if (!hasRequired) {
      return NextResponse.json({ error: `CSV must contain columns: ${expectedHeaders.join(', ')}` }, { status: 400 });
    }

    const settingsRows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const r of settingsRows) settings[r.key] = r.value;
    const rates = getRates(settings);
    const currency = settings.currency || 'USD';

    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length !== headers.length) {
        skipped++;
        continue;
      }

      const row: any = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx];
      });

      try {
        const amount = parseFloat(row.original_amount);
        if (isNaN(amount)) {
          skipped++;
          continue;
        }

        const converted = toUsd(amount, row.original_currency || 'USD', rates);
        const isTransfer = row.category === 'transfer' || row.method === 'transfer';
        let accountId = parseInt(row.account_id) || null;

        if (!isTransfer && !accountId) {
          const accounts = db.prepare('SELECT * FROM accounts ORDER BY currency, name').all() as any[];
          const match = accounts.find((a: any) => a.currency === (row.original_currency || 'USD'));
          accountId = match ? match.id : accounts[0]?.id;
        }

        if (!isTransfer && accountId) {
          const txType = row.type || 'spend';
          if (txType === 'income') {
            db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(Math.abs(amount), accountId);
          } else {
            db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(Math.abs(amount), accountId);
          }
        }

        db.prepare(
          'INSERT INTO transactions (date, merchant, category, method, account_id, original_currency, original_amount, converted_amount, type, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(row.date, row.merchant, row.category, row.method || '', accountId, row.original_currency || 'USD', amount, converted, row.type || 'spend', row.note || '');

        imported++;
      } catch (e) {
        skipped++;
        console.error(`Failed to import row ${i}:`, e);
      }
    }

    return NextResponse.json({ success: true, imported, skipped });
  } catch (e) {
    console.error('Import failed:', e);
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
