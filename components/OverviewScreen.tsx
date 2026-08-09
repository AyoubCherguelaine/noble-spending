'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoney } from '@/lib/currency';
import AccountHistoryChart from './AccountHistoryChart';
import ImportExportModal from './ImportExportModal';

type Period = '1M' | '3M' | '6M' | '1Y';

export default function OverviewScreen({ data, currency, theme, period, setPeriod, t, catFilter, setCatFilter, setScreen }: any) {
  const { totals, spendByCat, txRows, trend, upcoming = [], totalsDisplay, accounts = [], currencyTotals = {}, accountHistory = {} } = data;
  const [showImportExport, setShowImportExport] = useState(false);
  const incomeTxs = txRows.filter((r: any) => r.amount.startsWith('+'));
  const spendTxs = txRows.filter((r: any) => r.amount.startsWith('−') || (!r.amount.startsWith('+') && !r.amount.startsWith('+$')));
  const avgIncome = incomeTxs.length > 0 ? incomeTxs.reduce((s: number, r: any) => s + parseFloat(r.amount.replace(/[^0-9.\-]/g, '')), 0) / incomeTxs.length : 0;
  const avgSpend = spendTxs.length > 0 ? spendTxs.reduce((s: number, r: any) => s + Math.abs(parseFloat(r.amount.replace(/[^0-9.\-]/g, ''))), 0) / spendTxs.length : 0;
  const topCat = Object.entries(spendByCat).sort((a: any, b: any) => (b[1] as number) - (a[1] as number))[0];
  const totalAccountsBalance = Object.values(currencyTotals).reduce((s: number, c: any) => s + (c.display || 0), 0);
  const biggestTx = txRows.length > 0 ? txRows.reduce((max: any, r: any) => {
    const val = Math.abs(parseFloat(r.amount.replace(/[^0-9.\-]/g, '')));
    const maxVal = Math.abs(parseFloat(max.amount.replace(/[^0-9.\-]/g, '')));
    return val > maxVal ? r : max;
  }) : null;

  const kpis = [
    { label: 'MONEY IN', value: `${totalsDisplay?.salaryTotal || totals.totalIn.toFixed(2)}`, color: '#4ade80', delta: incomeTxs.length > 0 ? `${incomeTxs.length} tx` : '0 tx', sub: 'this period' },
    { label: 'MONEY OUT', value: `${totals.totalOut.toFixed(2)}`, color: '#e6edf3', delta: spendTxs.length > 0 ? `${spendTxs.length} tx` : '0 tx', sub: 'this period' },
    { label: 'NET', value: `${(totals.totalIn - totals.totalOutWithoutDebt).toFixed(2)}`, color: '#4ade80', delta: `${Math.round((totals.totalIn - totals.totalOutWithoutDebt) / Math.max(totals.totalIn, 1) * 100)}%`, sub: 'of income kept' },
    { label: 'AVG INCOME', value: `+${avgIncome.toFixed(2)}`, color: '#4ade80', delta: 'per income tx', sub: incomeTxs.length > 0 ? `${incomeTxs.length} incoming` : 'no data' },
    { label: 'AVG SPEND', value: `−${avgSpend.toFixed(2)}`, color: '#fb7185', delta: 'per spend tx', sub: spendTxs.length > 0 ? `${spendTxs.length} outgoing` : 'no data' },
    { label: 'TOP CATEGORY', value: topCat ? topCat[0].toUpperCase() : '—', color: '#fbbf24', delta: topCat ? `${(topCat[1] as number).toFixed(2)}` : '0', sub: topCat ? 'highest spend' : 'no data' },
    { label: 'TOTAL ACCOUNTS', value: `${accounts.length}`, color: '#60a5fa', delta: accounts.length > 0 ? 'active' : 'none', sub: totalAccountsBalance > 0 ? `balance ${formatMoney(totalAccountsBalance, currency)}` : 'no balance' },
    { label: 'BIGGEST TX', value: biggestTx ? formatMoney(Math.abs(parseFloat(biggestTx.amount.replace(/[^0-9.\-]/g, ''))), currency) : '0.00', color: '#a78bfa', delta: biggestTx ? biggestTx.merchant.substring(0, 12) : '—', sub: biggestTx ? 'single transaction' : 'no data' },
    { label: 'I OWE', value: `${totalsDisplay?.debtOweTot || totals.debtOweTot.toFixed(2)}`, color: '#fb7185', delta: `${data.debtsOwe.length}`, sub: 'open debts' },
    { label: 'OWED TO ME', value: `${totalsDisplay?.debtOwedTot || totals.debtOwedTot.toFixed(2)}`, color: '#4ade80', delta: `${data.debtsOwed.length}`, sub: 'people' },
  ];

  const accountCurrencies = Object.keys(currencyTotals).filter(c => c !== currency);
  const showAccountBreakdown = accounts.length > 0 && accountCurrencies.length > 0;

  const periodMonths: Record<string, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 };
  const isDaily = period === '1M';
  const slicedTrend = (trend || []).slice(-(periodMonths[period] || 6));
  const filteredTrend = isDaily ? (trend || []) : slicedTrend;
  const flowSubtitle = isDaily ? 'Hover a day to read its values' : 'Hover a month to read its values';
  const xInterval = isDaily ? Math.max(1, Math.floor(filteredTrend.length / 6) - 1) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['1M', '3M', '6M', '1Y'] as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: '6px 11px', borderRadius: 4, border: '1px solid #1e242c', cursor: 'pointer',
            font: '500 11px IBM Plex Mono, monospace', background: period === p ? '#2dd4bf' : 'transparent',
            color: period === p ? '#04231e' : '#7d8794'
          }}>{t(p)}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(178px, 1fr))', gap: 12 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, padding: '14px 15px' }}>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.08em' }}>{k.label}</div>
            <div style={{ marginTop: 8, font: '600 21px IBM Plex Mono, monospace', color: k.color, letterSpacing: '-.02em' }}>{k.value}</div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>
              <span style={{ font: '600 10.5px IBM Plex Mono, monospace', color: k.color }}>{k.delta}</span><span>{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e242c', display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <div style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>{t('flow')}</div>
            <div style={{ font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>{flowSubtitle}</div>
          </div>
          <button onClick={() => setScreen('accounts')} style={{ font: '500 10.5px IBM Plex Mono, monospace', color: '#2dd4bf', background: 'transparent', border: 'none', cursor: 'pointer' }}>View accounts →</button>
        </div>
        <div style={{ padding: '12px 18px', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e242c" />
              <XAxis dataKey="label" stroke="#7d8794" style={{ fontSize: 12 }} interval={xInterval} />
              <YAxis stroke="#7d8794" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4 }} labelStyle={{ color: '#e6edf3' }} itemStyle={{ color: '#e6edf3' }} />
              <Line type="monotone" dataKey="income" stroke="#4ade80" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="spend" stroke="#fb7185" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <AccountHistoryChart accountHistory={accountHistory} accountHistoryDaily={data.accountHistoryDaily} currency={currency} t={t} title="Accounts history" />

      {showAccountBreakdown && (
        <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, padding: '14px 16px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.08em' }}>ACCOUNTS</span>
          {accountCurrencies.map(cur => (
            <div key={cur} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ font: '600 10px IBM Plex Mono, monospace', color: '#2dd4bf' }}>{cur}</span>
              <span style={{ font: '600 12px IBM Plex Mono, monospace', color: '#e6edf3' }}>{formatMoney(currencyTotals[cur]?.balance || 0, cur)}</span>
            </div>
          ))}
          <button onClick={() => setScreen('accounts')} style={{ marginLeft: 'auto', font: '500 10.5px IBM Plex Mono, monospace', color: '#2dd4bf', background: 'transparent', border: 'none', cursor: 'pointer' }}>Manage →</button>
        </div>
      )}

      <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.08em' }}>DATA</span>
        <button onClick={() => { window.location.href = '/api/import-export?type=transactions&format=csv'; }} style={{ height: 30, padding: '0 12px', background: 'transparent', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, font: '500 11px Space Grotesk, sans-serif', cursor: 'pointer' }}>Export CSV</button>
        <button onClick={() => setShowImportExport(v => !v)} style={{ height: 30, padding: '0 12px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, font: '600 11px Space Grotesk, sans-serif', cursor: 'pointer' }}>Import CSV</button>
      </div>

      {showImportExport && (
        <ImportExportModal onClose={() => setShowImportExport(false)} onImported={() => { setShowImportExport(false); }} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 16 }}>
        <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4 }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid #1e242c', font: '600 12.5px Space Grotesk, sans-serif', display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('recent')}</span>
            <a href="#" onClick={(e) => { e.preventDefault(); setScreen('tx'); }} style={{ font: '500 10.5px IBM Plex Mono, monospace', color: '#2dd4bf', textDecoration: 'none' }}>{t('all')} →</a>
          </div>
          {txRows.slice(0, 7).map((r: any) => (
            <div key={r.id} style={{ padding: '10px 16px', borderBottom: '1px solid #1e242c', display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ font: '500 12.5px Space Grotesk, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.merchant}</div>
                <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 7, font: '400 10.5px IBM Plex Mono, monospace', color: '#7d8794' }}>
                  <span style={r.dotStyle as any}></span>{r.category} · {r.method}
                </div>
              </div>
              <div style={{ font: '600 13px IBM Plex Mono, monospace', color: r.color, whiteSpace: 'nowrap' }}>{r.amount}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4 }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid #1e242c', font: '600 12.5px Space Grotesk, sans-serif' }}>{t('upcoming')}</div>
          {upcoming.map((u: any, i: number) => (
            <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ font: '500 12.5px Space Grotesk, sans-serif' }}>{u.name}</div>
                <div style={{ marginTop: 3, font: '400 10.5px IBM Plex Mono, monospace', color: '#7d8794' }}>{u.when} · {u.kind}</div>
              </div>
              <div style={{ textAlign: 'end' }}>
                <div style={{ font: '600 12.5px IBM Plex Mono, monospace', color: u.amount.startsWith('-') ? '#e6edf3' : '#4ade80' }}>{u.amount}</div>
                <div style={{ marginTop: 3, font: '400 10px IBM Plex Mono, monospace', color: '#7d8794' }}>{u.in}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
