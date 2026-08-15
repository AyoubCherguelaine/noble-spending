import { db } from './db';
import { toUsd } from './currency';
import type { PurchaseCandidate } from '@/types';

export async function importCandidate(candidate: PurchaseCandidate, settings: Record<string, string>): Promise<Record<string, unknown>> {
  const rates = {
    rate_eur: parseFloat(settings.rate_eur || '1.14'),
    rate_da: parseFloat(settings.rate_da || '134.4'),
    rate_eur_da: parseFloat(settings.rate_eur_da || '146'),
  };

  const originalAmount = candidate.amount || 0;
  const currency = candidate.currency || 'USD';
  const convertedAmount = -Math.abs(toUsd(originalAmount, currency, rates));

  let merchantId: number | undefined;
  if (candidate.merchant?.trim()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await db.prepare('SELECT id FROM merchants WHERE name = ?').get(candidate.merchant.trim()) as any;
    if (existing) {
      merchantId = existing.id;
      if (candidate.category) {
        await db.prepare('UPDATE merchants SET category = ? WHERE id = ?').run(candidate.category, merchantId);
      }
    } else {
      const result = await db.prepare('INSERT INTO merchants (name, category) VALUES (?, ?)').run(candidate.merchant.trim(), candidate.category || null);
      merchantId = result.lastInsertRowid as number;
    }
  }

  let accountId: number | undefined;
  if (candidate.matchedMethodId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const method = await db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(candidate.matchedMethodId) as any;
    if (method?.details) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const acc = await db.prepare('SELECT id FROM accounts WHERE details LIKE ? LIMIT 1').get(`%${method.details}%`) as any;
      if (acc) accountId = acc.id;
    }
  }
  if (!accountId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstAccount = await db.prepare('SELECT id FROM accounts LIMIT 1').get() as any;
    if (firstAccount) accountId = firstAccount.id;
  }

  const stmt = db.prepare(`
    INSERT INTO transactions (date, merchant, category, method, account_id, original_currency, original_amount, converted_amount, type, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = await stmt.run(
    candidate.purchaseDate || new Date().toISOString().slice(0, 10),
    candidate.merchant || 'Unknown',
    candidate.category || 'daily',
    candidate.cardLast4 ? `Card ending ${candidate.cardLast4}` : 'Unknown',
    accountId,
    currency,
    originalAmount,
    convertedAmount,
    'spend',
    candidate.note || `Imported from ${candidate.source}`
  );

  if (accountId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const account = await db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId) as any;
    if (account) {
      const newBalance = parseFloat(account.balance || 0) + convertedAmount;
      await db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBalance, accountId);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transaction = await db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid) as any;
  return transaction;
}
