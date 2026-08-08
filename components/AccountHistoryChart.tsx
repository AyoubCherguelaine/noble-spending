'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatMoney } from '@/lib/currency';

const CHART_COLORS = ['#2dd4bf', '#60a5fa', '#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#22d3ee', '#fb7185', '#ec4899', '#10b981'];

function sharedTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const month = label || payload[0]?.payload?.month || '';

  return (
    <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, padding: '8px 10px', minWidth: 170, pointerEvents: 'none' }}>
      <div style={{ font: '600 10.5px IBM Plex Mono, monospace', color: '#e6edf3', marginBottom: 6 }}>{month}</div>
      {payload.map((entry: any) => {
        const dataKey: string = entry?.dataKey || '';
        if (!dataKey || !dataKey.startsWith('bal_')) return null;
        const accId = dataKey.slice(4);
        const pd = entry?.payload || {};
        const cur = pd[`cur_${accId}`] || 'USD';
        const income = Number(pd[`inc_${accId}`]) || 0;
        const outcome = Number(pd[`out_${accId}`]) || 0;
        const balance = Number(entry?.value) || 0;
        return (
          <div key={dataKey} style={{ marginBottom: 2 }}>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: entry.color || '#2dd4bf' }}>{entry.name || dataKey}</div>
            <div style={{ font: '400 9px IBM Plex Mono, monospace', color: '#4ade80' }}>  +{formatMoney(income, cur)}</div>
            <div style={{ font: '400 9px IBM Plex Mono, monospace', color: '#fb7185' }}>  −{formatMoney(outcome, cur)}</div>
            <div style={{ font: '600 10px IBM Plex Mono, monospace', color: '#e6edf3' }}>  Balance: {formatMoney(balance, cur)}</div>
          </div>
        );
      })}
    </div>
  );
}


