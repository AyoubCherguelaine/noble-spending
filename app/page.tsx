import DashboardClient from '@/components/DashboardClient';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';

async function getInitialData() {
  initSchema();

  const now = new Date();
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();

  const settingsRows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const r of settingsRows) settings[r.key] = r.value;

  const month = parseInt(settings.month || String(defaultMonth), 10);
  const year = parseInt(settings.year || String(defaultYear), 10);
  const monthStr = String(month).padStart(2, '0');

  const salaries = db.prepare('SELECT * FROM salaries WHERE month = ? AND year = ?').all(month, year);
  const services = db.prepare('SELECT * FROM services WHERE month = ? AND year = ?').all(month, year);
  const subs = db.prepare('SELECT * FROM subscriptions WHERE month = ? AND year = ?').all(month, year);
  const bills = db.prepare('SELECT * FROM bills WHERE month = ? AND year = ?').all(month, year);
  const debtsOwe = db.prepare('SELECT * FROM debts WHERE type = \'owe\' AND month = ? AND year = ?').all(month, year);
  const debtsOwed = db.prepare('SELECT * FROM debts WHERE type = \'owed\' AND month = ? AND year = ?').all(month, year);
  const budgets = db.prepare('SELECT * FROM budgets WHERE month = ? AND year = ?').all(month, year);
  const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC, id DESC').all();

  const salaryTotal = salaries.reduce((a: number, s: any) => a + s.net, 0);
  const serviceTotal = services.reduce((a: number, s: any) => a + s.amount, 0);
  const subsTotal = subs.reduce((a: number, s: any) => a + s.cost, 0);
  const billsTotal = bills.reduce((a: number, s: any) => a + s.cost, 0);
  const debtOweTot = debtsOwe.reduce((a: number, d: any) => a + d.remaining, 0);
  const debtOwedTot = debtsOwed.reduce((a: number, d: any) => a + d.remaining, 0);

  const spendByCat: Record<string, number> = { housing: 0, daily: 0, online: 0, real: 0, subs: 0, transport: 0, debt: 0, savings: 0 };
  const monthTxs = transactions.filter((t: any) => t.date.startsWith(`2026-${monthStr}`));
  monthTxs.forEach((t: any) => {
    if (t.type === 'spend' && spendByCat[t.category] !== undefined) {
      spendByCat[t.category] += Math.abs(t.converted_amount);
    }
  });
  const totalOut = Object.values(spendByCat).reduce((a, b) => a + b, 0);
  const incomeTxTotal = monthTxs.filter((t: any) => t.type === 'income').reduce((a: number, t: any) => a + t.converted_amount, 0);
  const totalIn = incomeTxTotal;
  const rest = totalIn - totalOut;

  const txRows = transactions.map((t: any) => ({
    id: t.id, date: t.date, merchant: t.merchant, category: t.category, method: t.method,
    original_currency: t.original_currency, original_amount: t.original_amount,
    converted_amount: t.converted_amount,
    amount: `${t.converted_amount >= 0 ? '+' : ''}${t.converted_amount.toFixed(2)}`,
    color: t.converted_amount > 0 ? '#4ade80' : '#e6edf3',
    dotStyle: { width: 7, height: 7, borderRadius: 2, background: t.category === 'income' ? '#4ade80' : '#94a3b8', display: 'inline-block' }
  }));

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const trend: { month: string; income: number; spend: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    const mmStr = String(d.getMonth() + 1).padStart(2, '0');

    const monthTransactions = db.prepare('SELECT * FROM transactions WHERE strftime(\'%Y-%m\', date) = ?').all(`${d.getFullYear()}-${mmStr}`);
    const income = monthTransactions.filter((t: any) => t.type === 'income').reduce((a: number, t: any) => a + t.converted_amount, 0);
    const spend = monthTransactions.filter((t: any) => t.type === 'spend').reduce((a: number, t: any) => a + Math.abs(t.converted_amount), 0);

    trend.push({ month: label, income, spend });
  }

  const upcoming: { name: string; when: string; kind: string; amount: string; in: string }[] = [];
  subs.forEach((s: any) => {
    const dateStr = s.next_billing || '';
    upcoming.push({ name: s.name, when: dateStr, kind: 'Subscription', amount: `-${s.cost.toFixed(2)}`, in: dateStr });
  });
  debtsOwe.forEach((d: any) => {
    upcoming.push({ name: d.person, when: d.due || '', kind: 'Debt', amount: `-${d.remaining.toFixed(2)}`, in: d.due || '' });
  });
  debtsOwed.forEach((d: any) => {
    upcoming.push({ name: d.person, when: d.due || '', kind: 'Owed', amount: `+${d.remaining.toFixed(2)}`, in: d.due || '' });
  });

  return {
    settings, salaries, services, subs, bills, debtsOwe, debtsOwed, budgets, transactions, txRows,
    totals: { totalIn, totalOut, rest, salaryTotal, serviceTotal, subsTotal, billsTotal, debtOweTot, debtOwedTot },
    spendByCat,
    trend,
    upcoming,
  };
}

export default async function Home() {
  const initialData = await getInitialData();
  return <DashboardClient initialData={initialData} />;
}
