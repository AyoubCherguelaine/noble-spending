import { NextResponse } from 'next/server';
import { initSchema } from '@/lib/schema';
import { db } from '@/lib/db';

export async function POST() {
  try {
    await initSchema();
    await db.exec('DELETE FROM transactions');
    await db.exec('DELETE FROM salaries');
    await db.exec('DELETE FROM services');
    await db.exec('DELETE FROM subscriptions');
    await db.exec('DELETE FROM bills');
    await db.exec('DELETE FROM debts');
    await db.exec('DELETE FROM budgets');
    await db.exec('DELETE FROM categories');
    await db.exec("DELETE FROM settings WHERE key != 'direction' AND key != 'language' AND key != 'currency' AND key != 'month' AND key != 'year'");
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
export async function GET() { return NextResponse.json({ message: 'POST to reset database' }); }
