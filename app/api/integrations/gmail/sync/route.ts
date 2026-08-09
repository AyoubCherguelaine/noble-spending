import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';
import { searchGmailMessages, extractPurchaseInfo, getStoredToken } from '@/lib/gmail';

export async function POST() {
  initSchema();
  const accessToken = await getStoredToken();
  if (!accessToken) return NextResponse.json({ error: 'Not connected' }, { status: 400 });

  try {
    const messages = await searchGmailMessages(accessToken, 'newer_than:90d (receipt OR invoice OR order OR purchase OR reçu OR facture OR commande OR paiement)');
    let imported = 0;
    for (const msg of messages) {
      const info = extractPurchaseInfo(msg);
      if (!info.amount || !info.merchant) continue;
      const exists = db.prepare('SELECT id FROM purchase_candidates WHERE source = ? AND external_id = ?').get('gmail', info.externalId) as any;
      if (exists) continue;
      db.prepare(`
        INSERT INTO purchase_candidates (source, external_id, merchant, purchase_date, amount, currency, card_last4, confidence, raw_text, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('gmail', info.externalId, info.merchant, info.date, info.amount, info.currency, info.last4, 0.7, msg.snippet, 'pending');
      imported++;
    }
    return NextResponse.json({ imported });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
