import { NextResponse } from 'next/server';
import { initSchema } from '@/lib/schema';
import { db } from '@/lib/db';

export async function POST() {
  try {
    initSchema();
    db.exec('DELETE FROM transactions');
    db.exec('DELETE FROM salaries');
    db.exec('DELETE FROM services');
    db.exec('DELETE FROM subscriptions');
    db.exec('DELETE FROM bills');
    db.exec('DELETE FROM debts');
    db.exec('DELETE FROM budgets');
    db.exec('DELETE FROM categories');
    db.exec("DELETE FROM settings WHERE key != 'direction' AND key != 'language' AND key != 'currency' AND key != 'month' AND key != 'year'");
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
export async function GET() { return NextResponse.json({ message: 'POST to reset database' }); }
