import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';

export async function GET() {
  initSchema();
  const rows = db.prepare('SELECT * FROM purchase_candidates ORDER BY created_at DESC').all();
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  initSchema();
  try {
    const body = await request.json();
    const stmt = db.prepare(`
      INSERT INTO purchase_candidates (source, external_id, merchant, purchase_date, amount, currency, card_last4, matched_method_id, category, note, confidence, raw_text, place_id, latitude, longitude, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      body.source, body.externalId, body.merchant, body.purchaseDate, body.amount, body.currency,
      body.cardLast4, body.matchedMethodId, body.category, body.note, body.confidence || 0,
      body.rawText, body.placeId, body.latitude, body.longitude, 'pending'
    );
    const row = db.prepare('SELECT * FROM purchase_candidates WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
