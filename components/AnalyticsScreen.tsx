'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatMoney } from '@/lib/currency';

type Granularity = 'day' | 'week' | 'month' | 'quarter' | 'year';
type GroupBy = 'category' | 'account' | 'method' | 'type';

const COLORS = ['#2dd4bf', '#60a5fa', '#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#22d3ee', '#fb7185', '#ec4899', '#10b981', '#f59e0b', '#6366f1'];

export default function AnalyticsScreen({ data, currency, t, onDrillDown }: any) {
  const [granularity, setGranularity] = useState<Granularity>('month');
  const [groupBy, setGroupBy] = useState<GroupBy>('category');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const categories = useMemo(() => {
    if (!data?.spendByCat) return [];
    return Object.keys(data.spendByCat).filter(c => data.spendByCat[c] > 0);
  }, [data]);

  const accounts = useMemo(() => {
    return data?.accounts || [];
  }, [data]);

  const methods = useMemo(() => {
    if (!data?.transactions) return [];
    const unique = new Set(data.transactions.map((t: any) => t.method));
    return Array.from(unique);
  }, [data]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          granularity,
          groupBy,
          typeFilter,
          categoryFilter,
          accountFilter,
          methodFilter,
          year: String(new Date().getFullYear()),
        });
        const res = await fetch(`/api/analytics?${params}`);
        const json = await res.json();
        setAnalyticsData(json);
      } catch (e) {
        console.error('Failed to fetch analytics:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [granularity, groupBy, typeFilter, categoryFilter, accountFilter, methodFilter]);

  const chartData = analyticsData?.chartData || [];
  const breakdownData = useMemo(() => {
    if (!analyticsData) return [];
    switch (groupBy) {
      case 'category': return analyticsData.categoryBreakdown || [];
      case 'account': return analyticsData.accountBreakdown || [];
      case 'method': return analyticsData.methodBreakdown || [];
      default: return [];
    }
  }, [analyticsData, groupBy]);

  const summary = analyticsData?.summary || { totalIncome: 0, totalSpend: 0, transactionCount: 0, avgTransaction: 0 };

  const handleChartClick = (data: any) => {
    if (data?.label && onDrillDown) {
      onDrillDown({
        type: 'time',
        label: data.label,
        granularity,
      });
    }
  };

  const handlePieClick = (data: any) => {
    if (data?.name && onDrillDown) {
      if (groupBy === 'category') {
        onDrillDown({ type: 'category', value: data.name });
      } else if (groupBy === 'account') {
        onDrillDown({ type: 'account', value: data.name });
      } else if (groupBy === 'method') {
        onDrillDown({ type: 'method', value: data.name });
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['day', 'week', 'month', 'quarter', 'year'] as Granularity[]).map(g => (
          <button key={g} onClick={() => setGranularity(g)} style={{
            padding: '6px 11px', borderRadius: 4, border: '1px solid #1e242c', cursor: 'pointer',
            font: '500 11px IBM Plex Mono, monospace', background: granularity === g ? '#2dd4bf' : 'transparent',
            color: granularity === g ? '#04231e' : '#7d8794'
          }}>{g.toUpperCase()}</button>
        ))}
        <span style={{ width: 1, height: 20, background: '#1e242c', margin: '0 4px' }}></span>
        {(['category', 'account', 'method'] as GroupBy[]).map(g => (
          <button key={g} onClick={() => setGroupBy(g)} style={{
            padding: '6px 11px', borderRadius: 4, border: '1px solid #1e242c', cursor: 'pointer',
            font: '500 11px IBM Plex Mono, monospace', background: groupBy === g ? '#2dd4bf' : 'transparent',
            color: groupBy === g ? '#04231e' : '#7d8794'
          }}>{g}</button>
        ))}
        <span style={{ width: 1, height: 20, background: '#1e242c', margin: '0 4px' }}></span>
        {(['all', 'income', 'spend'] as const).map(tv => (
          <button key={tv} onClick={() => setTypeFilter(tv)} style={{
            padding: '6px 11px', borderRadius: 4, border: '1px solid #1e242c', cursor: 'pointer',
            font: '500 11px IBM Plex Mono, monospace', background: typeFilter === tv ? '#2dd4bf' : 'transparent',
            color: typeFilter === tv ? '#04231e' : '#7d8794'
          }}>{tv === 'all' ? 'ALL' : tv.toUpperCase()}</button>
        ))}
      </div>

      {categoryFilter !== 'all' && (
        <div style={{ padding: '8px 12px', background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ font: '500 10px IBM Plex Mono, monospace', color: '#7d8794' }}>FILTERED:</span>
          <span style={{ font: '600 11px Space Grotesk, sans-serif', color: '#2dd4bf' }}>{categoryFilter}</span>
          <button onClick={() => { setCategoryFilter('all'); setGroupBy('category'); }} style={{ font: '400 9px IBM Plex Mono, monospace', color: '#fb7185', background: 'transparent', border: '1px solid #1e242c', borderRadius: 3, padding: '2px 6px', cursor: 'pointer' }}>Clear</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, padding: '14px 15px' }}>
          <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.08em' }}>TOTAL INCOME</div>
          <div style={{ marginTop: 8, font: '600 21px IBM Plex Mono, monospace', color: '#4ade80', letterSpacing: '-.02em' }}>{formatMoney(summary.totalIncome, currency)}</div>
          <div style={{ marginTop: 6, font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>from {summary.transactionCount} transactions</div>
        </div>
        <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, padding: '14px 15px' }}>
          <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.08em' }}>TOTAL SPEND</div>
          <div style={{ marginTop: 8, font: '600 21px IBM Plex Mono, monospace', color: '#e6edf3', letterSpacing: '-.02em' }}>{formatMoney(summary.totalSpend, currency)}</div>
          <div style={{ marginTop: 6, font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>from {summary.transactionCount} transactions</div>
        </div>
        <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, padding: '14px 15px' }}>
          <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.08em' }}>NET</div>
          <div style={{ marginTop: 8, font: '600 21px IBM Plex Mono, monospace', color: summary.totalIncome - summary.totalSpend >= 0 ? '#4ade80' : '#fb7185', letterSpacing: '-.02em' }}>{formatMoney(summary.totalIncome - summary.totalSpend, currency)}</div>
          <div style={{ marginTop: 6, font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>avg {formatMoney(summary.avgTransaction, currency)}/tx</div>
        </div>
      </div>

      <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Trend Analysis</div>
            <div style={{ font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>Click any point to drill down by {granularity}</div>
          </div>
          <span style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794' }}>BY {granularity.toUpperCase()}</span>
        </div>
        <div style={{ padding: '12px 18px', height: 280 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#7d8794', fontSize: 12 }}>Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} onClick={handleChartClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e242c" />
                <XAxis dataKey="label" stroke="#7d8794" style={{ fontSize: 12 }} interval={granularity === 'day' ? Math.max(1, Math.floor(chartData.length / 6) - 1) : 0} />
                <YAxis stroke="#7d8794" style={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4 }} labelStyle={{ color: '#e6edf3' }} itemStyle={{ color: '#e6edf3' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="income" stroke="#4ade80" strokeWidth={2} dot={{ r: granularity === 'day' ? 3 : 4 }} />
                <Line type="monotone" dataKey="spend" stroke="#fb7185" strokeWidth={2} dot={{ r: granularity === 'day' ? 3 : 4 }} />
                <Line type="monotone" dataKey="net" stroke="#2dd4bf" strokeWidth={2} dot={{ r: granularity === 'day' ? 3 : 4 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Breakdown</div>
              <div style={{ font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>By {groupBy}</div>
            </div>
            <span style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794' }}>CLICK TO FILTER</span>
          </div>
          <div style={{ padding: '12px 18px', height: 260 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#7d8794', fontSize: 12 }}>Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    onClick={handlePieClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {breakdownData.map((entry: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4 }} labelStyle={{ color: '#e6edf3' }} itemStyle={{ color: '#e6edf3' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Volume Comparison</div>
              <div style={{ font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>Income vs Spend by {granularity}</div>
            </div>
          </div>
          <div style={{ padding: '12px 18px', height: 260 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#7d8794', fontSize: 12 }}>Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e242c" />
                  <XAxis dataKey="label" stroke="#7d8794" style={{ fontSize: 12 }} interval={granularity === 'day' ? Math.max(1, Math.floor(chartData.length / 6) - 1) : 0} />
                  <YAxis stroke="#7d8794" style={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4 }} labelStyle={{ color: '#e6edf3' }} itemStyle={{ color: '#e6edf3' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="income" fill="#4ade80" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="spend" fill="#fb7185" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e242c', font: '600 13.5px Space Grotesk, sans-serif' }}>
          {groupBy === 'category' ? 'Category Breakdown' : groupBy === 'account' ? 'Account Breakdown' : 'Payment Method Breakdown'}
        </div>
        <div style={{ padding: '12px 18px' }}>
          {loading ? (
            <div style={{ color: '#7d8794', fontSize: 12, textAlign: 'center', padding: 20 }}>Loading...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {breakdownData.map((item: any, i: number) => (
                <div key={i} onClick={() => handlePieClick({ name: item.name || item.id })} style={{
                  padding: '12px 14px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4,
                  cursor: 'pointer', transition: 'border-color 0.15s'
                }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2dd4bf'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1e242c'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], display: 'inline-block' }}></span>
                    <span style={{ font: '500 12px Space Grotesk, sans-serif', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name || item.id}</span>
                    <span style={{ font: '400 9px IBM Plex Mono, monospace', color: '#7d8794' }}>{item.count} tx</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, font: '400 11px IBM Plex Mono, monospace' }}>
                    <span style={{ color: '#4ade80' }}>+{formatMoney(item.income || 0, currency)}</span>
                    <span style={{ color: '#fb7185' }}>−{formatMoney(item.spend || 0, currency)}</span>
                  </div>
                  <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: '#1e242c', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min((item.value / Math.max(summary.totalIncome + summary.totalSpend, 1)) * 100, 100)}%`, background: COLORS[i % COLORS.length], borderRadius: 2 }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, padding: '14px 18px', display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: '#7d8794' }}>
        <span>GRANULARITY: <span style={{ color: '#2dd4bf' }}>{granularity.toUpperCase()}</span></span>
        <span>GROUP BY: <span style={{ color: '#2dd4bf' }}>{groupBy.toUpperCase()}</span></span>
        <span>TYPE: <span style={{ color: '#2dd4bf' }}>{typeFilter.toUpperCase()}</span></span>
        <span>DATA POINTS: <span style={{ color: '#e6edf3' }}>{chartData.length}</span></span>
        <span style={{ marginLeft: 'auto', fontSize: 10 }}>Click charts to slice & drill down</span>
      </div>
    </div>
  );
}
