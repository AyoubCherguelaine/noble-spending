import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toUsd, getRates } from '@/lib/currency';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || '0', 10);
  const year = parseInt(searchParams.get('year') || '0', 10);

  let sql = 'SELECT * FROM salaries';
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
    const { company, role, gross, net, payday, type, date, month, year, currency } = body;
    if (!company?.trim() || !net) return NextResponse.json({ error: 'company and net are required' }, { status: 400 });

    const entryCurrency = currency || 'USD';
    const salaryDate = date || new Date().toISOString().split('T')[0];
    const salaryId = crypto.randomUUID();
    const stmt = db.prepare('INSERT INTO salaries (id, company, role, gross, net, payday, type, date, currency, month, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(salaryId, company.trim(), role || '', gross || 0, net, payday || '', type || '', salaryDate, entryCurrency, month || new Date().getMonth() + 1, year || new Date().getFullYear());
    const row = db.prepare('SELECT * FROM salaries WHERE id = ?').get(salaryId);

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, company, role, gross, net, payday, type, date, month, year, currency } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const entryCurrency = currency || 'USD';
    db.prepare('UPDATE salaries SET company = ?, role = ?, gross = ?, net = ?, payday = ?, type = ?, date = ?, currency = ?, month = ?, year = ? WHERE id = ?').run(company, role, gross, net, payday, type, date, entryCurrency, month, year, id);
    const row = db.prepare('SELECT * FROM salaries WHERE id = ?').get(id);

    const tx = db.prepare('SELECT * FROM transactions WHERE salary_id = ?').get(id) as any;
    if (tx) {
      const settingsRows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
      const settings: Record<string, string> = {};
      for (const r of settingsRows) settings[r.key] = r.value;
      const rates = getRates(settings);
      const amount = parseFloat(net);
      const converted = toUsd(amount, entryCurrency, rates);
      const salaryDate = date || tx.date;
      db.prepare('UPDATE transactions SET date = ?, merchant = ?, original_currency = ?, original_amount = ?, converted_amount = ?, note = ? WHERE id = ?').run(salaryDate, company.trim(), entryCurrency, amount, converted, `Salary: ${type || 'Full-time'}`, tx.id);
    }

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
    db.prepare('DELETE FROM transactions WHERE salary_id = ?').run(id);
    db.prepare('DELETE FROM salaries WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
