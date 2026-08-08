'use client';

import { useState, useEffect } from 'react';

const CATEGORIES = [
  { key: 'income', label: 'Income', color: '#4ade80' },
  { key: 'housing', label: 'Housing & bills', color: '#60a5fa' },
  { key: 'daily', label: 'Daily / groceries', color: '#34d399' },
  { key: 'online', label: 'Online spending', color: '#f472b6' },
  { key: 'real', label: 'In-person spending', color: '#fbbf24' },
  { key: 'subs', label: 'Subscriptions', color: '#a78bfa' },
  { key: 'transport', label: 'Transport', color: '#22d3ee' },
  { key: 'debt', label: 'Debt payments', color: '#fb7185' },
  { key: 'savings', label: 'Savings', color: '#4ade80' },
];

const SMART_CATEGORIES: Record<string, string[]> = {
  salary: ['income'],
  payroll: ['income'],
  wage: ['income'],
  freelance: ['income'],
  'win gift': ['income'],
  bonus: ['income'],
  rent: ['housing'],
  electricity: ['housing'],
  internet: ['housing'],
  water: ['housing'],
  phone: ['housing'],
  carrefour: ['daily'],
  market: ['daily'],
  grocery: ['daily'],
  restaurant: ['real'],
  cafe: ['real'],
  hotel: ['real'],
  amazon: ['online'],
  aliexpress: ['online'],
  netflix: ['subs'],
  spotify: ['subs'],
  adobe: ['subs'],
  figma: ['subs'],
  gym: ['subs'],
  subscription: ['subs'],
  uber: ['transport'],
  yassir: ['transport'],
  taxi: ['transport'],
  fuel: ['transport'],
  loan: ['debt'],
  debt: ['debt'],
  repayment: ['debt'],
  savings: ['savings'],
};

const PAYMENT_TYPES = [
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank account' },
  { value: 'cash', label: 'Cash' },
  { value: 'web', label: 'Web payment' },
];

const CURRENCIES = [
  { value: 'USD', label: '$ USD' },
  { value: 'DA', label: 'DA' },
  { value: 'EUR', label: '€ EUR' },
];

function toIsoDate(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return new Date().toISOString().split('T')[0];
}

function getSmartSuggestions(merchant: string): string[] {
  const lower = merchant.toLowerCase();
  const suggestions = new Set<string>();
  for (const [keyword, cats] of Object.entries(SMART_CATEGORIES)) {
    if (lower.includes(keyword)) {
      cats.forEach(c => suggestions.add(c));
    }
  }
  return Array.from(suggestions);
}

