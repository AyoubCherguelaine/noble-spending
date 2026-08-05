'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import OverviewScreen from './OverviewScreen';
import IncomeScreen from './IncomeScreen';
import SpendingScreen from './SpendingScreen';
import DebtsScreen from './DebtsScreen';
import TransactionsScreen from './TransactionsScreen';
import BudgetScreen from './BudgetScreen';
import AddModal from './AddModal';
import SettingsModal from './SettingsModal';

type Screen = 'overview' | 'income' | 'spending' | 'debts' | 'tx' | 'budget';
type Direction = 'terminal' | 'ledger' | 'canvas';
type Currency = 'USD' | 'DA' | 'EUR';
type Period = '1M' | '3M' | '6M' | '1Y';

interface DashboardData {
  settings: Record<string, string>;
  salaries: any[]; services: any[]; subs: any[]; bills: any[];
  debtsOwe: any[]; debtsOwed: any[]; budgets: any[]; transactions: any[];
  txRows: any[];
  totals: { totalIn: number; totalOut: number; rest: number; salaryTotal: number; serviceTotal: number; subsTotal: number; billsTotal: number; debtOweTot: number; debtOwedTot: number };
  spendByCat: Record<string, number>;
  trend: { month: string; income: number; spend: number }[];
  upcoming: { name: string; when: string; kind: string; amount: string; in: string }[];
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function DashboardClient({ initialData }: { initialData: DashboardData | null }) {
  const [screen, setScreen] = useState<Screen>('overview');
  const [theme, setTheme] = useState<Direction>((initialData?.settings.direction || 'terminal') as Direction);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>((initialData?.settings.currency || 'USD') as Currency);
  const inputCurrency = (initialData?.settings.currency || 'USD') as Currency;
  const initialMonth = parseInt(initialData?.settings.month || String(new Date().getMonth() + 1), 10);
  const initialYear = parseInt(initialData?.settings.year || String(new Date().getFullYear()), 10);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [period, setPeriod] = useState<Period>('6M');
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [data, setData] = useState<DashboardData | null>(initialData);

  const mountedRef = useRef(false);

  const refresh = async () => {
    const res = await fetch(`/api/data?month=${month}&year=${year}&period=${period}`);
    const json = await res.json();
    setData(json);
  };

  useEffect(() => { refresh(); }, [month, year, period]);

  useEffect(() => {
    if (mountedRef.current) {
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: inputCurrency, direction: theme }),
      }).catch(() => {});
    }
    mountedRef.current = true;
  }, [inputCurrency, theme]);

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const t = (key: string) => {
    const dict: Record<string, string> = {
      overview: 'Overview', income: 'Income', spending: 'Spending', debts: 'Debts',
      tx: 'Transactions', budget: 'Budget', net: 'NET THIS MONTH', add: 'Add',
      flow: 'Money flow', recent: 'Recent activity', all: 'All', upcoming: 'Upcoming & due',
      search: 'Search merchant, category…', save: 'Save', cancel: 'Cancel',
      addTitle: 'Add a movement', preview: 'This will record',
      merchant: 'Merchant', amount: 'Amount', cat: 'Category', date: 'Date',
      method: 'Method', owe: 'I owe', owed: 'Owed to me',
      card: 'Card', bank: 'Bank account', cash: 'Cash', web: 'Web payment',
      '1M': '1M', '3M': '3M', '6M': '6M', '1Y': '1Y',
    };
    return dict[key] || key;
  };

  const netLabel = data ? `${(data.totals.totalIn - data.totals.totalOut >= 0 ? '+' : '')}${data.totals.rest.toFixed(2)}` : '0.00';

  return (
    <div dir="ltr" style={{ minHeight: '100vh', background: '#0b0d10', color: '#e6edf3', fontFamily: "'Space Grotesk',system-ui,sans-serif", display: 'grid', gridTemplateColumns: '228px 1fr' }}>
      <Sidebar screen={screen} setScreen={setScreen} theme={theme} setTheme={setTheme} currency={displayCurrency} month={month} year={year} setMonth={setMonth} setYear={setYear} monthLabel={monthLabel} totals={data?.totals} t={t} onOpenSettings={() => setSettingsOpen(true)} />
      <main style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header month={month} year={year} setMonth={setMonth} setYear={setYear} monthLabel={monthLabel} netLabel={netLabel} query={query} setQuery={setQuery} onAdd={() => setModalOpen(true)} t={t} />
        <div style={{ padding: '22px 26px 60px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {screen === 'overview' && data && <OverviewScreen data={data} currency={displayCurrency} theme={theme} period={period} setPeriod={setPeriod} t={t} catFilter={catFilter} setCatFilter={setCatFilter} setScreen={setScreen} />}
          {screen === 'income' && data && <IncomeScreen data={data} currency={displayCurrency} t={t} refresh={refresh} inputCurrency={inputCurrency} month={month} year={year} />}
          {screen === 'spending' && data && <SpendingScreen data={data} currency={displayCurrency} t={t} catFilter={catFilter} setCatFilter={setCatFilter} setScreen={setScreen} />}
          {screen === 'debts' && data && <DebtsScreen data={data} currency={displayCurrency} t={t} refresh={refresh} inputCurrency={inputCurrency} month={month} year={year} />}
          {screen === 'tx' && data && <TransactionsScreen data={data} currency={displayCurrency} t={t} catFilter={catFilter} query={query} refresh={refresh} inputCurrency={inputCurrency} />}
          {screen === 'budget' && data && <BudgetScreen data={data} currency={displayCurrency} t={t} refresh={refresh} inputCurrency={inputCurrency} month={month} year={year} />}
        </div>
      </main>
      {modalOpen && (
        <AddModal currency={inputCurrency} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); refresh(); }} t={t} />
      )}
      {settingsOpen && (
        <SettingsModal settings={initialData?.settings} onClose={() => setSettingsOpen(false)} onSaved={() => { setSettingsOpen(false); refresh(); }} t={t} />
      )}
    </div>
  );
}
