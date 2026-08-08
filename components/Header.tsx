'use client';

export default function Header({ month, year, setMonth, setYear, monthLabel, netLabel, query, setQuery, onAdd, t, onLogout, activeAlerts, onToggleMobile }: any) {

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 20, background: '#0b0d10', borderBottom: '1px solid #1e242c', padding: '14px 26px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      {onToggleMobile && (
        <button onClick={onToggleMobile} style={{ width: 28, height: 28, border: '1px solid #1e242c', background: '#12151a', color: '#e6edf3', borderRadius: 4, cursor: 'pointer', fontSize: '13px', display: 'none' }}>☰</button>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={prevMonth} style={{ width: 28, height: 28, border: '1px solid #1e242c', background: '#12151a', color: '#e6edf3', borderRadius: 4, cursor: 'pointer', fontSize: '13px' }}>‹</button>
        <div style={{ minWidth: 132, textAlign: 'center', font: '600 13px Space Grotesk, sans-serif' }}>{monthLabel}</div>
        <button onClick={nextMonth} style={{ width: 28, height: 28, border: '1px solid #1e242c', background: '#12151a', color: '#e6edf3', borderRadius: 4, cursor: 'pointer', fontSize: '13px' }}>›</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginInlineStart: 'auto' }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('search')} style={{
          flex: 1, minWidth: 170, maxWidth: 320, height: 32, padding: '0 11px',
          background: '#12151a', border: '1px solid #1e242c', borderRadius: 4,
          color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none'
        }} />
        <div style={{ textAlign: 'end' }}>
          <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em' }}>{t('net')}</div>
          <div style={{ font: '600 15px IBM Plex Mono, monospace', color: '#4ade80' }}>{netLabel}</div>
        </div>
        <button onClick={onAdd} style={{ height: 32, padding: '0 14px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, font: '600 12px Space Grotesk, sans-serif', cursor: 'pointer' }}>+ {t('add')}</button>
        {activeAlerts?.length > 0 && (
          <div style={{
            position: 'relative', height: 32, padding: '0 10px', background: '#12151a', border: '1px solid #1e242c',
            borderRadius: 4, font: '500 12px IBM Plex Mono, monospace', color: '#fbbf24', cursor: 'default'
          }} title={`${activeAlerts.length} budget alert${activeAlerts.length > 1 ? 's' : ''}`}>
            ⚠ {activeAlerts.length}
          </div>
        )}
        {onLogout && (
          <button onClick={onLogout} style={{ height: 32, padding: '0 12px', background: 'transparent', border: '1px solid #1e242c', color: '#7d8794', borderRadius: 4, font: '500 12px Space Grotesk, sans-serif', cursor: 'pointer' }}>Logout</button>
        )}
      </div>
    </header>
  );
}
