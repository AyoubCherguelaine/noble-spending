import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';
import { getRates, convertToDisplay } from '@/lib/currency';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getQuarter(month: number) {
  return Math.ceil(month / 3);
}

function getWeekNumber(dateStr: string) {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil((diff / oneWeek) + start.getDay() / 7);
}

export async function GET(request: Request) {
  await initSchema();

  const url = new URL(request.url);
  const granularity = url.searchParams.get('granularity') || 'month'; // day, week, month, quarter, year
  const groupBy = url.searchParams.get('groupBy') || 'category'; // category, account, method, type
  const typeFilter = url.searchParams.get('type') || 'all'; // all, income, spend
  const categoryFilter = url.searchParams.get('category') || 'all';
  const accountFilter = url.searchParams.get('account') || 'all';
  const methodFilter = url.searchParams.get('method') || 'all';
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()), 10);

  const settingsRows = await db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const r of settingsRows) settings[r.key] = r.value;

  const currency = settings.currency || 'USD';
  const rates = getRates(settings);

  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }
  if (typeFilter !== 'all') {
    query += ' AND type = ?';
    params.push(typeFilter);
  }
  if (categoryFilter !== 'all') {
    query += ' AND category = ?';
    params.push(categoryFilter);
  }
  if (accountFilter !== 'all') {
    query += ' AND account_id = ?';
    params.push(parseInt(accountFilter));
  }
  if (methodFilter !== 'all') {
    query += ' AND method = ?';
    params.push(methodFilter);
  }

  query += ' ORDER BY date ASC';
  const transactions = await db.prepare(query).all(...params) as any[];

  const accounts = await db.prepare('SELECT * FROM accounts').all() as any[];
  const accountMap = new Map(accounts.map(a => [a.id, a]));

  const grouped: Record<string, { income: number; spend: number; count: number; transactions: any[] }> = {};

  transactions.forEach((t: any) => {
    let key: string;
    const date = new Date(t.date);
    const amt = convertToDisplay(parseFloat(t.converted_amount || 0), 'USD', currency, rates);

    switch (granularity) {
      case 'day':
        key = t.date;
        break;
      case 'week':
        key = `W${getWeekNumber(t.date)} ${date.getFullYear()}`;
        break;
      case 'month':
        key = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
        break;
      case 'quarter':
        key = `Q${getQuarter(date.getMonth() + 1)} ${date.getFullYear()}`;
        break;
      case 'year':
        key = String(date.getFullYear());
        break;
      default:
        key = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
    }

    if (!grouped[key]) {
      grouped[key] = { income: 0, spend: 0, count: 0, transactions: [] };
    }

    grouped[key].count++;
    grouped[key].transactions.push(t);

    if (t.type === 'income') {
      grouped[key].income += amt;
    } else {
      grouped[key].spend += Math.abs(amt);
    }
  });

  const chartData = Object.entries(grouped)
    .map(([label, data]) => ({
      label,
      income: Math.round(data.income * 100) / 100,
      spend: Math.round(data.spend * 100) / 100,
      net: Math.round((data.income - data.spend) * 100) / 100,
      count: data.count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const categoryBreakdown = groupBy === 'category' || groupBy === 'all'
    ? Object.entries(
        transactions.reduce((acc: any, t: any) => {
          const cat = t.category || 'other';
          if (!acc[cat]) acc[cat] = { income: 0, spend: 0, count: 0 };
          const amt = convertToDisplay(parseFloat(t.converted_amount || 0), 'USD', currency, rates);
          if (t.type === 'income') acc[cat].income += amt;
          else acc[cat].spend += Math.abs(amt);
          acc[cat].count++;
          return acc;
        }, {})
      ).map(([name, data]: [string, any]) => ({
        name,
        value: Math.round((data.spend || data.income) * 100) / 100,
        income: Math.round(data.income * 100) / 100,
        spend: Math.round(data.spend * 100) / 100,
        count: data.count,
      }))
    : [];

  const methodBreakdown = groupBy === 'method'
    ? Object.entries(
        transactions.reduce((acc: any, t: any) => {
          const method = t.method || 'other';
          if (!acc[method]) acc[method] = { income: 0, spend: 0, count: 0 };
          const amt = convertToDisplay(parseFloat(t.converted_amount || 0), 'USD', currency, rates);
          if (t.type === 'income') acc[method].income += amt;
          else acc[method].spend += Math.abs(amt);
          acc[method].count++;
          return acc;
        }, {})
      ).map(([name, data]: [string, any]) => ({
        name,
        value: Math.round((data.spend + data.income) * 100) / 100,
        income: Math.round(data.income * 100) / 100,
        spend: Math.round(data.spend * 100) / 100,
        count: data.count,
      }))
    : [];

  const accountBreakdown = groupBy === 'account'
    ? Object.entries(
        transactions.reduce((acc: any, t: any) => {
          const accId = t.account_id || 'none';
          if (!acc[accId]) acc[accId] = { income: 0, spend: 0, count: 0, name: accountMap.get(accId)?.name || 'Unknown' };
          const amt = convertToDisplay(parseFloat(t.original_amount || 0), t.original_currency || 'USD', currency, rates);
          if (t.type === 'income') acc[accId].income += amt;
          else acc[accId].spend += Math.abs(amt);
          acc[accId].count++;
          return acc;
        }, {})
      ).map(([id, data]: [string, any]) => ({
        id,
        name: data.name,
        value: Math.round((data.spend + data.income) * 100) / 100,
        income: Math.round(data.income * 100) / 100,
        spend: Math.round(data.spend * 100) / 100,
        count: data.count,
      }))
    : [];

  return NextResponse.json({
    chartData,
    categoryBreakdown,
    methodBreakdown,
    accountBreakdown,
    filters: {
      granularity,
      groupBy,
      typeFilter,
      categoryFilter,
      accountFilter,
      methodFilter,
      startDate,
      endDate,
      year,
    },
    summary: {
      totalIncome: Math.round(transactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + convertToDisplay(parseFloat(t.converted_amount || 0), 'USD', currency, rates), 0) * 100) / 100,
      totalSpend: Math.round(transactions.filter((t: any) => t.type === 'spend').reduce((s: number, t: any) => s + Math.abs(convertToDisplay(parseFloat(t.converted_amount || 0), 'USD', currency, rates)), 0) * 100) / 100,
      transactionCount: transactions.length,
      avgTransaction: transactions.length > 0 ? Math.round(transactions.reduce((s: number, t: any) => s + Math.abs(convertToDisplay(parseFloat(t.converted_amount || 0), 'USD', currency, rates)), 0) / transactions.length * 100) / 100 : 0,
    },
  });
}
