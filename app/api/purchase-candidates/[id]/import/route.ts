import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';
import { importCandidate } from '@/lib/purchase-import';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  try {
    const { id } = await params;
    const candidate = await db.prepare('SELECT * FROM purchase_candidates WHERE id = ?').get(id) as any;
    if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const settingsRows = await db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const r of settingsRows) settings[r.key] = r.value;

    const transaction = await importCandidate(candidate, settings);

    await db.prepare('UPDATE purchase_candidates SET status = ? WHERE id = ?').run('imported', id);

    return NextResponse.json(transaction);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
