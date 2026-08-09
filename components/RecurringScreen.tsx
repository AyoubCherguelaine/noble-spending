'use client';

import { useState, useEffect } from 'react';

const COLORS: Record<string, string> = {
  income: '#4ade80', housing: '#60a5fa', daily: '#34d399', online: '#f472b6',
  real: '#fbbf24', subs: '#a78bfa', transport: '#22d3ee', debt: '#fb7185', savings: '#4ade80',
};

export default function RecurringScreen({ data, currency, t, refresh, month, year }: any) {
  const [recurring, setRecurring] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'spend',
    category: 'daily',
    method: 'card',
    account_id: '',
    merchant: '',
    original_currency: 'USD',
    original_amount: '',
    note: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    next_occurrence: new Date().toISOString().split('T')[0],
  });
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then((rows: any[]) => {
      setAccounts(rows);
      if (rows.length > 0 && !form.account_id) {
        const match = rows.find((a: any) => a.currency === (currency || 'USD'));
        setForm(prev => ({ ...prev, account_id: match ? String(match.id) : String(rows[0].id), original_currency: match ? match.currency : 'USD' }));
      }
    }).catch(() => {});
  }, [currency]);

  useEffect(() => {
    if (!form.account_id) return;
    const account = accounts.find((a: any) => String(a.id) === String(form.account_id));
    if (account && account.currency && account.currency !== form.original_currency) {
      setForm(prev => ({ ...prev, original_currency: account.currency }));
    }
  }, [form.account_id, accounts]);

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recurring');
      const rows = await res.json();
      setRecurring(rows);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecurring(); }, []);

  const generateNow = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/cron/generate-recurring', { method: 'POST' });
      const data = await res.json();
      alert(`Generated ${data.generated} transactions`);
      refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const submit = async () => {
    if (!form.merchant || !form.original_amount || !form.account_id) {
      alert('Please fill in all required fields');
      return;
    }

    const payload = {
      ...form,
      id: editingItem ? editingItem.id : undefined,
      account_id: Number(form.account_id),
      original_amount: parseFloat(form.original_amount),
    };

    setSaving(true);
    try {
      const url = editingItem ? `/api/recurring?id=${editingItem.id}` : '/api/recurring';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to save');
        return;
      }

      setForm({
        type: 'spend', category: 'daily', method: 'card', account_id: '',
        merchant: '', original_currency: 'USD', original_amount: '', note: '',
        frequency: 'monthly', start_date: new Date().toISOString().split('T')[0],
        end_date: '', next_occurrence: new Date().toISOString().split('T')[0],
      });
      setShowAddForm(false);
      setEditingItem(null);
      fetchRecurring();
    } catch (e) {
      console.error(e);
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Delete this recurring transaction?')) return;
    await fetch(`/api/recurring?id=${id}`, { method: 'DELETE' });
    fetchRecurring();
  };

  const editItem = (item: any) => {
    setEditingItem(item);
    setForm({
      type: item.type || 'spend',
      category: item.category || 'daily',
      method: item.method || 'card',
      account_id: item.account_id ? String(item.account_id) : '',
      merchant: item.merchant || '',
      original_currency: item.original_currency || 'USD',
      original_amount: String(item.original_amount || ''),
      note: item.note || '',
      frequency: item.frequency || 'monthly',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      next_occurrence: item.next_occurrence || '',
    });
    setShowAddForm(true);
  };

  const CURRENCIES = [
    { value: 'USD', label: '$ USD' },
    { value: 'DA', label: 'DA' },
    { value: 'EUR', label: '€ EUR' },
  ];

  const frequencyLabels: Record<string, string> = {
    daily: 'Daily', weekly: 'Weekly', biweekly: 'Bi-weekly',
    monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Recurring transactions</div>
          <div style={{ font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>Auto-generate transactions from templates</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={generateNow} disabled={generating} style={{ height: 32, padding: '0 14px', background: '#4ade80', color: '#06251f', border: 'none', borderRadius: 4, font: '600 12px Space Grotesk, sans-serif', cursor: 'pointer', opacity: generating ? 0.6 : 1 }}>
            {generating ? 'Generating...' : 'Generate now'}
          </button>
          <button onClick={() => { setShowAddForm(v => !v); setEditingItem(null); setForm({ type: 'spend', category: 'daily', method: 'card', account_id: form.account_id, merchant: '', original_currency: 'USD', original_amount: '', note: '', frequency: 'monthly', start_date: new Date().toISOString().split('T')[0], end_date: '', next_occurrence: new Date().toISOString().split('T')[0] }); }} style={{ height: 32, padding: '0 14px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, font: '600 12px Space Grotesk, sans-serif', cursor: 'pointer' }}>
            + Add
          </button>
        </div>
      </div>

      {showAddForm && (
        <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ font: '600 13px Space Grotesk, sans-serif' }}>{editingItem ? 'Edit recurring transaction' : 'New recurring transaction'}</div>

          <div style={{ display: 'flex', gap: 4, padding: 3, background: '#1e242c', borderRadius: 4 }}>
            {[['spend', 'Spend'], ['income', 'Income']].map(([id, label]) => (
              <button key={id} onClick={() => setForm({ ...form, type: id })} style={{
                flex: 1, padding: '6px 4px', border: 'none', borderRadius: 4, cursor: 'pointer',
                font: '600 11px Space Grotesk, sans-serif', background: form.type === id ? '#12151a' : 'transparent',
                color: form.type === id ? '#e6edf3' : '#7d8794'
              }}>{label}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'start' }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Merchant *</div>
              <input value={form.merchant} onChange={e => setForm({ ...form, merchant: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
            </div>
            <div style={{ minWidth: 0, maxWidth: 160 }}>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Amount *</div>
              <div style={{ display: 'flex', gap: 4 }}>
                <input type="number" value={form.original_amount} onChange={e => setForm({ ...form, original_amount: e.target.value })} style={{ flex: 1, height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none', minWidth: 0 }} />
                <select value={form.original_currency} onChange={e => setForm({ ...form, original_currency: e.target.value })} style={{ width: 58, height: 34, padding: '0 4px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '600 10px IBM Plex Mono, monospace', outline: 'none' }}>
                  {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Account *</div>
            <select value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })} style={{ width: '100%', height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }}>
              <option value="">Select account</option>
              {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Category</div>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }}>
                {Object.keys(COLORS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Frequency</div>
              <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} style={{ width: '100%', height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }}>
                {Object.entries(frequencyLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Next occurrence</div>
              <input type="date" value={form.next_occurrence} onChange={e => setForm({ ...form, next_occurrence: e.target.value })} style={{ width: '100%', height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Start date</div>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={{ width: '100%', height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>End date (optional)</div>
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={{ width: '100%', height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
            </div>
          </div>

          <div>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Note</div>
            <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowAddForm(false); setEditingItem(null); }} style={{ height: 32, padding: '0 14px', background: 'transparent', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
            <button onClick={submit} disabled={saving} style={{ height: 32, padding: '0 16px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, font: '600 12px Space Grotesk, sans-serif', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{editingItem ? 'Update' : 'Save'}</button>
          </div>
        </div>
      )}

      <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ font: '600 12.5px Space Grotesk, sans-serif' }}>Active recurring items</span>
          <span style={{ font: '400 10.5px IBM Plex Mono, monospace', color: '#7d8794' }}>{recurring.length} items</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#7d8794' }}>Loading...</div>
        ) : recurring.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#7d8794' }}>
            <div style={{ marginBottom: 8 }}>No recurring transactions yet</div>
            <div style={{ fontSize: 11 }}>Create one to auto-generate transactions each month</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px 90px 100px 80px', gap: 14, padding: '11px 16px', borderBottom: '1px solid #1e242c', background: '#1a1f27', font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            <span>Frequency</span><span>Merchant</span><span>Category</span><span>Amount</span><span>Next occurrence</span><span style={{ textAlign: 'end' }}>Actions</span>
          </div>
        )}

        {recurring.map((item: any) => (
          <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px 90px 100px 80px', gap: 14, padding: '12px 16px', borderBottom: '1px solid #1e242c', alignItems: 'center' }}>
            <span style={{ font: '400 11px IBM Plex Mono, monospace', color: '#7d8794' }}>{item.frequency}</span>
            <span style={{ font: '500 12.5px Space Grotesk, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.merchant}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: COLORS[item.category] || '#2dd4bf', display: 'inline-block' }}></span>
              {item.category}
            </span>
            <span style={{ font: '400 12px IBM Plex Mono, monospace', color: '#e6edf3' }}>{item.original_amount} {item.original_currency}</span>
            <span style={{ font: '400 11px IBM Plex Mono, monospace', color: '#7d8794' }}>{item.next_occurrence}</span>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'end' }}>
              <button onClick={() => editItem(item)} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#2dd4bf' }}>Edit</button>
              <button onClick={() => deleteItem(item.id)} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#fb7185' }}>Del</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
