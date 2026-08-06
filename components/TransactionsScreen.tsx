'use client';

import { useState, useEffect } from 'react';

const CATEGORIES = ['income', 'housing', 'daily', 'online', 'real', 'subs', 'transport', 'debt', 'savings'];

export default function TransactionsScreen({ data, currency, t, catFilter, query, refresh }: any) {
  let rows = data.txRows;
  if (catFilter) rows = rows.filter((r: any) => r.category === catFilter);
  if (query) {
    const q = query.toLowerCase();
    rows = rows.filter((r: any) => r.merchant.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
  }

  const sum = rows.reduce((a: number, r: any) => a + (r.converted_amount || 0), 0);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then((rows: any[]) => setAccounts(rows)).catch(() => {});
  }, []);

  const getAccountName = (accountId: number | null | undefined) => {
    if (!accountId) return '—';
    const account = accounts.find((a: any) => a.id === accountId);
    return account ? `${account.name} (${account.currency})` : `#${accountId}`;
  };

  return (
    <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ padding: '13px 16px', borderBottom: '1px solid #1e242c', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ font: '600 12.5px Space Grotesk, sans-serif' }}>{t('tx')}</span>
        <span style={{ font: '400 10.5px IBM Plex Mono, monospace', color: '#7d8794' }}>{rows.length} movements</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '74px 1.5fr 1fr 110px 100px 74px 106px 80px', gap: 14, padding: '11px 16px', borderBottom: '1px solid #1e242c', background: '#1a1f27', font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.08em', textTransform: 'uppercase' }}>
        <span>{t('date')}</span><span>{t('merchant')}</span><span>{t('cat')}</span><span>Account</span><span>{t('method')}</span><span style={{ textAlign: 'end' }}>{t('orig')}</span><span style={{ textAlign: 'end' }}>{t('amount')}</span><span style={{ textAlign: 'end' }}>Actions</span>
      </div>
      {rows.map((r: any) => (
        <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '74px 1.5fr 1fr 110px 100px 74px 106px 80px', gap: 14, padding: '11px 16px', borderBottom: '1px solid #1e242c', alignItems: 'center' }}>
          <span style={{ font: '400 11.5px IBM Plex Mono, monospace', color: '#7d8794' }}>{r.date}</span>
          <span style={{ font: '500 12.5px Space Grotesk, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.merchant}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, font: '400 11.5px Space Grotesk, sans-serif', color: '#7d8794' }}><span style={r.dotStyle as any}></span>{r.category}</span>
          <span style={{ font: '400 11px IBM Plex Mono, monospace', color: '#7d8794' }}>{getAccountName(r.account_id)}</span>
          <span style={{ font: '400 11px IBM Plex Mono, monospace', color: '#7d8794' }}>{r.method}</span>
          <span style={{ textAlign: 'end', font: '400 11px IBM Plex Mono, monospace', color: '#7d8794' }}>{r.original_currency}</span>
          <span style={{ textAlign: 'end', font: '600 12.5px IBM Plex Mono, monospace', color: r.color }}>{r.amount}</span>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'end' }}>
            <button onClick={() => setEditingTx(r)} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#2dd4bf' }}>Edit</button>
            {r.salary_id && <button onClick={() => setEditingSalaryId(r.salary_id)} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#fbbf24' }}>Salary</button>}
            <button onClick={async () => { if (confirm('Delete this transaction?')) { await fetch(`/api/transactions?id=${r.id}`, { method: 'DELETE' }); refresh(); } }} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#fb7185' }}>Del</button>
          </div>
        </div>
      ))}
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', font: '500 11.5px IBM Plex Mono, monospace', color: '#7d8794' }}>
        <span>Shown total</span><span>{sum.toFixed(2)}</span>
      </div>
      {editingTx && <EditTxModal tx={editingTx} accounts={accounts} onClose={() => setEditingTx(null)} onSaved={() => { setEditingTx(null); refresh(); }} t={t} />}
      {editingSalaryId && <EditSalaryFromTxModal salaryId={editingSalaryId} onClose={() => setEditingSalaryId(null)} onSaved={() => { setEditingSalaryId(null); refresh(); }} t={t} />}
    </div>
  );
}

