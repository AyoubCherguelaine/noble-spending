'use client';

import { useState, useEffect } from 'react';

interface Candidate {
  id: number; source: string; external_id: string; merchant: string; purchase_date: string; amount: number; currency: string; card_last4: string; matched_method_id: number; category: string; note: string; confidence: number; raw_text: string; place_id: string; latitude: number; longitude: number; status: string;
}

export default function PurchaseCandidatesScreen(_t: { (key: string): string }, onClose?: () => void) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const load = async () => {
    try {
      const res = await fetch('/api/purchase-candidates');
      const json = await res.json();
      setCandidates(json);
    } catch {
      // ignore
    }
  };

  useEffect(() => { load(); }, []);

  const importOne = async (id: number) => {
    await fetch(`/api/purchase-candidates/${id}/import`, { method: 'POST' });
    load();
  };

  const rejectOne = async (id: number) => {
    await fetch(`/api/purchase-candidates/${id}/reject`, { method: 'POST' });
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ font: '600 16px Space Grotesk, sans-serif', color: '#e6edf3' }}>Purchase Candidates</div>
        {onClose && <button onClick={onClose} style={{ border: '1px solid #1e242c', borderRadius: 4, padding: '4px 10px', background: 'transparent', color: '#7d8794', cursor: 'pointer' }}>CLOSE</button>}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', font: '12px IBM Plex Mono, monospace', color: '#e6edf3' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e242c', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Source</th>
              <th style={{ padding: 8 }}>Merchant</th>
              <th style={{ padding: 8 }}>Amount</th>
              <th style={{ padding: 8 }}>Date</th>
              <th style={{ padding: 8 }}>Card</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #1e242c' }}>
                <td style={{ padding: 8, textTransform: 'uppercase' }}>{c.source}</td>
                <td style={{ padding: 8 }}>{c.merchant}</td>
                <td style={{ padding: 8 }}>{c.amount} {c.currency}</td>
                <td style={{ padding: 8 }}>{c.purchase_date}</td>
                <td style={{ padding: 8 }}>{c.card_last4 ? `****${c.card_last4}` : '-'}</td>
                <td style={{ padding: 8, color: c.status === 'pending' ? '#fbbf24' : c.status === 'imported' ? '#4ade80' : '#fb7185' }}>{c.status}</td>
                <td style={{ padding: 8, display: 'flex', gap: 6 }}>
                  {c.status === 'pending' && (
                    <>
                      <button onClick={() => importOne(c.id)} style={{ border: '1px solid #4ade80', borderRadius: 3, padding: '2px 8px', background: 'transparent', color: '#4ade80', cursor: 'pointer' }}>IMPORT</button>
                      <button onClick={() => rejectOne(c.id)} style={{ border: '1px solid #fb7185', borderRadius: 3, padding: '2px 8px', background: 'transparent', color: '#fb7185', cursor: 'pointer' }}>REJECT</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
