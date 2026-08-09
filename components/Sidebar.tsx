'use client';

const THEMES: Record<string, { name: string; short: string }> = {
  terminal: { name: 'Terminal', short: 'TM' }, ledger: { name: 'Ledger', short: 'LG' }, canvas: { name: 'Canvas', short: 'CV' },
};

export default function Sidebar({ screen, setScreen, theme, setTheme, currency, month, year, setMonth, setYear, monthLabel, totals, t, onOpenSettings, mobileOpen, onMobileClose }: any) {
  const navItems = [
    ['overview', t('overview'), '01', ''], ['analytics', 'Analytics', '02', ''], ['recurring', 'Recurring', '03', ''], ['accounts', 'Accounts', '04', ''], ['income', t('income'), '05', totals ? `${totals.totalIn.toFixed(2)}` : ''],
    ['spending', t('spending'), '06', totals ? `${totals.totalOut.toFixed(2)}` : ''], ['debts', t('debts'), '07', totals ? `${totals.debtOweTot.toFixed(2)}` : ''],
    ['tx', t('tx'), '08', ''], ['budget', t('budget'), '09', ''],
  ];

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #1e242c' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, background: '#2dd4bf', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06251f', font: '700 12px IBM Plex Mono, monospace' }}>₼</div>
          <div style={{ font: '600 14px Space Grotesk, sans-serif', letterSpacing: '-.01em' }}>Moneyflow</div>
        </div>
        <div style={{ marginTop: 10, font: '400 10.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.04em' }}>{monthLabel} · {currency}</div>
      </div>

      <nav style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', flex: 1 }}>
        {navItems.map(([id, label, tag, badge]) => (
          <button key={id} onClick={() => { setScreen(id as any); onMobileClose?.(); }} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
            padding: '8px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', textAlign: 'start',
            font: `${screen === id ? '600' : '450'} 12.5px Space Grotesk, sans-serif`,
            background: screen === id ? '#1a1f27' : 'transparent',
            color: screen === id ? '#e6edf3' : '#7d8794',
            boxShadow: screen === id ? 'inset 2px 0 0 #2dd4bf' : 'none'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: 16, font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.02em' }}>{tag}</span>
              <span>{label}</span>
            </span>
            {badge && <span style={{ font: '500 10.5px IBM Plex Mono, monospace', color: '#7d8794' }}>{badge}</span>}
          </button>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '14px', borderTop: '1px solid #1e242c', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.09em' }}>DIRECTION</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {Object.entries(THEMES).map(([id, info]) => (
            <button key={id} onClick={() => setTheme(id as any)} title={info.name} style={{
              flex: 1, padding: '5px 4px', border: '1px solid ' + (theme === id ? '#2dd4bf' : '#1e242c'),
              borderRadius: 4, cursor: 'pointer', font: '600 10.5px IBM Plex Mono, monospace',
              background: theme === id ? '#2dd4bf' : 'transparent', color: theme === id ? '#04231e' : '#7d8794'
            }}>{info.short}</button>
          ))}
        </div>
        <button onClick={onOpenSettings} style={{ marginTop: 4, padding: '6px 4px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '600 10.5px IBM Plex Mono, monospace', background: 'transparent', color: '#7d8794' }}>SETTINGS</button>
      </div>
    </div>
  );

  return (
    <>
      <aside style={{ borderInlineEnd: '1px solid #1e242c', background: '#12151a', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        {content}
      </aside>
      {mobileOpen && (
        <>
          <div onClick={onMobileClose} style={{ position: 'fixed', inset: 0, background: 'rgba(3,6,10,.62)', zIndex: 40 }} />
          <aside style={{ position: 'fixed', insetInlineStart: 0, top: 0, bottom: 0, width: 260, background: '#12151a', borderInlineEnd: '1px solid #1e242c', zIndex: 50, display: 'flex', flexDirection: 'column' }}>
            {content}
          </aside>
        </>
      )}
    </>
  );
}
