'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { MarketQuote, MarketPoint } from '@/types';

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtPrice(price: number, currency: string, decimals = 2): string {
  if (currency === 'EUR' || price >= 1000) return price.toFixed(0);
  return price.toFixed(decimals);
}

export default function MarketsScreen(_props: { t: (key: string) => string }) {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [filter, setFilter] = useState<'all' | 'metal' | 'energy' | 'index'>('all');
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [historySymbol, setHistorySymbol] = useState<string | null>(null);
  const [history, setHistory] = useState<MarketPoint[]>([]);
  const [historyCurrency, setHistoryCurrency] = useState('USD');
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; price: number; date: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/markets');
      const json = await res.json();
      setQuotes(json.quotes || []);
      setStale(json.stale || false);
    } catch {
      setStale(true);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadHistory = async (symbol: string, currency = 'USD') => {
    setHistorySymbol(symbol);
    setHistoryCurrency(currency);
    setHoverPoint(null);
    try {
      const res = await fetch(`/api/markets/history?symbol=${symbol}&range=1M`);
      const json = await res.json();
      setHistory(json.points || []);
    } catch {
      setHistory([]);
    }
  };

  const filtered = filter === 'all' ? quotes : quotes.filter(q => q.category === filter);

  const chart = useMemo(() => {
    if (history.length < 2) return null;
    const prices = history.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const padding = range * 0.08;
    const low = min - padding;
    const high = max + padding;
    const width = 800;
    const height = 320;
    const points = history.map((p, i) => {
      const x = history.length === 1 ? width / 2 : (i / (history.length - 1)) * width;
      const y = height - ((p.price - low) / (high - low)) * height;
      return { x, y, date: p.date, price: p.price };
    });
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const area = `${path} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;
    const ticks = 6;
    const yTicks = Array.from({ length: ticks }, (_, i) => {
      const value = low + (high - low) * (i / (ticks - 1));
      return { value, y: height - (i / (ticks - 1)) * height };
    });
    const labelIndices: number[] = [];
    const maxLabels = 6;
    const step = Math.max(1, Math.floor(history.length / maxLabels));
    for (let i = 0; i < history.length; i += step) labelIndices.push(i);
    if (labelIndices[labelIndices.length - 1] !== history.length - 1) labelIndices.push(history.length - 1);
    const xLabels = labelIndices.map(i => ({ x: points[i].x, label: fmtDate(history[i].date) }));
    return { width, height, path, area, points, yTicks, xLabels, min, max, low, high };
  }, [history]);

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chart || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = chart.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const idx = Math.round((mouseX / chart.width) * (history.length - 1));
    const clamped = Math.max(0, Math.min(history.length - 1, idx));
    const point = chart.points[clamped];
    if (point) {
      setHoverPoint({ x: point.x, y: point.y, price: point.price, date: point.date });
    }
  };

  const handleSvgMouseLeave = () => {
    setHoverPoint(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {(['all', 'metal', 'energy', 'index'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '4px 10px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer',
            background: filter === f ? '#1a1f27' : 'transparent', color: filter === f ? '#e6edf3' : '#7d8794',
            font: '500 11px IBM Plex Mono, monospace'
          }}>{f.toUpperCase()}</button>
        ))}
        <button onClick={load} style={{ marginLeft: 'auto', padding: '4px 10px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', background: 'transparent', color: '#7d8794', font: '500 11px IBM Plex Mono, monospace' }}>REFRESH</button>
      </div>

      {stale && <div style={{ color: '#fbbf24', font: '500 11px IBM Plex Mono, monospace' }}>STALE DATA — external service unavailable</div>}

      {loading ? (
        <div style={{ color: '#7d8794', font: '400 12px IBM Plex Mono, monospace' }}>Loading market data...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {filtered.map(q => (
            <div key={q.symbol} onClick={() => loadHistory(q.symbol, q.currency)} style={{
              border: '1px solid #1e242c', borderRadius: 6, padding: 14, cursor: 'pointer',
              background: historySymbol === q.symbol ? '#1a1f27' : '#0f1318',
              transition: 'background 0.2s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ font: '600 13px Space Grotesk, sans-serif', color: '#e6edf3' }}>{q.name}</div>
                  <div style={{ font: '400 10px IBM Plex Mono, monospace', color: '#7d8794' }}>{q.symbol}</div>
                </div>
                {q.delayed && <span style={{ font: '500 9px IBM Plex Mono, monospace', color: '#fbbf24', border: '1px solid #fbbf24', padding: '2px 6px', borderRadius: 3 }}>DELAYED</span>}
              </div>
              <div style={{ font: '600 18px Space Grotesk, sans-serif', color: '#e6edf3' }}>
                {q.currency === 'USD' ? '$' : q.currency}{q.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}{q.unit ? ` / ${q.unit}` : ''}
              </div>
              {q.changePercent !== undefined && (
                <div style={{ color: q.changePercent >= 0 ? '#4ade80' : '#fb7185', font: '500 11px IBM Plex Mono, monospace', marginTop: 4 }}>
                  {q.changePercent >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%
                </div>
              )}
              <div style={{ font: '400 9px IBM Plex Mono, monospace', color: '#7d8794', marginTop: 8 }}>Source: {q.source} · {q.asOf}</div>
            </div>
          ))}
        </div>
      )}

      {historySymbol && chart && (
        <div style={{ border: '1px solid #1e242c', borderRadius: 6, padding: 14, background: '#0f1318' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ font: '600 13px Space Grotesk, sans-serif', color: '#e6edf3' }}>{historySymbol} — 1M</div>
            <div style={{ display: 'flex', gap: 12, font: '500 10px IBM Plex Mono, monospace', color: '#7d8794' }}>
              <span>High: {historyCurrency === 'EUR' ? '€' : '$'}{fmtPrice(chart.max, historyCurrency)}</span>
              <span>Low: {historyCurrency === 'EUR' ? '€' : '$'}{fmtPrice(chart.min, historyCurrency)}</span>
              {hoverPoint && <span style={{ color: '#2dd4bf' }}>{fmtPrice(hoverPoint.price, historyCurrency)}</span>}
            </div>
          </div>
          <div style={{ overflowX: 'auto', position: 'relative' }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${chart.width} ${chart.height + 40}`}
              style={{ width: '100%', height: 'auto', minWidth: 600, display: 'block' }}
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={handleSvgMouseLeave}
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                </linearGradient>
              </defs>
              {chart.yTicks.map((tick, i) => (
                <g key={'y' + i}>
                  <line x1="0" y1={tick.y} x2={chart.width} y2={tick.y} stroke="#1e242c" strokeDasharray="3,3" />
                  <text x="-8" y={tick.y + 3} textAnchor="end" fill="#7d8794" fontFamily="IBM Plex Mono, monospace" fontSize="10">
                    {fmtPrice(tick.value, historyCurrency)}
                  </text>
                </g>
              ))}
              <path d={chart.area} fill="url(#chartGradient)" />
              <path d={chart.path} fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {chart.points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill="#0f1318" stroke="#2dd4bf" strokeWidth="1.5" />
              ))}
              {chart.xLabels.map((label, i) => (
                <text key={'x' + i} x={label.x} y={chart.height + 18} textAnchor="middle" fill="#7d8794" fontFamily="IBM Plex Mono, monospace" fontSize="10">
                  {label.label}
                </text>
              ))}
              {hoverPoint && (
                <g>
                  <line x1={hoverPoint.x} y1="0" x2={hoverPoint.x} y2={chart.height} stroke="#2dd4bf" strokeDasharray="4,4" strokeOpacity="0.5" />
                  <circle cx={hoverPoint.x} cy={hoverPoint.y} r="5" fill="#2dd4bf" stroke="#0f1318" strokeWidth="2" />
                  <rect x={hoverPoint.x + 10} y={hoverPoint.y - 28} width="110" height="24" rx="4" fill="#1a1f27" stroke="#1e242c" />
                  <text x={hoverPoint.x + 15} y={hoverPoint.y - 12} fill="#e6edf3" fontFamily="IBM Plex Mono, monospace" fontSize="10">
                    {fmtPrice(hoverPoint.price, historyCurrency)} · {fmtDate(hoverPoint.date)}
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