export default function AddModal({ currency, onClose, onSaved, t }: any) {
  const [kind, setKind] = useState('spend');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('42.00');
  const [category, setCategory] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('');
  const [methodType, setMethodType] = useState('card');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [entryCurrency, setEntryCurrency] = useState(currency || 'USD');
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<{ merchants: string[]; methods: any[] }>({ merchants: [], methods: [] });
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then((rows: any[]) => {
      setAccounts(rows);
      if (rows.length > 0 && !accountId) {
        const match = rows.find((a: any) => a.currency === (currency || 'USD'));
        setAccountId(match ? String(match.id) : String(rows[0].id));
      }
    }).catch(() => {});
  }, [currency]);

  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then((rows: any[]) => setTemplates(rows)).catch(() => {});
  }, []);

  useEffect(() => {
    if (merchant.length > 0) {
      fetch(`/api/merchants?q=${encodeURIComponent(merchant)}`).then(r => r.json()).then((rows: any[]) => {
        setSuggestions(prev => ({ ...prev, merchants: rows.map((r: any) => r.name) }));
      }).catch(() => {});
    } else {
      fetch('/api/merchants').then(r => r.json()).then((rows: any[]) => {
        setSuggestions(prev => ({ ...prev, merchants: rows.map((r: any) => r.name) }));
      }).catch(() => {});
    }
  }, [merchant]);

  useEffect(() => {
    fetch('/api/methods').then(r => r.json()).then((rows: any[]) => {
      setSuggestions(prev => ({ ...prev, methods: rows }));
    }).catch(() => {});
  }, []);

  const selectedAccount = accounts.find((a: any) => String(a.id) === String(accountId));

  const isIncome = kind === 'income';
  const sign = isIncome ? '+' : '−';
  const preview = `${sign}${amount}`;
  const smartCats = getSmartSuggestions(merchant);

  const saveTemplate = async () => {
    if (!templateName.trim()) return;
    setSavingTemplate(true);
    try {
      const body: any = {
        name: templateName.trim(),
        type: isIncome ? 'income' : 'spend',
        category: isIncome ? 'income' : category,
        method: method || methodType,
        account_id: accountId,
        merchant: merchant.trim(),
        original_currency: selectedAccount?.currency || entryCurrency,
        original_amount: parseFloat(amount) || 0,
        note: '',
      };
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setTemplateName('');
      const res = await fetch('/api/templates');
      const rows = await res.json();
      setTemplates(rows);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingTemplate(false);
    }
  };

  const applyTemplate = (tmpl: any) => {
    setKind(tmpl.type === 'income' ? 'income' : 'spend');
    setMerchant(tmpl.merchant);
    setAmount(String(tmpl.original_amount));
    setCategory(tmpl.category);
    setMethod(tmpl.method || '');
    setMethodType(tmpl.method || 'card');
    if (tmpl.account_id) setAccountId(String(tmpl.account_id));
    if (tmpl.original_currency) setEntryCurrency(tmpl.original_currency);
    setShowTemplates(false);
  };

  const deleteTemplate = async (id: number) => {
    await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
    setTemplates(templates.filter(t => t.id !== id));
  };

  const submit = async () => {
    if (!merchant.trim()) return;
    if (!accountId) {
      alert('Please select an account for this transaction.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: toIsoDate(date),
          merchant: merchant.trim(),
          category: isIncome ? 'income' : category,
          method: method || `${methodType}`,
          account_id: Number(accountId),
          original_currency: selectedAccount?.currency || entryCurrency,
          original_amount: parseFloat(amount) * (isIncome ? 1 : -1),
          type: isIncome ? 'income' : 'spend',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to save');
        return;
      }
      await fetch('/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: merchant.trim(), category: isIncome ? 'income' : category }),
      }).catch(() => {});
      if (method && !suggestions.methods.find(m => m.name === method)) {
        await fetch('/api/methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: method, type: methodType }),
        }).catch(() => {});
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
          <span style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>{t('addTitle')}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => setShowTemplates(v => !v)} style={{ height: 26, padding: '0 10px', border: '1px solid #1e242c', background: showTemplates ? '#1e242c' : 'transparent', color: '#e6edf3', borderRadius: 4, cursor: 'pointer', font: '500 11px Space Grotesk, sans-serif' }}>Templates</button>
            <button onClick={onClose} style={{ width: 26, height: 26, border: '1px solid #1e242c', background: 'transparent', color: '#7d8794', borderRadius: 4, cursor: 'pointer' }}>✕</button>
          </div>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {showTemplates && (
            <div style={{ background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, padding: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em' }}>SAVED TEMPLATES</div>
              {templates.length === 0 && <div style={{ font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>No templates yet. Fill the form and save one below.</div>}
              {templates.map((tmpl: any) => (
                <div key={tmpl.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: '#12151a', border: '1px solid #1e242c', borderRadius: 4 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '500 11.5px Space Grotesk, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tmpl.name}</div>
                    <div style={{ font: '400 9.5px IBM Plex Mono, monospace', color: '#7d8794' }}>{tmpl.merchant} · {tmpl.category} · {tmpl.original_amount} {tmpl.original_currency}</div>
                  </div>
                  <button onClick={() => applyTemplate(tmpl)} style={{ padding: '2px 8px', border: '1px solid #2dd4bf', background: 'transparent', color: '#2dd4bf', borderRadius: 4, cursor: 'pointer', font: '500 10px IBM Plex Mono, monospace' }}>Use</button>
                  <button onClick={() => deleteTemplate(tmpl.id)} style={{ padding: '2px 8px', border: '1px solid #fb7185', background: 'transparent', color: '#fb7185', borderRadius: 4, cursor: 'pointer', font: '500 10px IBM Plex Mono, monospace' }}>×</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 4, padding: 3, background: '#1e242c', borderRadius: 4 }}>
            {[['spend', 'Spend'], ['income', 'Income']].map(([id, label]) => (
              <button key={id} onClick={() => setKind(id)} style={{
                flex: 1, padding: '6px 4px', border: 'none', borderRadius: 4, cursor: 'pointer',
                font: '600 11px Space Grotesk, sans-serif', background: kind === id ? '#12151a' : 'transparent',
                color: kind === id ? '#e6edf3' : '#7d8794'
              }}>{label}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'start' }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>{t('merchant')}</div>
              <input value={merchant} onChange={e => setMerchant(e.target.value)} list="merchant-list" placeholder="Carrefour, Netflix…" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
              <datalist id="merchant-list">
                {suggestions.merchants.map(m => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div style={{ minWidth: 0, maxWidth: 160 }}>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>{t('amount')}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                <input value={amount} onChange={e => setAmount(e.target.value)} style={{ flex: 1, height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px IBM Plex Mono, monospace', outline: 'none', minWidth: 0 }} />
                <select value={entryCurrency} onChange={e => setEntryCurrency(e.target.value)} style={{ width: 58, height: 34, padding: '0 4px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '600 10px IBM Plex Mono, monospace', outline: 'none' }}>
                  {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>ACCOUNT</div>
            <select value={accountId} onChange={e => setAccountId(e.target.value)} style={{ width: '100%', height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }}>
              <option value="">No account</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name} ({a.currency}) - {a.balance?.toFixed(2)}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>{t('cat')}</div>
            {smartCats.length > 0 && (
              <div style={{ marginBottom: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {smartCats.map(catKey => {
                  const cat = CATEGORIES.find(c => c.key === catKey);
                  if (!cat || category === catKey) return null;
                  return (
                    <button key={catKey} onClick={() => setCategory(catKey)} style={{
                      padding: '3px 8px', borderRadius: 4, cursor: 'pointer', font: '500 10px Space Grotesk, sans-serif',
                      border: `1px solid ${cat.color}`, background: `${cat.color}22`, color: '#e6edf3'
                    }}>{cat.label}</button>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES.filter(c => c.key !== 'income').map(c => (
                <button key={c.key} onClick={() => setCategory(c.key)} style={{
                  padding: '5px 10px', borderRadius: 4, cursor: 'pointer', font: '500 11px Space Grotesk, sans-serif',
                  border: '1px solid ' + (category === c.key ? c.color : '#1e242c'),
                  background: category === c.key ? c.color + '22' : 'transparent',
                  color: category === c.key ? '#e6edf3' : '#7d8794'
                }}>{c.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>{t('date')}</div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>{t('method')}</div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {PAYMENT_TYPES.map(pt => (
                  <button key={pt.value} onClick={() => setMethodType(pt.value)} style={{
                    flex: 1, padding: '4px 2px', border: '1px solid ' + (methodType === pt.value ? '#2dd4bf' : '#1e242c'),
                    borderRadius: 4, cursor: 'pointer', font: '600 9px IBM Plex Mono, monospace',
                    background: methodType === pt.value ? '#2dd4bf' : 'transparent', color: methodType === pt.value ? '#04231e' : '#7d8794'
                  }}>{pt.label}</button>
                ))}
              </div>
              <input value={method} onChange={e => setMethod(e.target.value)} list="method-list" placeholder="Card ·4471, IBAN…" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
              <datalist id="method-list">
                {suggestions.methods.map(m => (
                  <option key={m.id} value={m.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#1e242c', borderRadius: 4 }}>
            <span style={{ font: '400 11.5px Space Grotesk, sans-serif', color: '#7d8794' }}>{t('preview')}</span>
            <span style={{ font: '600 14px IBM Plex Mono, monospace', color: isIncome ? '#4ade80' : '#e6edf3' }}>{preview}</span>
          </div>

          <div style={{ borderTop: '1px solid #1e242c', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em' }}>SAVE AS TEMPLATE</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Template name (e.g. Weekly grocery)" style={{ flex: 1, height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
              <button onClick={saveTemplate} disabled={savingTemplate || !templateName.trim()} style={{ height: 32, padding: '0 14px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, font: '600 12px Space Grotesk, sans-serif', cursor: 'pointer', opacity: savingTemplate || !templateName.trim() ? 0.6 : 1 }}>Save</button>
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 18px', borderTop: '1px solid #1e242c', display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
          <button onClick={onClose} disabled={saving} style={{ height: 32, padding: '0 14px', background: 'transparent', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, font: '500 12px Space Grotesk, sans-serif', cursor: 'pointer' }}>{t('cancel')}</button>
          <button onClick={submit} disabled={saving || !merchant.trim()} style={{ height: 32, padding: '0 16px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, font: '600 12px Space Grotesk, sans-serif', cursor: 'pointer', opacity: saving || !merchant.trim() ? 0.6 : 1 }}>{t('save')}</button>
        </div>
      </div>
    </div>
  );
}