function EditTxModal({ tx, accounts, onClose, onSaved, t }: any) {
  const [form, setForm] = useState({
    id: tx.id,
    date: tx.date || '',
    merchant: tx.merchant || '',
    category: tx.category || 'daily',
    method: tx.method || '',
    account_id: tx.account_id || '',
    original_currency: tx.original_currency || 'USD',
    original_amount: tx.original_amount || 0,
    type: tx.type || 'spend',
    note: tx.note || '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.account_id) {
      alert('Please select an account.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, account_id: Number(form.account_id), original_amount: parseFloat(form.original_amount) || 0 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to update');
        return;
      }
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(3,6,10,.62)', backdropFilter: 'blur(3px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,.5)', animation: 'fadeUp .16s ease-out' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Edit transaction</span>
          <button onClick={onClose} style={{ width: 26, height: 26, border: '1px solid #1e242c', background: 'transparent', color: '#7d8794', borderRadius: 4, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 118px', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Merchant</div>
              <input value={form.merchant} onChange={e => setForm({ ...form, merchant: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Amount</div>
              <input value={form.original_amount} onChange={e => setForm({ ...form, original_amount: e.target.value })} type="number" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
            </div>
          </div>
          <div>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Account *</div>
            <select value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })} style={{ width: '100%', height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }}>
              <option value="">Select account</option>
              {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Category</div>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Date</div>
              <input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
            </div>
          </div>
          <div>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Method</div>
            <input value={form.method} onChange={e => setForm({ ...form, method: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} disabled={saving} style={{ height: 32, padding: '0 14px', background: 'transparent', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
            <button onClick={submit} disabled={saving || !form.account_id} style={{ height: 32, padding: '0 16px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: saving || !form.account_id ? 0.6 : 1 }}>Update</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditSalaryFromTxModal({ salaryId, onClose, onSaved, t }: any) {
  const [salary, setSalary] = useState<any>(null);
  const [form, setForm] = useState({ company: '', role: '', gross: '', net: '', payday: '', type: '', date: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/salaries`)
      .then(res => res.json())
      .then((rows: any[]) => {
        const s = rows.find((r: any) => r.id === salaryId);
        if (s) {
          setSalary(s);
          setForm({ company: s.company, role: s.role || '', gross: s.gross ?? '', net: s.net, payday: s.payday || '', type: s.type || '', date: s.date || '' });
        }
      })
      .catch(() => {});
  }, [salaryId]);

  const submit = async () => {
    if (!salary) return;
    setSaving(true);
    try {
      await fetch(`/api/salaries?id=${salary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, gross: parseFloat(form.gross) || 0, net: parseFloat(form.net) }),
      });
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!salary) return null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(3,6,10,.62)', backdropFilter: 'blur(3px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,.5)', animation: 'fadeUp .16s ease-out' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Edit linked salary</span>
          <button onClick={onClose} style={{ width: 26, height: 26, border: '1px solid #1e242c', background: 'transparent', color: '#7d8794', borderRadius: 4, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Company</div>
              <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Role</div>
              <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Gross</div>
              <input type="number" value={form.gross} onChange={e => setForm({ ...form, gross: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px IBM Plex Mono, monospace', outline: 'none' }} />
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Net</div>
              <input type="number" value={form.net} onChange={e => setForm({ ...form, net: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px IBM Plex Mono, monospace', outline: 'none' }} />
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Date</div>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px IBM Plex Mono, monospace', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Payday</div>
              <input value={form.payday} onChange={e => setForm({ ...form, payday: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Type</div>
              <input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} disabled={saving} style={{ height: 32, padding: '0 14px', background: 'transparent', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
            <button onClick={submit} disabled={saving} style={{ height: 32, padding: '0 16px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>Update</button>
          </div>
        </div>
      </div>
    </div>
  );
}
