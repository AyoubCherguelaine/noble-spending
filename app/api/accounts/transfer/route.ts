import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';
import { toUsd, convertToDisplay, getRates } from '@/lib/currency';

export async function POST(request: Request) {
  try {
    await initSchema();
    const body = await request.json();
    const { fromAccountId, toAccountId, amount, date, note, rate } = body;

    if (!fromAccountId || !toAccountId || !amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid transfer parameters' }, { status: 400 });
    }
    if (fromAccountId === toAccountId) {
      return NextResponse.json({ error: 'Cannot transfer to the same account' }, { status: 400 });
    }

    const fromAccount = await db.prepare('SELECT * FROM accounts WHERE id = ?').get(fromAccountId) as any;
    const toAccount = await db.prepare('SELECT * FROM accounts WHERE id = ?').get(toAccountId) as any;

    if (!fromAccount || !toAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const transferAmount = parseFloat(amount);
    const settingsRows = await db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const r of settingsRows) settings[r.key] = r.value;
    const rates = getRates(settings);

    const fromCurrency = fromAccount.currency;
    const toCurrency = toAccount.currency;

    let convertedAmount = transferAmount;
    if (fromCurrency !== toCurrency) {
      convertedAmount = convertToDisplay(transferAmount, fromCurrency, toCurrency, rates);
    }

    const fromUsdVal = toUsd(transferAmount, fromCurrency, rates);
    const toUsdVal = toUsd(convertedAmount, toCurrency, rates);

    if (fromAccount.balance < transferAmount) {
      return NextResponse.json({ error: 'Insufficient balance in source account' }, { status: 400 });
    }

    const transferDate = date || new Date().toISOString().split('T')[0];
    const transferNote = note || 'Transfer';

    await db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(transferAmount, fromAccountId);
    await db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(convertedAmount, toAccountId);

    const outStmt = db.prepare(
      'INSERT INTO transactions (date, merchant, category, method, account_id, original_currency, original_amount, converted_amount, type, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const outResult = await outStmt.run(transferDate, transferNote, 'transfer', 'transfer', fromAccountId, fromCurrency, -transferAmount, -fromUsdVal, 'spend', `Transfer to ${toAccount.name}`);

    const inStmt = db.prepare(
      'INSERT INTO transactions (date, merchant, category, method, account_id, original_currency, original_amount, converted_amount, type, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const inResult = await inStmt.run(transferDate, transferNote, 'transfer', 'transfer', toAccountId, toCurrency, convertedAmount, toUsdVal, 'income', `Transfer from ${fromAccount.name}`);

    return NextResponse.json({
      success: true,
      outTransaction: await db.prepare('SELECT * FROM transactions WHERE id = ?').get(outResult.lastInsertRowid),
      inTransaction: await db.prepare('SELECT * FROM transactions WHERE id = ?').get(inResult.lastInsertRowid),
      fromAccount: await db.prepare('SELECT * FROM accounts WHERE id = ?').get(fromAccountId),
      toAccount: await db.prepare('SELECT * FROM accounts WHERE id = ?').get(toAccountId),
    });
  } catch (e) {
    console.error('Transfer failed:', e);
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
