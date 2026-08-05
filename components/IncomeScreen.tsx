'use client';

import { useState, useEffect } from 'react';

export default function IncomeScreen({ data, currency, lang, t, refresh, month, year }: any) {
  const { salaries, services, transactions } = data;
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingSalary, setEditingSalary] = useState<any>(null);
  const [editingService, setEditingService] = useState<any>(null);
  const [editingSalaryTx, setEditingSalaryTx] = useState<any>(null);
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);

  useEffect(() => {
    const companies = salaries.map((s: any) => s.company).filter((c: any) => Boolean(c)) as string[];
    setCompanySuggestions(companies);
  }, [salaries]);

  const getLastSalaryForCompany = (companyName: string) => {
    const match = salaries.find((s: any) => s.company === companyName);
    return match || null;
  };

  const getTxForSalary = (salaryId: string) => {
    return transactions.find((tx: any) => tx.salary_id === salaryId) || null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ font: '600 12.5px Space Grotesk, sans-serif' }}>Salaries</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ font: '500 11px IBM Plex Mono, monospace', color: '#4ade80' }}>{data.totals.salaryTotal.toFixed(2)}</span>
            <button onClick={() => { setEditingSalary(null); setShowSalaryForm(!showSalaryForm); }} style={{ padding: '3px 8px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 10px IBM Plex Mono, monospace', background: 'transparent', color: '#2dd4bf' }}>+ ADD</button>
          </div>
        </div>
        {showSalaryForm && <SalaryForm salary={editingSalary} companies={companySuggestions} getLastSalaryForCompany={getLastSalaryForCompany} getTxForSalary={getTxForSalary} onClose={() => { setShowSalaryForm(false); setEditingSalary(null); }} onSaved={() => { setShowSalaryForm(false); setEditingSalary(null); refresh(); }} t={t} month={month} year={year} />}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 100px 100px 84px 80px', gap: 14, padding: '11px 16px', borderBottom: '1px solid #1e242c', background: '#1a1f27', font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          <span>Company</span><span>Role</span><span style={{ textAlign: 'end' }}>Gross</span><span style={{ textAlign: 'end' }}>Net</span><span style={{ textAlign: 'end' }}>Payday</span><span style={{ textAlign: 'end' }}>Actions</span>
        </div>
        {salaries.map((s: any) => (
          <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 100px 100px 84px 80px', gap: 14, padding: '11px 16px', borderBottom: '1px solid #1e242c', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <div style={{ width: 26, height: 26, borderRadius: 4, background: '#1e242c', color: '#7d8794', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 10px IBM Plex Mono, monospace' }}>
                {s.company.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ font: '500 12.5px Space Grotesk, sans-serif' }}>{s.company}</div>
                <div style={{ font: '400 10px IBM Plex Mono, monospace', color: '#7d8794' }}>{s.type}</div>
              </div>
            </div>
            <span style={{ font: '400 12px Space Grotesk, sans-serif', color: '#7d8794' }}>{s.role}</span>
            <span style={{ textAlign: 'end', font: '500 12.5px IBM Plex Mono, monospace', color: '#7d8794' }}>{s.gross.toFixed(2)} <span style={{ fontSize: 10, color: '#7d8794' }}>{s.currency || ''}</span></span>
            <span style={{ textAlign: 'end', font: '600 12.5px IBM Plex Mono, monospace', color: '#4ade80' }}>{s.net_display !== undefined ? s.net_display.toFixed(2) : s.net.toFixed(2)}</span>
            <span style={{ textAlign: 'end', font: '400 11.5px IBM Plex Mono, monospace', color: '#7d8794' }}>{s.payday}</span>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'end' }}>
              <button onClick={() => { setEditingSalary(s); setShowSalaryForm(true); }} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#2dd4bf' }}>Edit</button>
              {getTxForSalary(s.id) && <button onClick={() => setEditingSalaryTx(getTxForSalary(s.id))} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#fbbf24' }}>Tx</button>}
              <button onClick={async () => { if (confirm('Delete this salary?')) { await fetch(`/api/salaries?id=${s.id}`, { method: 'DELETE' }); refresh(); } }} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#fb7185' }}>Del</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ font: '600 12.5px Space Grotesk, sans-serif' }}>Services</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ font: '500 11px IBM Plex Mono, monospace', color: '#4ade80' }}>{data.totals.serviceTotal.toFixed(2)}</span>
            <button onClick={() => { setEditingService(null); setShowServiceForm(!showServiceForm); }} style={{ padding: '3px 8px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 10px IBM Plex Mono, monospace', background: 'transparent', color: '#2dd4bf' }}>+ ADD</button>
          </div>
        </div>
        {showServiceForm && <ServiceForm service={editingService} onClose={() => { setShowServiceForm(false); setEditingService(null); }} onSaved={() => { setShowServiceForm(false); setEditingService(null); refresh(); }} t={t} month={month} year={year} />}
        {services.map((s: any) => (
          <div key={s.id} style={{ padding: '13px 16px', borderBottom: '1px solid #1e242c', display: 'grid', gridTemplateColumns: '1fr 150px 120px 80px', gap: 14, alignItems: 'center' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ font: '600 12.5px Space Grotesk, sans-serif' }}>{s.name}</span>
                <span style={{ padding: '2px 7px', borderRadius: 99, font: '600 9.5px IBM Plex Mono, monospace', letterSpacing: '.03em', background: s.status === 'Active' ? 'rgba(45,212,191,0.13)' : s.status === 'Awaiting pay' ? 'rgba(251,113,133,0.13)' : '#1e242c', color: s.status === 'Active' ? '#2dd4bf' : s.status === 'Awaiting pay' ? '#fb7185' : '#7d8794' }}>{s.status}</span>
              </div>
              <div style={{ marginTop: 4, font: '400 11.5px Space Grotesk, sans-serif', color: '#7d8794', textWrap: 'pretty' }}>{s.description}</div>
            </div>
            <div>
              <div style={{ font: '400 10px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.06em' }}>Terms</div>
              <div style={{ marginTop: 3, font: '400 11.5px Space Grotesk, sans-serif' }}>{s.terms}</div>
            </div>
               <div style={{ textAlign: 'end' }}>
               <div style={{ font: '600 14px IBM Plex Mono, monospace', color: '#4ade80' }}>{s.amount_display !== undefined ? s.amount_display.toFixed(2) : s.amount.toFixed(2)}</div>
              <div style={{ marginTop: 3, font: '400 10.5px IBM Plex Mono, monospace', color: '#7d8794' }}>{s.next_invoice}</div>
            </div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'end' }}>
              <button onClick={() => { setEditingService(s); setShowServiceForm(true); }} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#2dd4bf' }}>Edit</button>
               <button onClick={async () => { if (confirm('Delete this service?')) { await fetch(`/api/services?id=${s.id}`, { method: 'DELETE' }); refresh(); } }} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#fb7185' }}>Del</button>
            </div>
          </div>
        ))}
      </div>
      {editingSalaryTx && <EditSalaryTxModal tx={editingSalaryTx} onClose={() => setEditingSalaryTx(null)} onSaved={() => { setEditingSalaryTx(null); refresh(); }} t={t} />}
    </div>
  );
}

