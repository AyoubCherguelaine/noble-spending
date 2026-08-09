'use client';

import { useState } from 'react';

export default function SettingsModal({ settings, onClose, onSaved, t }: any) {
  const [displayTab, setDisplayTab] = useState<'display' | 'account'>('display');

  const [displayForm, setDisplayForm] = useState({
    currency: settings?.currency || 'USD',
    rate_eur: settings?.rate_eur || '1.14',
    rate_da: settings?.rate_da || '134.4',
    rate_eur_da: settings?.rate_eur_da || '146',
  });
  const [creds, setCreds] = useState({ currentUsername: '', currentPassword: '', newUsername: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [credSaving, setCredSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const saveDisplay = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(displayForm),
      });
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const changeCreds = async () => {
    setMsg('');
    setCredSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'changeCredentials', ...creds }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Credentials updated. Please sign in again.');
        setCreds({ currentUsername: '', currentPassword: '', newUsername: '', newPassword: '' });
        setTimeout(() => { window.location.href = '/login'; }, 1500);
      } else {
        setMsg(data.error || 'Failed');
      }
    } catch {
      setMsg('Network error');
    } finally {
      setCredSaving(false);
    }
  };

  const updateDisplay = (key: string, value: string) => setDisplayForm(prev => ({ ...prev, [key]: value }));

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(3,6,10,.62)', backdropFilter: 'blur(3px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,.5)', animation: 'fadeUp .16s ease-out' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Settings</span>
          <button onClick={onClose} style={{ width: 26, height: 26, border: '1px solid #1e242c', background: 'transparent', color: '#7d8794', borderRadius: 4, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '12px 18px', borderBottom: '1px solid #1e242c', display: 'flex', gap: 4 }}>
          <button onClick={() => setDisplayTab('display')} style={{
            flex: 1, padding: '6px 4px', border: 'none', borderRadius: 4, cursor: 'pointer',
            font: '600 11px Space Grotesk, sans-serif', background: displayTab === 'display' ? '#12151a' : 'transparent',
            color: displayTab === 'display' ? '#e6edf3' : '#7d8794'
          }}>Display & Currency</button>
          <button onClick={() => setDisplayTab('account')} style={{
            flex: 1, padding: '6px 4px', border: 'none', borderRadius: 4, cursor: 'pointer',
            font: '600 11px Space Grotesk, sans-serif', background: displayTab === 'account' ? '#12151a' : 'transparent',
            color: displayTab === 'account' ? '#e6edf3' : '#7d8794'
          }}>Account & Security</button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {displayTab === 'display' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em' }}>DISPLAY CURRENCY</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[['USD', '$ USD'], ['DA', 'DA'], ['EUR', '€ EUR']].map(([id, label]) => (
                    <button key={id} onClick={() => updateDisplay('currency', id)} style={{
                      flex: 1, padding: '6px 4px', border: '1px solid ' + (displayForm.currency === id ? '#2dd4bf' : '#1e242c'),
                      borderRadius: 4, cursor: 'pointer', font: '600 11px Space Grotesk, sans-serif',
                      background: displayForm.currency === id ? '#2dd4bf' : 'transparent', color: displayForm.currency === id ? '#04231e' : '#7d8794'
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em' }}>EXCHANGE RATES</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ font: '400 10px IBM Plex Mono, monospace', color: '#7d8794', marginBottom: 4 }}>1 EUR =</div>
                    <input value={displayForm.rate_eur} onChange={e => updateDisplay('rate_eur', e.target.value)} style={{ width: '100%', height: 32, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
                  </div>
                  <div>
                    <div style={{ font: '400 10px IBM Plex Mono, monospace', color: '#7d8794', marginBottom: 4 }}>1 USD =</div>
                    <input value={displayForm.rate_da} onChange={e => updateDisplay('rate_da', e.target.value)} style={{ width: '100%', height: 32, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                  <div>
                    <div style={{ font: '400 10px IBM Plex Mono, monospace', color: '#7d8794', marginBottom: 4 }}>1 EUR = (DA)</div>
                    <input value={displayForm.rate_eur_da} onChange={e => updateDisplay('rate_eur_da', e.target.value)} style={{ width: '100%', height: 32, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ font: '400 10px IBM Plex Mono, monospace', color: '#7d8794' }}>1 EUR = X USD · 1 USD = X DA · 1 EUR = X DA</div>
              </div>
            </>
          )}

          {displayTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em' }}>CHANGE CREDENTIALS</div>
              <input placeholder="Current username" value={creds.currentUsername} onChange={e => setCreds(p => ({ ...p, currentUsername: e.target.value }))} style={{ width: '100%', height: 32, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
              <input placeholder="Current password" type="password" value={creds.currentPassword} onChange={e => setCreds(p => ({ ...p, currentPassword: e.target.value }))} style={{ width: '100%', height: 32, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
              <input placeholder="New username" value={creds.newUsername} onChange={e => setCreds(p => ({ ...p, newUsername: e.target.value }))} style={{ width: '100%', height: 32, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
              <input placeholder="New password" type="password" value={creds.newPassword} onChange={e => setCreds(p => ({ ...p, newPassword: e.target.value }))} style={{ width: '100%', height: 32, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
              {msg && <div style={{ font: '400 11px IBM Plex Mono, monospace', color: msg.includes('updated') ? '#4ade80' : '#f87171' }}>{msg}</div>}
              <button onClick={changeCreds} disabled={credSaving} style={{ height: 32, padding: '0 16px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, font: '600 12px Space Grotesk, sans-serif', cursor: 'pointer', opacity: credSaving ? 0.6 : 1 }}>Update credentials</button>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 18px', borderTop: '1px solid #1e242c', display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
          {displayTab === 'display' ? (
            <>
              <button onClick={onClose} disabled={saving} style={{ height: 32, padding: '0 14px', background: 'transparent', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, font: '500 12px Space Grotesk, sans-serif', cursor: 'pointer' }}>{t('cancel')}</button>
              <button onClick={saveDisplay} disabled={saving} style={{ height: 32, padding: '0 16px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, font: '600 12px Space Grotesk, sans-serif', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{t('save')}</button>
            </>
          ) : (
            <button onClick={onClose} style={{ height: 32, padding: '0 14px', background: 'transparent', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, font: '500 12px Space Grotesk, sans-serif', cursor: 'pointer' }}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}
