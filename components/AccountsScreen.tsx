'use client';

import { useState } from 'react';
import { convertToDisplay, formatMoney, getRates } from '@/lib/currency';
import Money from '@/components/Money';
import CurrencyExchange from './CurrencyExchange';
import AccountHistoryChart from './AccountHistoryChart';

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'web_payment', label: 'Web payment' },
  { value: 'cash', label: 'Cash' },
];

export default function AccountsScreen({ data, currency, refresh, _t }: any) {
  const settings = data?.settings || {};
  const rates = getRates(settings);
  const accounts = data?.accounts || [];
  const currencyTotals = data?.currencyTotals || {};

  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', type: 'bank', currency: 'USD', details: '', icon: '', openingBalance: '0' });
  const [transferForm, setTransferForm] = useState({ fromAccountId: '', toAccountId: '', amount: '', date: new Date().toISOString().split('T')[0], note: '' });

  const grouped: Record<string, any[]> = {};
  accounts.forEach((a: any) => {
    const cur = a.currency || 'USD';
    if (!grouped[cur]) grouped[cur] = [];
    grouped[cur].push(a);
  });

  const totalInDisplay = Object.values(currencyTotals || {}).reduce((sum: number, ct: any) => sum + (ct?.display || 0), 0);

  const openAdd = (currency = 'USD') => {
    setEditingAccount(null);
    setForm({ name: '', type: 'bank', currency, details: '', icon: '', openingBalance: '0' });
    setShowAdd(true);
  };

  const openEdit = (account: any) => {
    setEditingAccount(account);
    setForm({ name: account.name, type: account.type, currency: account.currency, details: account.details || '', icon: account.icon || '', openingBalance: String(account.balance || 0) });
    setShowAdd(true);
  };

  const saveAccount = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const url = '/api/accounts';
      const method = editingAccount ? 'PUT' : 'POST';
      const body = editingAccount
        ? { id: editingAccount.id, name: form.name, type: form.type, currency: form.currency, details: form.details, icon: form.icon, balance: parseFloat(form.openingBalance || '0') }
        : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to save');
        return;
      }
      setShowAdd(false);
      setEditingAccount(null);
      refresh();
    } catch (e) {
      setError('Failed to save');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async (id: number) => {
    if (!confirm('Delete this account?')) return;
    try {
      const res = await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to delete account');
        return;
      }
      refresh();
    } catch (e) {
      alert('Failed to delete account');
      console.error(e);
    }
  };

  const submitTransfer = async () => {
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount) return;
    setSaving(true);
    try {
      const res = await fetch('/api/accounts/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Transfer failed');
        return;
      }
      setShowTransfer(false);
      setTransferForm({ fromAccountId: '', toAccountId: '', amount: '', date: new Date().toISOString().split('T')[0], note: '' });
      refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const getPreviewConversion = () => {
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount) return null;
    const from = accounts.find((a: any) => a.id === Number(transferForm.fromAccountId));
    const to = accounts.find((a: any) => a.id === Number(transferForm.toAccountId));
    if (!from || !to) return null;
    const amount = parseFloat(transferForm.amount);
    if (from.currency === to.currency) return { converted: amount, rate: 1 };
    const converted = convertToDisplay(amount, from.currency, to.currency, rates);
    return { converted, rate: converted / amount };
  };

  const preview = getPreviewConversion();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Accounts</div>
          <div style={{ font: '400 11px Space Grotesk, sans-serif', color: '#7d8794', marginTop: 3 }}>
            Total balance: <Money amount={totalInDisplay} currency={currency} displayCurrency={currency} settings={settings} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowExchange(true)} style={{ height: 32, padding: '0 14px', background: '#1e242c', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, font: '500 12px Space Grotesk, sans-serif', cursor: 'pointer' }}>Exchange</button>
          <button onClick={() => setShowTransfer(true)} style={{ height: 32, padding: '0 14px', background: '#1e242c', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, font: '500 12px Space Grotesk, sans-serif', cursor: 'pointer' }}>Transfer</button>
          <button onClick={() => openAdd(currency)} style={{ height: 32, padding: '0 14px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, font: '600 12px Space Grotesk, sans-serif', cursor: 'pointer' }}>Add account</button>
        </div>
      </div>

      {['USD', 'EUR', 'DA'].map(cur => {
        const curAccounts = grouped[cur] || [];
        if (curAccounts.length === 0) return null;
        const curTotal = currencyTotals[cur]?.balance || 0;
        return (
          <div key={cur} style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ font: '600 12px IBM Plex Mono, monospace', color: '#2dd4bf' }}>{cur}</span>
                <span style={{ font: '400 10px IBM Plex Mono, monospace', color: '#7d8794' }}>{curAccounts.length} account{curAccounts.length > 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ font: '600 12px IBM Plex Mono, monospace', color: '#e6edf3' }}>{formatMoney(curTotal, cur)}</span>
                <button onClick={() => openAdd(cur)} style={{ width: 22, height: 22, border: '1px solid #1e242c', background: 'transparent', color: '#7d8794', borderRadius: 4, cursor: 'pointer', font: '14px' }}>+</button>
              </div>
            </div>
            {curAccounts.map((a: any) => (
              <div key={a.id} style={{ padding: '12px 16px', borderBottom: '1px solid #1e242c', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ font: '500 12.5px Space Grotesk, sans-serif' }}>{a.name}</span>
                    <span style={{ font: '400 9.5px IBM Plex Mono, monospace', color: '#7d8794', background: '#1e242c', padding: '2px 6px', borderRadius: 3 }}>{a.type}</span>
                  </div>
                  {a.details && <div style={{ font: '400 10.5px IBM Plex Mono, monospace', color: '#7d8794', marginTop: 3 }}>{a.details}</div>}
                </div>
                <div style={{ textAlign: 'end' }}>
                  <div style={{ font: '600 13px IBM Plex Mono, monospace', color: '#e6edf3' }}>{formatMoney(parseFloat(a.balance || 0), a.currency)}</div>
                  <div style={{ font: '400 10px IBM Plex Mono, monospace', color: '#7d8794' }}>in {a.currency}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEdit(a)} style={{ padding: '4px 8px', border: '1px solid #1e242c', background: 'transparent', color: '#7d8794', borderRadius: 4, cursor: 'pointer', font: '10px' }}>Edit</button>
                  <button onClick={() => deleteAccount(a.id)} style={{ padding: '4px 8px', border: '1px solid #1e242c', background: 'transparent', color: '#fb7185', borderRadius: 4, cursor: 'pointer', font: '10px' }}>Del</button>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {showAdd && (
        <div onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(3,6,10,.62)', backdropFilter: 'blur(3px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,.5)', animation: 'fadeUp .16s ease-out' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>{editingAccount ? 'Edit account' : 'Add account'}</span>
              <button onClick={() => setShowAdd(false)} style={{ width: 26, height: 26, border: '1px solid #1e242c', background: 'transparent', color: '#7d8794', borderRadius: 4, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {error && (
                <div style={{ padding: '8px 11px', background: '#3b1218', border: '1px solid #7f1d1d', borderRadius: 4, color: '#fca5a5', font: '11.5px Space Grotesk, sans-serif' }}>
                  {error}
                </div>
              )}
              <div>
                <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>NAME</div>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Bank of America, Cash…" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>TYPE</div>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }}>
                    {ACCOUNT_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>CURRENCY</div>
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} style={{ width: '100%', height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }}>
                    {[['USD', '$ USD'], ['EUR', '€ EUR'], ['DA', 'DA']].map(c => <option key={c[0]} value={c[0]}>{c[1]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>DETAILS</div>
                <input value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} placeholder="IBAN, last 4 digits, wallet address…" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
              </div>
              {!editingAccount && (
                <div>
                  <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>OPENING BALANCE</div>
                  <input value={form.openingBalance} onChange={e => setForm({ ...form, openingBalance: e.target.value })} type="number" step="0.01" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px IBM Plex Mono, monospace', outline: 'none' }} />
                </div>
              )}
              {editingAccount && (
                <div>
                  <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>CURRENT BALANCE</div>
                  <input value={form.openingBalance} onChange={e => setForm({ ...form, openingBalance: e.target.value })} type="number" step="0.01" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px IBM Plex Mono, monospace', outline: 'none' }} />
                </div>
              )}
            </div>
            <div style={{ padding: '14px 18px', borderTop: '1px solid #1e242c', display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
              <button onClick={() => setShowAdd(false)} disabled={saving} style={{ height: 32, padding: '0 14px', background: 'transparent', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, font: '500 12px Space Grotesk, sans-serif', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveAccount} disabled={saving || !form.name.trim()} style={{ height: 32, padding: '0 16px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, font: '600 12px Space Grotesk, sans-serif', cursor: 'pointer', opacity: saving || !form.name.trim() ? 0.6 : 1 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showExchange && <CurrencyExchange settings={settings} onClose={() => setShowExchange(false)} />}

      {data?.accountHistory && (
        <div>
          <AccountHistoryChart accountHistory={data.accountHistory} currency={currency} t={() => ''} title="Account balances over time" />
        </div>
      )}

      {showTransfer && (
        <div onClick={() => setShowTransfer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(3,6,10,.62)', backdropFilter: 'blur(3px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,.5)', animation: 'fadeUp .16s ease-out' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Transfer</span>
              <button onClick={() => setShowTransfer(false)} style={{ width: 26, height: 26, border: '1px solid #1e242c', background: 'transparent', color: '#7d8794', borderRadius: 4, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>FROM</div>
                <select value={transferForm.fromAccountId} onChange={e => setTransferForm({ ...transferForm, fromAccountId: e.target.value })} style={{ width: '100%', height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }}>
                  <option value="">Select account</option>
                  {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name} ({formatMoney(parseFloat(a.balance || 0), a.currency)})</option>)}
                </select>
              </div>
              <div>
                <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>TO</div>
                <select value={transferForm.toAccountId} onChange={e => setTransferForm({ ...transferForm, toAccountId: e.target.value })} style={{ width: '100%', height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }}>
                  <option value="">Select account</option>
                  {accounts.filter((a: any) => a.id !== Number(transferForm.fromAccountId)).map((a: any) => <option key={a.id} value={a.id}>{a.name} ({formatMoney(parseFloat(a.balance || 0), a.currency)})</option>)}
                </select>
              </div>
              <div>
                <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>AMOUNT</div>
                <input value={transferForm.amount} onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })} type="number" step="0.01" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
              </div>
              {preview && (
                <div style={{ padding: '10px 12px', background: '#1e242c', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ font: '400 11.5px Space Grotesk, sans-serif', color: '#7d8794' }}>You will receive</span>
                  <span style={{ font: '600 14px IBM Plex Mono, monospace', color: '#4ade80' }}>{formatMoney(preview.converted, accounts.find((a: any) => a.id === Number(transferForm.toAccountId))?.currency || 'USD')}</span>
                </div>
              )}
              <div>
                <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>DATE</div>
                <input type="date" value={transferForm.date} onChange={e => setTransferForm({ ...transferForm, date: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
              </div>
              <div>
                <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>NOTE</div>
                <input value={transferForm.note} onChange={e => setTransferForm({ ...transferForm, note: e.target.value })} placeholder="Optional note" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
              </div>
            </div>
            <div style={{ padding: '14px 18px', borderTop: '1px solid #1e242c', display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
              <button onClick={() => setShowTransfer(false)} disabled={saving} style={{ height: 32, padding: '0 14px', background: 'transparent', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, font: '500 12px Space Grotesk, sans-serif', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitTransfer} disabled={saving || !transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount} style={{ height: 32, padding: '0 16px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, font: '600 12px Space Grotesk, sans-serif', cursor: 'pointer', opacity: saving || !transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount ? 0.6 : 1 }}>Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
