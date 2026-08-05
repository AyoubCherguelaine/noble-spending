'use client';

const COLORS: Record<string, string> = {
  housing: '#60a5fa', daily: '#34d399', online: '#f472b6', real: '#fbbf24',
  subs: '#a78bfa', transport: '#22d3ee', debt: '#fb7185', savings: '#4ade80',
};

export default function SpendingScreen({ data, currency, t, catFilter, setCatFilter, setScreen }: any) {
  const { spendByCat, subs, bills, txRows } = data;
  const catKeys = Object.keys(spendByCat);
  const totalOut = (Object.values(spendByCat) as number[]).reduce((a, b) => a + b, 0);
  const maxSpend = Math.max(...catKeys.map(k => spendByCat[k] as number), 1);
  const pct = (key: string) => totalOut > 0 ? Math.round((spendByCat[key] as number) / totalOut * 100) : 0;
  const currencySymbol = currency === 'DA' ? 'DA ' : currency === 'EUR' ? '€' : '$';

  const visibleCats = catFilter ? catKeys.filter(k => k === catFilter) : catKeys;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        <button onClick={() => setCatFilter(null)} style={{
          padding: '6px 11px', borderRadius: 4, border: '1px solid #1e242c', cursor: 'pointer',
          font: '500 11px Space Grotesk, sans-serif', background: !catFilter ? '#2dd4bf' : 'transparent',
          color: !catFilter ? '#04231e' : '#7d8794'
        }}>{t('all')} <span style={{ opacity: .6 }}>{totalOut.toFixed(2)}</span></button>
        {catKeys.map(key => (
          <button key={key} onClick={() => setCatFilter(key)} style={{
            padding: '6px 11px', borderRadius: 4, border: '1px solid #1e242c', cursor: 'pointer',
            font: '500 11px Space Grotesk, sans-serif', background: catFilter === key ? '#2dd4bf' : 'transparent',
            color: catFilter === key ? '#04231e' : '#7d8794'
          }}>{key} <span style={{ opacity: .6 }}>{spendByCat[key].toFixed(2)}</span></button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid #1e242c', font: '600 12.5px Space Grotesk, sans-serif' }}>Spending by category</div>
          {visibleCats.map(key => {
            const count = txRows.filter((r: any) => r.category === key).length || 0;
            return (
              <div key={key} onClick={() => setScreen('tx')} style={{ padding: '11px 16px', borderBottom: '1px solid #1e242c', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[key] || '#94a3b8', display: 'inline-block' }}></span>
                    <span style={{ font: '500 12.5px Space Grotesk, sans-serif' }}>{key}</span>
                    <span style={{ font: '400 10px IBM Plex Mono, monospace', color: '#7d8794' }}>{count} tx</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ font: '600 12.5px IBM Plex Mono, monospace' }}>{spendByCat[key].toFixed(2)}</span>
                    <span style={{ font: '400 10px IBM Plex Mono, monospace', color: '#7d8794', width: 34, textAlign: 'end' }}>{pct(key)}%</span>
                  </div>
                </div>
                <div style={{ marginTop: 8, height: 5, borderRadius: 3, background: '#1e242c', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(spendByCat[key] / maxSpend * 100, 100)}%`, background: COLORS[key] || '#94a3b8', borderRadius: 3 }}></div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ font: '600 12.5px Space Grotesk, sans-serif' }}>Subscriptions</span>
              <span style={{ font: '500 11px IBM Plex Mono, monospace', color: '#7d8794' }}>{data.totals.subsTotal.toFixed(2)} /mo</span>
            </div>
            {subs.map((s: any) => (
              <div key={s.id} style={{ padding: '9px 16px', borderBottom: '1px solid #1e242c', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: '500 12px Space Grotesk, sans-serif' }}>{s.name}</div>
                  <div style={{ font: '400 10px IBM Plex Mono, monospace', color: '#7d8794' }}>{s.plan}</div>
                </div>
                <div style={{ font: '400 10.5px IBM Plex Mono, monospace', color: '#7d8794' }}>{s.next_billing}</div>
                <div style={{ font: '600 12px IBM Plex Mono, monospace', textAlign: 'end', minWidth: 74 }}>{s.cost_display !== undefined ? s.cost_display.toFixed(2) : s.cost.toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ font: '600 12.5px Space Grotesk, sans-serif' }}>Bills & housing</span>
              <span style={{ font: '500 11px IBM Plex Mono, monospace', color: '#7d8794' }}>{data.totals.billsTotal.toFixed(2)}</span>
            </div>
            {bills.map((b: any) => (
              <div key={b.id} style={{ padding: '11px 16px', borderBottom: '1px solid #1e242c', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: '500 12px Space Grotesk, sans-serif' }}>{b.name}</div>
                  <div style={{ font: '400 10px IBM Plex Mono, monospace', color: '#7d8794' }}>avg {b.average.toFixed(2)} {b.currency ? `· ${b.currency}` : ''}</div>
                </div>
                <div>
                  <div style={{ font: '400 10px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.06em' }}>THIS MONTH</div>
                  <div style={{ marginTop: 3, font: '400 11.5px Space Grotesk, sans-serif' }}>{b.cost_display !== undefined ? b.cost_display.toFixed(2) : b.cost.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'end' }}>
                  <div style={{ font: '600 12px IBM Plex Mono, monospace', color: b.cost > b.average ? '#fb7185' : '#4ade80' }}>{b.cost > b.average ? '+' : ''}{Math.round((b.cost - b.average) / b.average * 100)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