function SalaryForm({ salary, companies, getLastSalaryForCompany, getTxForSalary, onClose, onSaved, t, month, year }: any) {
  const isEdit = !!salary?.id;
  const today = new Date().toISOString().split('T')[0];
  const linkedTx = getTxForSalary ? getTxForSalary(salary?.id) : null;
  const [form, setForm] = useState(() => {
    const initial = salary || {};
    return {
      company: initial.company || '',
      role: initial.role || '',
      gross: initial.gross ?? '',
      net: initial.net ?? '',
      payday: initial.payday || '',
      type: initial.type || '',
      date: initial.date || today,
      currency: initial.currency || 'USD',
      month: initial.month || month || new Date().getMonth() + 1,
      year: initial.year || year || new Date().getFullYear(),
      txDate: linkedTx?.date || today,
      txAmount: linkedTx?.original_amount ?? initial.net ?? '',
      txNote: linkedTx?.note || `Salary: ${initial.type || 'Full-time'}`,
    };
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit && form.company) {
      const last = getLastSalaryForCompany(form.company);
      if (last) {
        setForm(prev => ({
          ...prev,
          role: last.role || prev.role,
          gross: last.gross || prev.gross,
          net: last.net || prev.net,
          payday: last.payday || prev.payday,
          type: last.type || prev.type,
        }));
      }
    }
  }, [form.company]);

  const submit = async () => {
    setSaving(true);
    try {
      const url = isEdit ? `/api/salaries?id=${salary.id}` : '/api/salaries';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, gross: parseFloat(form.gross) || 0, net: parseFloat(form.net) }),
      });
      const savedSalary = await res.json();

      if (linkedTx || isEdit) {
        const txUrl = isEdit ? `/api/transactions` : '/api/transactions';
        const txMethod = isEdit ? 'PUT' : 'POST';
        const txBody = isEdit ? {
          id: linkedTx?.id,
          date: form.txDate,
          merchant: form.company,
          category: 'income',
          method: 'Salary',
          original_currency: form.currency,
          original_amount: parseFloat(form.txAmount) || parseFloat(form.net) || 0,
          type: 'income',
          note: form.txNote,
          salary_id: savedSalary.id,
        } : {
          date: form.txDate,
          merchant: form.company,
          category: 'income',
          method: 'Salary',
          original_currency: form.currency,
          original_amount: parseFloat(form.txAmount) || parseFloat(form.net) || 0,
          type: 'income',
          note: form.txNote,
          salary_id: savedSalary.id,
        };
        await fetch(txUrl, {
          method: txMethod,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(txBody),
        });
      }

      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 14, borderBottom: '1px solid #1e242c', background: '#1a1f27', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} list="company-list" placeholder="Company" style={{ height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
        <datalist id="company-list">
          {companies.map((c: string) => <option key={c} value={c} />)}
        </datalist>
        <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Role" style={{ height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <input value={form.gross} onChange={e => setForm({ ...form, gross: e.target.value })} placeholder="Gross" type="number" style={{ height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
        <input value={form.net} onChange={e => setForm({ ...form, net: e.target.value })} placeholder="Net" type="number" style={{ height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
        <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} style={{ height: 32, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '600 10px IBM Plex Mono, monospace', outline: 'none' }}>
          <option value="USD">USD</option>
          <option value="DA">DA</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <input value={form.payday} onChange={e => setForm({ ...form, payday: e.target.value })} placeholder="Payday" style={{ height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
        <input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="Type" style={{ height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
      </div>
      {isEdit && (
        <div style={{ padding: '10px 0 0', borderTop: '1px solid #1e242c', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em' }}>LINKED TRANSACTION</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Tx Date</div>
              <input type="date" value={form.txDate} onChange={e => setForm({ ...form, txDate: e.target.value })} style={{ width: '100%', height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Amount</div>
              <input type="number" value={form.txAmount} onChange={e => setForm({ ...form, txAmount: e.target.value })} style={{ width: '100%', height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
            </div>
          </div>
          <div>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Note</div>
            <input value={form.txNote} onChange={e => setForm({ ...form, txNote: e.target.value })} style={{ width: '100%', height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} disabled={saving} style={{ height: 30, padding: '0 12px', background: 'transparent', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
        <button onClick={submit} disabled={saving || !form.company || !form.net} style={{ height: 30, padding: '0 14px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: saving || !form.company || !form.net ? 0.6 : 1 }}>{isEdit ? 'Update' : 'Save'}</button>
      </div>
    </div>
  );
}

function ServiceForm({ service, onClose, onSaved, t, month, year }: any) {
  const isEdit = !!service?.id;
  const [form, setForm] = useState(service || { name: '', description: '', terms: '', amount: '', status: 'Active', next_invoice: '', month: month || new Date().getMonth() + 1, year: year || new Date().getFullYear(), currency: 'USD' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const url = isEdit ? `/api/services?id=${service.id}` : '/api/services';
      const method = isEdit ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) || 0 }),
      });
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 14, borderBottom: '1px solid #1e242c', background: '#1a1f27', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Service name" style={{ height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Amount</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} type="number" placeholder="0.00" style={{ flex: 1, height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
            <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} style={{ width: 64, height: 34, padding: '0 4px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '600 10px IBM Plex Mono, monospace', outline: 'none' }}>
              <option value="USD">USD</option>
              <option value="DA">DA</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
        <div>
          <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Status</div>
          <input value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} placeholder="Status" style={{ height: 34, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} placeholder="Terms" style={{ height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
        <input value={form.next_invoice} onChange={e => setForm({ ...form, next_invoice: e.target.value })} placeholder="Next invoice" style={{ height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
      </div>
      <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} style={{ padding: '8px 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none', resize: 'vertical' }} />
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} disabled={saving} style={{ height: 30, padding: '0 12px', background: 'transparent', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
        <button onClick={submit} disabled={saving || !form.name || !form.amount} style={{ height: 30, padding: '0 14px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: saving || !form.name || !form.amount ? 0.6 : 1 }}>{isEdit ? 'Update' : 'Save'}</button>
      </div>
    </div>
  );
}

function EditSalaryTxModal({ tx, onClose, onSaved, t }: any) {
  const [form, setForm] = useState({
    id: tx.id,
    date: tx.date || '',
    merchant: tx.merchant || '',
    category: tx.category || 'income',
    method: tx.method || 'Salary',
    original_currency: tx.original_currency || 'USD',
    original_amount: tx.original_amount || 0,
    type: tx.type || 'income',
    note: tx.note || '',
    salary_id: tx.salary_id || '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, original_amount: parseFloat(form.original_amount) || 0 }),
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
      <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,.5)', animation: 'fadeUp .16s ease-out' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Edit salary transaction</span>
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
              <input value={form.original_amount} onChange={e => setForm({ ...form, original_amount: e.target.value })} type="number" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px IBM Plex Mono, monospace', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Category</div>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }}>
                <option value="income">income</option>
                <option value="housing">housing</option>
                <option value="daily">daily</option>
                <option value="online">online</option>
                <option value="real">real</option>
                <option value="subs">subs</option>
                <option value="transport">transport</option>
                <option value="debt">debt</option>
                <option value="savings">savings</option>
              </select>
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Date</div>
              <input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
            </div>
          </div>
          <div>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Note</div>
            <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
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