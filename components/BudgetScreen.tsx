'use client';

import { useState } from 'react';

const COLORS: Record<string, string> = {
  housing: '#60a5fa', daily: '#34d399', online: '#f472b6', real: '#fbbf24',
  subs: '#a78bfa', transport: '#22d3ee', debt: '#fb7185', savings: '#4ade80',
};

export default function BudgetScreen({ data, currency, t, refresh, month, year }: any) {
  const { budgets, spendByCat, budgetsDisplay } = data;
  const [editingBudget, setEditingBudget] = useState<any>(null);

  return (
    <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ padding: '13px 16px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ font: '600 12.5px Space Grotesk, sans-serif' }}>Budget vs actual</span>
        <span style={{ font: '500 11px IBM Plex Mono, monospace', color: '#7d8794' }}>
          {(Object.values(spendByCat) as number[]).reduce((a, b) => a + b, 0).toFixed(2)} / {(budgets as any[]).reduce((a, b: any) => a + b.budget_amount, 0).toFixed(2)}
        </span>
      </div>
      {budgets.map((b: any) => {
        const actual = spendByCat[b.category_key] || 0;
        const over = actual > b.budget_amount;
        const bad = b.category_key === 'savings' ? actual < b.budget_amount : over;
        const displayBudget = (budgetsDisplay || []).find((d: any) => d.id === b.id);
        return (
          <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '190px 1fr 96px 96px 74px', gap: 14, padding: '14px 16px', borderBottom: '1px solid #1e242c', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[b.category_key] || '#94a3b8', display: 'inline-block' }}></span>
              <span style={{ font: '500 12.5px Space Grotesk, sans-serif' }}>{b.category_key}</span>
            </div>
            <div style={{ position: 'relative', height: 9, background: '#1e242c', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', insetInlineStart: 0, top: 0, height: '100%', width: `${Math.min(actual / Math.max(b.budget_amount, actual) * 100, 100)}%`, background: bad ? '#fb7185' : (COLORS[b.category_key] || '#4ade80'), borderRadius: 5 }}></div>
              <div style={{ position: 'absolute', top: -2, height: 13, width: 2, background: '#e6edf3', opacity: .5, insetInlineStart: `${(b.budget_amount / Math.max(b.budget_amount, actual) * 100)}%` }}></div>
            </div>
            <div style={{ textAlign: 'end', font: '600 12.5px IBM Plex Mono, monospace', color: bad ? '#fb7185' : '#4ade80' }}>{actual.toFixed(2)}</div>
            <div style={{ textAlign: 'end', font: '400 12px IBM Plex Mono, monospace', color: '#7d8794' }}>{displayBudget ? displayBudget.budget_amount_display.toFixed(2) : b.budget_amount.toFixed(2)}</div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'end' }}>
              <span style={{ textAlign: 'end', font: '500 11px IBM Plex Mono, monospace', color: bad ? '#fb7185' : '#4ade80' }}>
                {actual === b.budget_amount ? 'on target' : (over ? '+' : '−') + Math.abs(actual - b.budget_amount).toFixed(2)}
              </span>
              <button onClick={() => setEditingBudget(b)} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#2dd4bf' }}>Edit</button>
              <button onClick={async () => { if (confirm('Delete this budget?')) { await fetch(`/api/budgets?id=${b.id}`, { method: 'DELETE' }); refresh(); } }} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#fb7185' }}>Del</button>
            </div>
          </div>
        );
      })}
      {editingBudget && <EditBudgetModal budget={editingBudget} onClose={() => setEditingBudget(null)} onSaved={() => { setEditingBudget(null); refresh(); }} t={t} month={month} year={year} />}
    </div>
  );
}

function EditBudgetModal({ budget, onClose, onSaved, t, month, year }: any) {
  const [form, setForm] = useState({
    id: budget.id,
    category_key: budget.category_key || 'daily',
    budget_amount: budget.budget_amount || 0,
    month: budget.month || month || new Date().getMonth() + 1,
    year: budget.year || year || new Date().getFullYear(),
    currency: budget.currency || 'USD',
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await fetch(`/api/budgets?id=${budget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(3,6,10,.62)', backdropFilter: 'blur(3px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 380, maxWidth: '100%', background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,.5)', animation: 'fadeUp .16s ease-out' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Edit budget</span>
          <button onClick={onClose} style={{ width: 26, height: 26, border: '1px solid #1e242c', background: 'transparent', color: '#7d8794', borderRadius: 4, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Category</div>
              <select value={form.category_key} onChange={e => setForm({ ...form, category_key: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }}>
                {Object.keys(COLORS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Budget amount</div>
              <input value={form.budget_amount} onChange={e => setForm({ ...form, budget_amount: parseFloat(e.target.value) || 0 })} type="number" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Currency</div>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }}>
                <option value="USD">USD</option>
                <option value="DA">DA</option>
                <option value="EUR">EUR</option>
              </select>
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
