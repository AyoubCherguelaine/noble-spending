import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';
import { getRates, toUsd, convertToDisplay, formatMoney } from '@/lib/currency';

// This endpoint reads mutable PostgreSQL state. Never serve a prerendered or cached
// response after a write.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const COLORS: Record<string, string> = {
  housing: '#60a5fa', daily: '#34d399', online: '#f472b6', real: '#fbbf24',
  subs: '#a78bfa', transport: '#22d3ee', debt: '#fb7185', savings: '#4ade80', rest: '#94a3b8'
};

const CAT_META: Record<string, { en: string; ar: string }> = {
  housing: { en: 'Housing & bills', ar: 'السكن والفواتير' },
  daily: { en: 'Daily / groceries', ar: 'المصاريف اليومية' },
  online: { en: 'Online spending', ar: 'شراء عبر الإنترنت' },
  real: { en: 'In-person spending', ar: 'شراء مباشر' },
  subs: { en: 'Subscriptions', ar: 'الاشتراكات' },
  transport: { en: 'Transport', ar: 'التنقل' },
  debt: { en: 'Debt payments', ar: 'تسديد الديون' },
  savings: { en: 'Savings', ar: 'الادخار' },
  income: { en: 'Income', ar: 'الدخل' },
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export async function GET(request: Request) {
  await initSchema();

  const url = new URL(request.url);
  const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1), 10);
  const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()), 10);
  const monthStr = String(month).padStart(2, '0');

  const settingsRows = await db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const r of settingsRows) settings[r.key] = r.value;

  const currency = settings.currency || 'USD';
  const rates = getRates(settings);

  const salaries = await db.prepare('SELECT * FROM salaries WHERE month = ? AND year = ?').all(month, year);
  const services = await db.prepare('SELECT * FROM services WHERE month = ? AND year = ?').all(month, year);
  const subs = await db.prepare('SELECT * FROM subscriptions WHERE month = ? AND year = ?').all(month, year);
  const bills = await db.prepare('SELECT * FROM bills WHERE month = ? AND year = ?').all(month, year);
  const debtsOwe = await db.prepare("SELECT * FROM debts WHERE type = 'owe' AND status != 'paid'").all();
  const debtsOwed = await db.prepare("SELECT * FROM debts WHERE type = 'owed' AND status != 'paid'").all();
  const budgets = await db.prepare('SELECT * FROM budgets WHERE month = ? AND year = ?').all(month, year);
  const transactions = await db.prepare('SELECT * FROM transactions ORDER BY date DESC, id DESC').all();

  const salaryTotalDisplay = salaries.reduce((a: number, s: any) => a + convertToDisplay(parseFloat(s.net), s.currency || 'USD', currency, rates), 0);
  const serviceTotalDisplay = services.reduce((a: number, s: any) => a + convertToDisplay(parseFloat(s.amount), s.currency || 'USD', currency, rates), 0);
  const subsTotalDisplay = subs.reduce((a: number, s: any) => a + convertToDisplay(parseFloat(s.cost), s.currency || 'USD', currency, rates), 0);
  const billsTotalDisplay = bills.reduce((a: number, s: any) => a + convertToDisplay(parseFloat(s.cost), s.currency || 'USD', currency, rates), 0);
  const debtOweTotDisplay = debtsOwe.reduce((a: number, d: any) => a + convertToDisplay(parseFloat(d.remaining), d.currency || 'USD', currency, rates), 0);
  const debtOwedTotDisplay = debtsOwed.reduce((a: number, d: any) => a + convertToDisplay(parseFloat(d.remaining), d.currency || 'USD', currency, rates), 0);

  const salariesDisplay = salaries.map((s: any) => ({ ...s, net_display: convertToDisplay(parseFloat(s.net), s.currency || 'USD', currency, rates) }));
  const servicesDisplay = services.map((s: any) => ({ ...s, amount_display: convertToDisplay(parseFloat(s.amount), s.currency || 'USD', currency, rates) }));
  const subsDisplay = subs.map((s: any) => ({ ...s, cost_display: convertToDisplay(parseFloat(s.cost), s.currency || 'USD', currency, rates) }));
  const billsDisplay = bills.map((b: any) => ({ ...b, cost_display: convertToDisplay(parseFloat(b.cost), b.currency || 'USD', currency, rates) }));
  const debtsOweDisplay = debtsOwe.map((d: any) => ({ ...d, remaining_display: convertToDisplay(parseFloat(d.remaining), d.currency || 'USD', currency, rates), total_display: convertToDisplay(parseFloat(d.total), d.currency || 'USD', currency, rates) }));
  const debtsOwedDisplay = debtsOwed.map((d: any) => ({ ...d, remaining_display: convertToDisplay(parseFloat(d.remaining), d.currency || 'USD', currency, rates), total_display: convertToDisplay(parseFloat(d.total), d.currency || 'USD', currency, rates) }));

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
  const totalIn = salaryTotalDisplay + incomeTxTotal;
  const rest = totalIn - totalOutWithoutDebt;

  const displaySalaryTotal = formatMoney(salaryTotalDisplay, currency as any, true);
  const displayServiceTotal = formatMoney(serviceTotalDisplay, currency as any, true);
  const displaySubsTotal = formatMoney(subsTotalDisplay, currency as any, true);
  const displayBillsTotal = formatMoney(billsTotalDisplay, currency as any, true);
  const displayDebtOweTot = formatMoney(debtOweTotDisplay, currency as any, true);
  const displayDebtOwedTot = formatMoney(debtOwedTotDisplay, currency as any, true);

  const txRows = transactions.map((t: any) => ({
    id: t.id, date: t.date, merchant: t.merchant, category: t.category, method: t.method,
    original_currency: t.original_currency, original_amount: t.original_amount,
    converted_amount: t.converted_amount,
    amount: formatMoney(convertToDisplay(t.converted_amount, 'USD', currency as any, rates), currency as any, true),
    color: t.converted_amount > 0 ? '#4ade80' : '#e6edf3',
    dotStyle: { width: 7, height: 7, borderRadius: 2, background: COLORS[t.category] || '#2dd4bf', display: 'inline-block' }
  }));

  const upcoming: { name: string; when: string; kind: string; amount: string; in: string }[] = [];
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  subs.forEach((s: any) => {
    const dateStr = s.next_billing || '';
    const amount = formatMoney(convertToDisplay(parseFloat(s.cost), s.currency || 'USD', currency as any, rates), currency as any, true);
    upcoming.push({ name: s.name, when: dateStr, kind: 'Subscription', amount, in: dateStr });
  });

  debtsOwe.forEach((d: any) => {
    const amount = formatMoney(convertToDisplay(parseFloat(d.remaining), d.currency || 'USD', currency as any, rates), currency as any, true);
    upcoming.push({ name: d.person, when: d.due || '', kind: 'Debt', amount, in: d.due || '' });
  });

  debtsOwed.forEach((d: any) => {
    const amount = formatMoney(convertToDisplay(parseFloat(d.remaining), d.currency || 'USD', currency as any, rates), currency as any, true);
    upcoming.push({ name: d.person, when: d.due || '', kind: 'Owed', amount, in: d.due || '' });
  });

  const period = url.searchParams.get('period') || '6M';
  const periodMonths = period === '1M' ? 1 : period === '3M' ? 3 : period === '1Y' ? 12 : 6;

  const trend: { label: string; income: number; spend: number }[] = [];

  if (period === '1M') {
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
      const dayTxs = await db.prepare('SELECT * FROM transactions WHERE date = ?').all(dateStr) as any[];
      const filteredForDay = dayTxs.filter((t: any) => t.category !== 'transfer' && t.method !== 'transfer');
      const txIncome = filteredForDay.filter((t: any) => t.type === 'income').reduce((a: number, t: any) => a + convertToDisplay(t.converted_amount, 'USD', currency, rates), 0);
      const spend = filteredForDay.filter((t: any) => t.type === 'spend').reduce((a: number, t: any) => a + Math.abs(convertToDisplay(t.converted_amount, 'USD', currency, rates)), 0);

      trend.push({ label: `${MONTH_NAMES[month - 1]} ${day}`, income: txIncome, spend });
    }
  } else {
    for (let i = periodMonths - 1; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      const mmStr = String(d.getMonth() + 1).padStart(2, '0');

      const monthTransactions = await db.prepare('SELECT * FROM transactions WHERE strftime(\'%Y-%m\', date) = ?').all(`${d.getFullYear()}-${mmStr}`);
      const filteredForTrend = monthTransactions.filter((t: any) => t.category !== 'transfer' && t.method !== 'transfer');
      const txIncome = filteredForTrend.filter((t: any) => t.type === 'income').reduce((a: number, t: any) => a + convertToDisplay(t.converted_amount, 'USD', currency, rates), 0);
      const spend = filteredForTrend.filter((t: any) => t.type === 'spend').reduce((a: number, t: any) => a + Math.abs(convertToDisplay(t.converted_amount, 'USD', currency, rates)), 0);

      trend.push({ label, income: txIncome, spend });
    }
  }

  const accounts = await db.prepare('SELECT * FROM accounts ORDER BY currency, name').all() as any[];
  const accountsDisplay = accounts.map((a: any) => ({
    ...a,
    balance_display: convertToDisplay(parseFloat(a.balance || 0), a.currency || 'USD', currency as any, rates),
  }));

  const accountHistory: Record<string, { name: string; currency: string; monthly: { month: string; income: number; outcome: number; balance: number }[] }> = {};
  const historyMonths: string[] = [];
  for (let i = periodMonths - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const mmStr = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${d.getFullYear()}-${mmStr}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    historyMonths.push(label);
  }

  for (const acc of accounts) {
    const accId = String(acc.id);
    const accTxs: Record<string, { income: number; outcome: number }> = {};
    historyMonths.forEach(m => { accTxs[m] = { income: 0, outcome: 0 }; });

    const allTxForAccount = await db.prepare('SELECT * FROM transactions WHERE account_id = ?').all(acc.id) as any[];
    const totalNetOriginal = allTxForAccount.reduce((a: number, t: any) => a + (parseFloat(t.original_amount) || 0), 0);
    const accCurrency = acc.currency || 'USD';
    const startingBalance = (parseFloat(acc.balance || 0)) - totalNetOriginal;

    allTxForAccount.forEach((t: any) => {
      const dateStr = t.date;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const mmStr = String(d.getMonth() + 1).padStart(2, '0');
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
  }

  const accountHistoryDaily: Record<string, { name: string; currency: string; daily: { day: string; income: number; outcome: number; balance: number }[] }> = {};
  if (period === '1M') {
    const daysInMonth = new Date(year, month, 0).getDate();
    for (const acc of accounts) {
      const accId = String(acc.id);
      const accCurrency = acc.currency || 'USD';
    const allTxForAccount = await db.prepare('SELECT * FROM transactions WHERE account_id = ?').all(acc.id) as any[];
      const totalNetOriginal = allTxForAccount.reduce((a: number, t: any) => a + (parseFloat(t.original_amount) || 0), 0);
      const startingBalance = (parseFloat(acc.balance || 0)) - totalNetOriginal;

      const dayMap: Record<string, { income: number; outcome: number }> = {};
      for (let day = 1; day <= daysInMonth; day++) {
        dayMap[String(day).padStart(2, '0')] = { income: 0, outcome: 0 };
      }
      allTxForAccount.forEach((t: any) => {
        const dateStr = t.date;
        if (!dateStr) return;
        const [y, m, d] = dateStr.split('-');
        if (parseInt(y) === year && parseInt(m) === month && dayMap[d]) {
          const amt = parseFloat(t.original_amount) || 0;
          if (amt > 0) dayMap[d].income += amt;
          else dayMap[d].outcome += Math.abs(amt);
        }
      });

      const daily: { day: string; income: number; outcome: number; balance: number }[] = [];
      let running = startingBalance;
      for (let day = 1; day <= daysInMonth; day++) {
        const dayKey = String(day).padStart(2, '0');
        const entry = dayMap[dayKey] || { income: 0, outcome: 0 };
        running += entry.income - entry.outcome;
        daily.push({ day: `${MONTH_NAMES[month - 1]} ${day}`, income: entry.income, outcome: entry.outcome, balance: running });
      }

      accountHistoryDaily[accId] = {
        name: acc.name,
        currency: accCurrency,
        daily,
      };
    }
  }

  const budgetsDisplay = budgets.map((b: any) => ({
    ...b,
    budget_amount_display: convertToDisplay(parseFloat(b.budget_amount), b.currency || 'USD', currency as any, rates),
  }));

  const budgetAlerts = (budgets || []).map((b: any) => {
    const actual = spendByCat[b.category_key] || 0;
    const limit = parseFloat(b.budget_amount) || 0;
    const pct = limit > 0 ? actual / limit : 0;
    return {
      id: b.id,
      category_key: b.category_key,
      actual,
      limit,
      pct,
      over: pct >= 1,
      warning: pct >= 0.8 && pct < 1,
    };
  });

  const activeAlerts = budgetAlerts.filter(a => a.warning || a.over);

  const currencyTotals: Record<string, { balance: number; display: number }> = {};
  accounts.forEach((a: any) => {
    const cur = a.currency || 'USD';
    if (!currencyTotals[cur]) currencyTotals[cur] = { balance: 0, display: 0 };
    currencyTotals[cur].balance += parseFloat(a.balance || 0);
  });
  Object.keys(currencyTotals).forEach(cur => {
    currencyTotals[cur].display = convertToDisplay(currencyTotals[cur].balance, cur, currency as any, rates);
  });

  return NextResponse.json({
    settings,
    salaries: salariesDisplay,
    services: servicesDisplay,
    subs: subsDisplay,
    bills: billsDisplay,
    debtsOwe: debtsOweDisplay,
    debtsOwed: debtsOwedDisplay,
    budgets, transactions, txRows,
    accounts: accountsDisplay,
    currencyTotals,
    totals: {
      totalIn, totalOut, totalOutWithoutDebt, rest,
      salaryTotal: salaryTotalDisplay,
      serviceTotal: serviceTotalDisplay,
      subsTotal: subsTotalDisplay,
      billsTotal: billsTotalDisplay,
      debtOweTot: debtOweTotDisplay,
      debtOwedTot: debtOwedTotDisplay,
    },
    totalsDisplay: {
      salaryTotal: displaySalaryTotal,
      serviceTotal: displayServiceTotal,
      subsTotal: displaySubsTotal,
      billsTotal: displayBillsTotal,
      debtOweTot: displayDebtOweTot,
      debtOwedTot: displayDebtOwedTot,
    },
    spendByCat,
    spendByCatRaw: spendByCat,
    trend,
    accountHistory,
    accountHistoryDaily: Object.keys(accountHistoryDaily).length > 0 ? accountHistoryDaily : undefined,
    upcoming,
    budgetsDisplay,
    budgetAlerts,
    activeAlerts,
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
