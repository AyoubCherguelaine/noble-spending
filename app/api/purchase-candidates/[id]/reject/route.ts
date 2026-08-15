import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  const { id } = await params;
  const candidate = await db.prepare('SELECT * FROM purchase_candidates WHERE id = ?').get(id) as any;
  if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.prepare('UPDATE purchase_candidates SET status = ? WHERE id = ?').run('rejected', id);
  return NextResponse.json({ success: true });
}
