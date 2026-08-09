import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE() {
  db.prepare("DELETE FROM settings WHERE key = 'gmail_token_default'").run();
  return NextResponse.json({ success: true });
}
