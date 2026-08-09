import { encrypt, decrypt } from './encryption';
import { db } from './db';

export interface GmailMessage {
  id: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
  bodyText?: string;
}

export async function getStoredToken(): Promise<string | null> {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'gmail_token_default'").get() as { value: string } | undefined;
  if (!row?.value) return null;
  try {
    return decrypt(row.value);
  } catch {
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  const encrypted = encrypt(token);
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('gmail_token_default', encrypted);
}

export async function searchGmailMessages(token: string, query: string): Promise<GmailMessage[]> {
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`;
  const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!listRes.ok) throw new Error('Gmail search failed');
  const listData = await listRes.json();
  const messages = listData.messages || [];

  const details = await Promise.all(
    messages.map(async (m: { id: string }) => {
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const headers: Record<string, string> = {};
      for (const h of data.payload?.headers || []) headers[h.name.toLowerCase()] = h.value;
      return {
        id: data.id,
        snippet: data.snippet || '',
        subject: headers['subject'],
        from: headers['from'],
        date: headers['date'],
        bodyText: data.snippet || '',
      } as GmailMessage;
    })
  );

  return details.filter((m): m is GmailMessage => m !== null);
}

export function extractPurchaseInfo(message: GmailMessage): { merchant?: string; amount?: number; currency?: string; date?: string; last4?: string; externalId: string } {
  const externalId = message.id;
  const raw = message.snippet || message.bodyText || '';
  const merchant: string | undefined = message.from?.replace(/<[^>]+>/g, '').trim() || message.subject?.trim();

  const amountMatch = raw.match(/(\d[\d\s]*[.,]\d{2})\s*(USD|EUR|DA|DZD)/i) || raw.match(/(USD|EUR|DA|DZD)\s*(\d[\d\s]*[.,]\d{2})/i);
  let amount: number | undefined;
  let currency = 'USD';
  if (amountMatch) {
    const numStr = (amountMatch[1] || amountMatch[2] || '').replace(/\s/g, '').replace(',', '.');
    amount = parseFloat(numStr) || undefined;
    currency = (amountMatch[3] || amountMatch[1] || 'USD').toUpperCase();
    if (currency === 'DA') currency = 'DA';
    else if (currency === 'DZD') currency = 'DA';
  }

  const last4Match = raw.match(/(?:ending|•••|\*{4}|carte)[:\s]*(\d{4})/i);
  const last4 = last4Match ? last4Match[1] : undefined;
  const dateStr = message.date ? new Date(message.date).toISOString().slice(0, 10) : undefined;

  return { merchant, amount, currency, date: dateStr, last4, externalId };
}
