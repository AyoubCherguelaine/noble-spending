import DashboardClient from '@/components/DashboardClient';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';
import { convertToDisplay, formatMoney, getRates } from '@/lib/currency';

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
  const accounts = db.prepare('SELECT * FROM accounts ORDER BY currency, name').all();

  const currencyTotals: Record<string, { balance: number; display: number }> = {};
  accounts.forEach((a: any) => {
    const cur = a.currency || 'USD';
    if (!currencyTotals[cur]) currencyTotals[cur] = { balance: 0, display: 0 };
    currencyTotals[cur].balance += parseFloat(a.balance || 0);
  });

  const currency = settings.currency || 'USD';
  const rates = getRates(settings);

  const salaryTotal = salaries.reduce((a: number, s: any) => a + convertToDisplay(parseFloat(s.net), s.currency || 'USD', currency, rates), 0);
  const serviceTotal = services.reduce((a: number, s: any) => a + convertToDisplay(parseFloat(s.amount), s.currency || 'USD', currency, rates), 0);
  const subsTotal = subs.reduce((a: number, s: any) => a + convertToDisplay(parseFloat(s.cost), s.currency || 'USD', currency, rates), 0);
  const billsTotal = bills.reduce((a: number, s: any) => a + convertToDisplay(parseFloat(s.cost), s.currency || 'USD', currency, rates), 0);
  const debtOweTot = debtsOwe.reduce((a: number, d: any) => a + convertToDisplay(parseFloat(d.remaining), d.currency || 'USD', currency, rates), 0);
  const debtOwedTot = debtsOwed.reduce((a: number, d: any) => a + convertToDisplay(parseFloat(d.remaining), d.currency || 'USD', currency, rates), 0);

  const spendByCat: Record<string, number> = { housing: 0, daily: 0, online: 0, real: 0, subs: 0, transport: 0, debt: 0, savings: 0 };
  const monthTxs = transactions.filter((t: any) => t.date.startsWith(`${year}-${monthStr}`) && t.category !== 'transfer' && t.method !== 'transfer');
  monthTxs.forEach((t: any) => {
    if (t.type === 'spend' && !t.salary_id && t.method !== 'Salary' && spendByCat[t.category] !== undefined) {
      spendByCat[t.category] += Math.abs(convertToDisplay(t.converted_amount, 'USD', currency, rates));
    }
  });
  const totalOut = Object.values(spendByCat).reduce((a, b) => a + b, 0);
  const totalOutWithoutDebt = totalOut - (spendByCat.debt || 0);
  const incomeTxTotal = monthTxs.filter((t: any) => t.type === 'income' && !t.salary_id && t.method !== 'Salary').reduce((a: number, t: any) => a + convertToDisplay(t.converted_amount, 'USD', currency, rates), 0);
  const totalIn = salaryTotal + incomeTxTotal;
  const rest = totalIn - totalOutWithoutDebt;

  const txRows = transactions.map((t: any) => ({
    id: t.id, date: t.date, merchant: t.merchant, category: t.category, method: t.method,
    original_currency: t.original_currency, original_amount: t.original_amount,
    converted_amount: t.converted_amount,
    amount: `${t.converted_amount >= 0 ? '+' : ''}${t.converted_amount.toFixed(2)}`,
    color: t.converted_amount > 0 ? '#4ade80' : '#e6edf3',
    dotStyle: { width: 7, height: 7, borderRadius: 2, background: t.category === 'income' ? '#4ade80' : '#94a3b8', display: 'inline-block' }
  }));

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const periodMonths = 6;
  const historyMonths: string[] = [];
  for (let i = periodMonths - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    historyMonths.push(`${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`);
  }

  const accountHistory: Record<string, { name: string; currency: string; monthly: { month: string; income: number; outcome: number; balance: number }[] }> = {};
  accounts.forEach((acc: any) => {
    const accId = String(acc.id);
    const accTxs: Record<string, { income: number; outcome: number }> = {};
    historyMonths.forEach(m => { accTxs[m] = { income: 0, outcome: 0 }; });

    const allTxForAccount = db.prepare('SELECT * FROM transactions WHERE account_id = ?').all(acc.id) as any[];
    const totalNetOriginal = allTxForAccount.reduce((a: number, t: any) => a + (parseFloat(t.original_amount) || 0), 0);
    const accCurrency = acc.currency || 'USD';
    const startingBalance = (parseFloat(acc.balance || 0)) - totalNetOriginal;

    allTxForAccount.forEach((t: any) => {
      const dateStr = t.date;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      if (!(label in accTxs)) return;
      const amt = parseFloat(t.original_amount) || 0;
      if (amt > 0) accTxs[label].income += amt;
      else accTxs[label].outcome += Math.abs(amt);
    });

    const monthly: { month: string; income: number; outcome: number; balance: number }[] = [];
    let running = startingBalance;
    historyMonths.forEach(m => {
      const entry = accTxs[m] || { income: 0, outcome: 0 };
      running += entry.income - entry.outcome;
      monthly.push({ month: m, income: entry.income, outcome: entry.outcome, balance: running });
    });

    accountHistory[accId] = {
      name: acc.name,
      currency: accCurrency,
      monthly,
    };
  });

  const trend: { month: string; income: number; spend: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    const mmStr = String(d.getMonth() + 1).padStart(2, '0');

    const monthTransactions = db.prepare('SELECT * FROM transactions WHERE strftime(\'%Y-%m\', date) = ?').all(`${d.getFullYear()}-${mmStr}`);
    const filteredForTrend = monthTransactions.filter((t: any) => t.category !== 'transfer' && t.method !== 'transfer');
    const txIncome = filteredForTrend.filter((t: any) => t.type === 'income' && !t.salary_id && t.method !== 'Salary').reduce((a: number, t: any) => a + convertToDisplay(t.converted_amount, 'USD', currency, rates), 0);
    const spend = filteredForTrend.filter((t: any) => t.type === 'spend' && !t.salary_id && t.method !== 'Salary').reduce((a: number, t: any) => a + Math.abs(convertToDisplay(t.converted_amount, 'USD', currency, rates)), 0);

    const monthSalaries = db.prepare('SELECT * FROM salaries WHERE month = ? AND year = ?').all(d.getMonth() + 1, d.getFullYear());
    const salaryIncome = monthSalaries.reduce((a: number, s: any) => a + convertToDisplay(parseFloat(s.net || 0), s.currency || 'USD', currency, rates), 0);

    trend.push({ month: label, income: txIncome + salaryIncome, spend });
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

  const displaySalaryTotal = formatMoney(salaryTotal, currency as any, true);
  const displayServiceTotal = formatMoney(serviceTotal, currency as any, true);
  const displaySubsTotal = formatMoney(subsTotal, currency as any, true);
  const displayBillsTotal = formatMoney(billsTotal, currency as any, true);
  const displayDebtOweTot = formatMoney(debtOweTot, currency as any, true);
  const displayDebtOwedTot = formatMoney(debtOwedTot, currency as any, true);

  return {
    settings, salaries, services, subs, bills, debtsOwe, debtsOwed, budgets, transactions, txRows, accounts, currencyTotals,
    totals: { totalIn, totalOut, totalOutWithoutDebt, rest, salaryTotal, serviceTotal, subsTotal, billsTotal, debtOweTot, debtOwedTot },
    totalsDisplay: {
      salaryTotal: displaySalaryTotal,
      serviceTotal: displayServiceTotal,
      subsTotal: displaySubsTotal,
      billsTotal: displayBillsTotal,
      debtOweTot: displayDebtOweTot,
      debtOwedTot: displayDebtOwedTot,
    },
    spendByCat,
    trend,
    accountHistory,
    upcoming,
  };
}

export default async function Home() {
  const initialData = await getInitialData();
  return <DashboardClient initialData={initialData} />;
}
