'use client';

import { useState, useEffect } from 'react';

export default function NotificationPanel({ alerts, onClose }: any) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') { setOpen(false); onClose?.(); }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [open, onClose]);

  if (!open) return null;

  const warnings = (alerts || []).filter((a: any) => a.warning);
  const overs = (alerts || []).filter((a: any) => a.over);

  return (
    <div onClick={() => { setOpen(false); onClose?.(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(3,6,10,.62)', zIndex: 70, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '70px 24px 24px 0' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 340, maxWidth: 'calc(100% - 48px)', background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,.5)', animation: 'fadeUp .16s ease-out' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Budget alerts</span>
          <button onClick={() => { setOpen(false); onClose?.(); }} style={{ width: 26, height: 26, border: '1px solid #1e242c', background: 'transparent', color: '#7d8794', borderRadius: 4, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 12, maxHeight: 400, overflowY: 'auto' }}>
          {overs.length === 0 && warnings.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#7d8794', fontSize: 12 }}>
              No budget alerts. You're within all limits.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {overs.map((a: any) => (
                <div key={a.id} style={{ padding: '10px 12px', background: '#2a1215', border: '1px solid #7f1d1d', borderRadius: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ font: '600 11.5px Space Grotesk, sans-serif', color: '#fb7185' }}>{a.category_key}</span>
                    <span style={{ font: '500 9px IBM Plex Mono, monospace', color: '#fb7185' }}>OVER BUDGET</span>
                  </div>
                  <div style={{ font: '400 11px IBM Plex Mono, monospace', color: '#e6edf3' }}>
                    {a.actual.toFixed(2)} / {a.limit.toFixed(2)} ({Math.round(a.pct * 100)}%)
                  </div>
                </div>
              ))}
              {warnings.map((a: any) => (
                <div key={a.id} style={{ padding: '10px 12px', background: '#2a2412', border: '1px solid #78350f', borderRadius: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ font: '600 11.5px Space Grotesk, sans-serif', color: '#fbbf24' }}>{a.category_key}</span>
                    <span style={{ font: '500 9px IBM Plex Mono, monospace', color: '#fbbf24' }}>WARNING</span>
                  </div>
                  <div style={{ font: '400 11px IBM Plex Mono, monospace', color: '#e6edf3' }}>
                    {a.actual.toFixed(2)} / {a.limit.toFixed(2)} ({Math.round(a.pct * 100)}%)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
