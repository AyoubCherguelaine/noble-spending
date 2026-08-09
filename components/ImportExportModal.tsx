'use client';

import { useState, useRef } from 'react';

export default function ImportExportModal({ onClose, onImported }: any) {
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMsg('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import-export', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMsg(`Imported ${data.imported} transactions${data.skipped > 0 ? ` (${data.skipped} skipped)` : ''}`);
        onImported();
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const downloadSample = () => {
    const csv = `id,date,merchant,category,method,account_id,original_currency,original_amount,type,note
,,Example: Carrefour,daily,card,1,USD,42.50,spend,Groceries
,,Example: Salary,income,bank,1,USD,5000,income,Monthly salary`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(3,6,10,.62)', backdropFilter: 'blur(3px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,.5)', animation: 'fadeUp .16s ease-out' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Import / Export</span>
          <button onClick={onClose} style={{ width: 26, height: 26, border: '1px solid #1e242c', background: 'transparent', color: '#7d8794', borderRadius: 4, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em' }}>EXPORT</div>
            <div style={{ font: '400 11px Space Grotesk, sans-serif', color: '#7d8794', marginBottom: 6 }}>
              Download all transactions as CSV. Open in Excel, Google Sheets, or any spreadsheet app.
            </div>
            <button onClick={() => { window.location.href = '/api/import-export?type=transactions&format=csv'; }} style={{ height: 34, padding: '0 14px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, font: '600 12px Space Grotesk, sans-serif', cursor: 'pointer' }}>
              Download CSV
            </button>
          </div>

          <div style={{ borderTop: '1px solid #1e242c', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em' }}>IMPORT</div>
            <div style={{ font: '400 11px Space Grotesk, sans-serif', color: '#7d8794', marginBottom: 6 }}>
              Upload a CSV file with columns: date, merchant, category, method, account_id, original_currency, original_amount, type, note
            </div>
            <button onClick={downloadSample} style={{ height: 30, padding: '0 12px', background: 'transparent', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, font: '500 11px Space Grotesk, sans-serif', cursor: 'pointer' }}>
              Download sample CSV
            </button>
            <div style={{ marginTop: 8 }}>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
              <button onClick={() => fileRef.current?.click()} disabled={importing} style={{ height: 34, padding: '0 14px', background: '#4ade80', color: '#06251f', border: 'none', borderRadius: 4, font: '600 12px Space Grotesk, sans-serif', cursor: 'pointer', opacity: importing ? 0.6 : 1 }}>
                {importing ? 'Importing...' : 'Choose CSV file'}
              </button>
            </div>
            {msg && <div style={{ font: '400 11px IBM Plex Mono, monospace', color: '#4ade80' }}>{msg}</div>}
            {error && <div style={{ font: '400 11px IBM Plex Mono, monospace', color: '#fb7185' }}>{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