export default function AccountHistoryChart({ accountHistory, accountHistoryDaily, currency, t, title, onPointClick }: any) {
  const isDaily = !!accountHistoryDaily && Object.keys(accountHistoryDaily).length > 0;
  const source = isDaily ? accountHistoryDaily : accountHistory;
  const accountEntries = Object.entries(source || {});
  const [showAll, setShowAll] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    accountEntries.forEach(([id]) => { init[id] = true; });
    return init;
  });
  const [activePoint, setActivePoint] = useState<{ id: string; acc: any; month: string; income: number; outcome: number; balance: number } | null>(null);

  const ColoredDotInner = ({ color, ...props }: any) => {
    const { cx, cy, payload, dataKey } = props;
    if (cx === undefined || cy === undefined) return null;
    const accId = dataKey?.slice(4) || '';
    const val = Number(payload?.[dataKey]);
    if (isNaN(val) || !isFinite(val)) return null;
    return (
      <g
        onClick={(e: any) => {
          e.stopPropagation();
          if (dataKey?.startsWith('bal_')) {
            const data: any = payload || {};
            setActivePoint({
              id: accId,
              acc: { name: props?.name || dataKey },
              month: data.month || '',
              income: Number(data[`inc_${accId}`]) || 0,
              outcome: Number(data[`out_${accId}`]) || 0,
              balance: val,
            });
            onPointClick?.(accId, data.month, val);
          }
        }}
        style={{ cursor: 'pointer', pointerEvents: 'all' }}
      >
        <circle cx={cx} cy={cy} r={4} fill={color} stroke="#0b0d10" strokeWidth={1} />
      </g>
    );
  };

  if (accountEntries.length === 0) {
    return (
      <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, padding: '18px' }}>
        <div style={{ font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>No accounts with history in this period.</div>
      </div>
    );
  }

  const visibleEntries = accountEntries.filter(([id]) => selected[id]);

  const accountColors: Record<string, string> = {};
  const accountCurrency: Record<string, string> = {};
  visibleEntries.forEach(([id, acc]: [string, any], i) => {
    accountColors[id] = CHART_COLORS[i % CHART_COLORS.length];
    accountCurrency[id] = acc.currency || 'USD';
  });

  const dataByMonth: Record<string, any> = {};
  const monthOrder: string[] = [];

  visibleEntries.forEach(([id, acc]: [string, any]) => {
    const entries = isDaily ? acc.daily : acc.monthly;
    entries.forEach((m: any) => {
      const key = isDaily ? m.day : m.month;
      if (!dataByMonth[key]) {
        dataByMonth[key] = { month: key };
        monthOrder.push(key);
      }
      dataByMonth[key][`bal_${id}`] = m.balance;
      dataByMonth[key][`inc_${id}`] = m.income;
      dataByMonth[key][`out_${id}`] = m.outcome;
      dataByMonth[key][`cur_${id}`] = acc.currency || 'USD';
    });
  });

  const chartData = monthOrder.map(m => dataByMonth[m]);

  const toggleAccount = (id: string) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = (val: boolean) => {
    const next: Record<string, boolean> = {};
    accountEntries.forEach(([id]) => { next[id] = val; });
    setSelected(next);
    setShowAll(val);
  };

  const visibleCount = Object.values(selected).filter(Boolean).length;
  const allSelected = visibleCount === accountEntries.length;

  return (
    <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>{title || 'Accounts history'}</div>
          <div style={{ font: '400 11px Space Grotesk, sans-serif', color: '#7d8794', marginTop: 3 }}>{isDaily ? 'Running balance per day per account' : 'Running balance per month per account'}</div>
        </div>
         <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => toggleAll(true)}
            style={{
              height: 24, padding: '0 8px', borderRadius: 4, border: '1px solid ' + (allSelected ? '#2dd4bf' : '#1e242c'),
              background: allSelected ? '#1e242c' : 'transparent', color: allSelected ? '#2dd4bf' : '#7d8794',
              font: '500 9px IBM Plex Mono, monospace', cursor: 'pointer'
            }}
          >
            All
          </button>
          <span style={{ font: '400 9px IBM Plex Mono, monospace', color: '#7d8794' }}>
            {visibleCount} / {accountEntries.length}
          </span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {accountEntries.map(([id, acc]: [string, any]) => {
              const color = accountColors[id] || '#2dd4bf';
              const isActive = !!selected[id];
              return (
                <button
                  key={id}
                  onClick={() => toggleAccount(id)}
                  title={acc.name}
                  style={{
                    height: 22, padding: '0 2px 0 20px', borderRadius: 3,
                    border: '1px solid ' + (isActive ? color : '#1e242c'),
                    background: isActive ? color + '22' : 'transparent',
                    color: isActive ? color : '#7d8794',
                    font: '400 8px IBM Plex Mono, monospace', whiteSpace: 'nowrap', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis',
                    position: 'relative'
                  }}
                >
                  <span style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }}></span>
                  {acc.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 18px', height: 260, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e242c" />
            <XAxis dataKey="month" stroke="#7d8794" style={{ fontSize: 12 }} tickLine={false} interval={isDaily ? Math.max(1, Math.floor(monthOrder.length / 6) - 1) : 0} tickFormatter={(v: string) => isDaily ? v.replace(/^(.*) \d+$/, '$1') : v.replace(/ \d{4}$/, '\/$1')} />
            <YAxis
              stroke="#7d8794"
              style={{ fontSize: 12 }}
              tickLine={false}
              tickMargin={6}
              tickFormatter={(v: number) => {
                const n = Number(v);
                if (isNaN(n) || !isFinite(n)) return '';
                if (Math.abs(n) >= 1000) return `${Math.round(n / 1000)}k`;
                return Math.round(n).toString();
              }}
            />
            <Tooltip content={sharedTooltip} />
            <Legend iconType="circle" layout="horizontal" verticalAlign="top" wrapperStyle={{ paddingTop: 8, paddingBottom: 4 }} />
            {visibleEntries.map(([id, acc]: [string, any]) => {
              const color = accountColors[id] || '#2dd4bf';
              const cur = accountCurrency[id] || 'USD';
              return (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={`bal_${id}`}
                  stroke={color}
                  strokeWidth={2}
                  dot={<ColoredDotInner color={color} name={acc.name} />}
                  name={acc.name}
                  activeDot={{ r: 6, stroke: color, strokeWidth: 2, onClick: undefined }}
                  isAnimationActive={false}
                  connectNulls={false}
                  label={(props: any) => {
                    const { x, y, value, index } = props;
                    if (typeof x !== 'number' || typeof y !== 'number') return null;
                    const v = Number(value);
                    if (isNaN(v) || !isFinite(v)) return null;
                    const short = Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v).toString();
                    return (
                      <foreignObject key={`label-${id}-${index}`} x={x - 6} y={y - 16} width={40} height={16}>
                        <span style={{ fontSize: 8, color, whiteSpace: 'nowrap' }}>{short}</span>
                      </foreignObject>
                    );
                  }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ padding: '10px 18px 12px', borderTop: '1px solid #1e242c', font: '400 10px IBM Plex Mono, monospace', color: '#7d8794' }}>
        Lines show each account's running balance {isDaily ? 'per day' : 'per month'}. Hover a point to see income/outcome/balance for that {isDaily ? 'day' : 'month'}. Click a point for account detail.
      </div>
      {activePoint && (
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e242c' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ font: '600 12px Space Grotesk, sans-serif' }}>{activePoint.acc?.name || activePoint.id} - {activePoint.month}</div>
            <button onClick={() => setActivePoint(null)} style={{ font: '400 9px IBM Plex Mono, monospace', color: '#7d8794', background: 'transparent', border: '1px solid #1e242c', borderRadius: 3, padding: '2px 6px', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ font: '400 9px IBM Plex Mono, monospace', color: '#7d8794' }}>Income</span>
              <span style={{ font: '600 13px IBM Plex Mono, monospace', color: '#4ade80' }}>{formatMoney(activePoint.income, accountCurrency[activePoint.id] || 'USD')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ font: '400 9px IBM Plex Mono, monospace', color: '#7d8794' }}>Outcome</span>
              <span style={{ font: '600 13px IBM Plex Mono, monospace', color: '#fb7185' }}>{formatMoney(activePoint.outcome, accountCurrency[activePoint.id] || 'USD')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ font: '400 9px IBM Plex Mono, monospace', color: '#7d8794' }}>Balance</span>
              <span style={{ font: '600 13px IBM Plex Mono, monospace', color: '#e6edf3' }}>{formatMoney(activePoint.balance, accountCurrency[activePoint.id] || 'USD')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
