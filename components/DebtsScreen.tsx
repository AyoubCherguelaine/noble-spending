'use client';

import { useState } from 'react';

export default function DebtsScreen({ data, t, refresh, month, year }: any) {
  const { debtsOwe, debtsOwed, totals } = data;
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [people, setPeople] = useState<any[]>([]);
  const [showPeople, setShowPeople] = useState(false);
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const [personForm, setPersonForm] = useState({ name: '', type: 'owe', note: '' });
  const [savingPerson, setSavingPerson] = useState(false);

  const bar = (pct: number, col: string) => ({ height: '100%', width: `${Math.min(pct, 100)}%`, background: col, borderRadius: 3 } as const);

  const loadPeople = async () => {
    try {
      const res = await fetch('/api/people');
      const rows = await res.json();
      setPeople(rows);
    } catch (e) {
      console.error(e);
    }
  };

  const submitPerson = async () => {
    if (!personForm.name.trim()) return;
    setSavingPerson(true);
    try {
      await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personForm),
      });
      setPersonForm({ name: '', type: 'owe', note: '' });
      setEditingPerson(null);
      loadPeople();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPerson(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => { setEditingDebt(null); setShowAddForm(!showAddForm); }} style={{ padding: '6px 12px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 10px IBM Plex Mono, monospace', background: 'transparent', color: '#2dd4bf' }}>+ ADD DEBT</button>
        <button onClick={() => { setShowPeople(!showPeople); if (!showPeople) loadPeople(); }} style={{ padding: '6px 12px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 10px IBM Plex Mono, monospace', background: 'transparent', color: '#2dd4bf' }}>PEOPLE</button>
      </div>

      {showAddForm && <AddDebtForm people={people} onClose={() => setShowAddForm(false)} onSaved={() => { setShowAddForm(false); refresh(); }} t={t} month={month} year={year} />}

      {showPeople && (
        <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: '600 12.5px Space Grotesk, sans-serif' }}>People</span>
            <button onClick={() => setEditingPerson({ id: null, name: '', type: 'owe', note: '' })} style={{ padding: '3px 8px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 10px IBM Plex Mono, monospace', background: 'transparent', color: '#2dd4bf' }}>+ ADD</button>
          </div>
          {editingPerson && (
            <div style={{ padding: 14, borderBottom: '1px solid #1e242c', background: '#1a1f27', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input value={personForm.name} onChange={e => setPersonForm({ ...personForm, name: e.target.value })} placeholder="Name" style={{ height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
                <select value={personForm.type} onChange={e => setPersonForm({ ...personForm, type: e.target.value })} style={{ height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }}>
                  <option value="owe">I owe</option>
                  <option value="owed">Owed to me</option>
                </select>
              </div>
              <input value={personForm.note} onChange={e => setPersonForm({ ...personForm, note: e.target.value })} placeholder="Note" style={{ height: 32, padding: '0 10px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setEditingPerson(null)} disabled={savingPerson} style={{ height: 30, padding: '0 12px', background: 'transparent', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                <button onClick={submitPerson} disabled={savingPerson || !personForm.name.trim()} style={{ height: 30, padding: '0 14px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: savingPerson || !personForm.name.trim() ? 0.6 : 1 }}>Save</button>
              </div>
            </div>
          )}
          {people.map((p: any) => (
            <div key={p.id} style={{ padding: '10px 16px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ font: '500 12.5px Space Grotesk, sans-serif' }}>{p.name}</div>
                <div style={{ font: '400 10.5px IBM Plex Mono, monospace', color: '#7d8794' }}>{p.type} · {p.note}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setEditingPerson(p)} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#2dd4bf' }}>Edit</button>
                <button onClick={async () => { if (confirm('Delete this person?')) { await fetch(`/api/people?id=${p.id}`, { method: 'DELETE' }); loadPeople(); } }} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#fb7185' }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, padding: '14px 15px' }}>
          <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.08em' }}>NET DEBT POSITION</div>
          <div style={{ marginTop: 7, font: '600 20px IBM Plex Mono, monospace', color: '#fb7185' }}>{`${(totals.debtOwedTot - totals.debtOweTot).toFixed(2)}`}</div>
          <div style={{ marginTop: 5, font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>owed to me minus what I owe</div>
        </div>
        <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, padding: '14px 15px' }}>
          <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.08em' }}>TOTAL I OWE</div>
          <div style={{ marginTop: 7, font: '600 20px IBM Plex Mono, monospace', color: '#fb7185' }}>{totals.debtOweTot.toFixed(2)}</div>
          <div style={{ marginTop: 5, font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>{debtsOwe.length} open debts</div>
        </div>
        <div style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, padding: '14px 15px' }}>
          <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.08em' }}>TOTAL OWED TO ME</div>
          <div style={{ marginTop: 7, font: '600 20px IBM Plex Mono, monospace', color: '#4ade80' }}>{totals.debtOwedTot.toFixed(2)}</div>
          <div style={{ marginTop: 5, font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>{debtsOwed.length} people</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { tag: 'OUT', title: t('owe'), color: '#fb7185', total: totals.debtOweTot, items: debtsOwe, tagStyle: { padding: '2px 7px', borderRadius: 4, background: '#fb718522', color: '#fb7185', font: '600 9.5px IBM Plex Mono,monospace' } },
          { tag: 'IN', title: t('owed'), color: '#4ade80', total: totals.debtOwedTot, items: debtsOwed, tagStyle: { padding: '2px 7px', borderRadius: 4, background: '#4ade8022', color: '#4ade80', font: '600 9.5px IBM Plex Mono,monospace' } },
        ].map((g, gi) => (
          <div key={gi} style={{ background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={g.tagStyle as any}>{g.tag}</span>
                <span style={{ font: '600 12.5px Space Grotesk, sans-serif' }}>{g.title}</span>
              </div>
              <span style={{ font: '600 12.5px IBM Plex Mono, monospace', color: g.color }}>{g.total.toFixed(2)}</span>
            </div>
            {g.items.map((d: any) => (
              <div key={d.id} style={{ padding: '13px 16px', borderBottom: '1px solid #1e242c' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <div>
                    <span style={{ font: '500 12.5px Space Grotesk, sans-serif' }}>{d.person}</span>
                    <span style={{ marginInlineStart: 8, font: '400 10.5px IBM Plex Mono, monospace', color: '#7d8794' }}>{d.date ? `${d.date} · ` : ''}{d.due || ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ font: '600 13px IBM Plex Mono, monospace', color: g.color }}>{d.remaining_display !== undefined ? d.remaining_display.toFixed(2) : d.remaining.toFixed(2)}</span>
                    <button onClick={() => setEditingDebt(d)} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#2dd4bf' }}>Edit</button>
                    <button onClick={async () => { if (confirm('Delete this debt?')) { await fetch(`/api/debts?id=${d.id}`, { method: 'DELETE' }); refresh(); } }} style={{ padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#fb7185' }}>Del</button>
                  </div>
                </div>
                <div style={{ marginTop: 4, font: '400 11px Space Grotesk, sans-serif', color: '#7d8794' }}>{d.note}</div>
                <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ flex: 1, height: 5, background: '#1e242c', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={bar((1 - d.remaining / d.total) * 100, g.color) as any}></div>
                  </div>
                  <span style={{ font: '400 10px IBM Plex Mono, monospace', color: '#7d8794' }}>{Math.round((1 - d.remaining / d.total) * 100)}% settled</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {editingDebt && <EditDebtModal debt={editingDebt} onClose={() => setEditingDebt(null)} onSaved={() => { setEditingDebt(null); refresh(); }} t={t} month={month} year={year} />}
    </div>
  );
}

function AddDebtForm({ onClose, onSaved, t, people, month, year }: any) {
  const [form, setForm] = useState({ person: '', type: 'owe', total: '', remaining: '', due: '', date: new Date().toISOString().split('T')[0], note: '', month: month || new Date().getMonth() + 1, year: year || new Date().getFullYear(), currency: 'USD' });
  const [saving, setSaving] = useState(false);
  const [useNewPerson, setUseNewPerson] = useState(false);

  const submit = async () => {
    if (!form.person.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, total: parseFloat(form.total) || 0, remaining: parseFloat(form.remaining) || 0 }),
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
      <div onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,.5)', animation: 'fadeUp .16s ease-out' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Add debt</span>
          <button onClick={onClose} style={{ width: 26, height: 26, border: '1px solid #1e242c', background: 'transparent', color: '#7d8794', borderRadius: 4, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Person / Entity</div>
              {useNewPerson ? (
                <input value={form.person} onChange={e => setForm({ ...form, person: e.target.value })} placeholder="New person name" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
              ) : (
                <select value={form.person} onChange={e => setForm({ ...form, person: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }}>
                  <option value="">Select person</option>
                  {people.map((p: any) => <option key={p.id} value={p.name}>{p.name} ({p.type})</option>)}
                </select>
              )}
              <button onClick={() => setUseNewPerson(!useNewPerson)} style={{ marginTop: 4, padding: '2px 6px', border: '1px solid #1e242c', borderRadius: 4, cursor: 'pointer', font: '500 9px IBM Plex Mono, monospace', background: 'transparent', color: '#2dd4bf' }}>
                {useNewPerson ? 'Use existing' : 'New person'}
              </button>
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Type</div>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }}>
                <option value="owe">I owe</option>
                <option value="owed">Owed to me</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Total</div>
              <div style={{ display: 'flex', gap: 4 }}>
                <input value={form.total} onChange={e => setForm({ ...form, total: e.target.value })} type="number" placeholder="0.00" style={{ flex: 1, height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
                <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} style={{ width: 64, height: 34, padding: '0 4px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '600 10px IBM Plex Mono, monospace', outline: 'none' }}>
                  <option value="USD">USD</option>
                  <option value="DA">DA</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Remaining</div>
              <input value={form.remaining} onChange={e => setForm({ ...form, remaining: e.target.value })} type="number" placeholder="0.00" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Currency</div>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }}>
                <option value="USD">USD</option>
                <option value="DA">DA</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Due</div>
            <input value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} placeholder="e.g. Aug 20" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
          </div>
          <div>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Date</div>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
          </div>
          <div>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Date</div>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
          </div>
          <div>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Note</div>
            <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Optional note" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px Space Grotesk, sans-serif', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} disabled={saving} style={{ height: 32, padding: '0 14px', background: 'transparent', border: '1px solid #1e242c', color: '#e6edf3', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
            <button onClick={submit} disabled={saving || !form.person.trim()} style={{ height: 32, padding: '0 16px', background: '#2dd4bf', color: '#06251f', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: saving || !form.person.trim() ? 0.6 : 1 }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditDebtModal({ debt, onClose, onSaved, t, month, year }: any) {
  const [form, setForm] = useState({
    id: debt.id,
    person: debt.person || '',
    type: debt.type || 'owe',
    total: debt.total || 0,
    remaining: debt.remaining || 0,
    due: debt.due || '',
    date: debt.date || '',
    note: debt.note || '',
    month: debt.month || month || new Date().getMonth() + 1,
    year: debt.year || year || new Date().getFullYear(),
    currency: debt.currency || 'USD',
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await fetch(`/api/debts?id=${debt.id}`, {
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
      <div onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,.5)', animation: 'fadeUp .16s ease-out' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Edit debt</span>
          <button onClick={onClose} style={{ width: 26, height: 26, border: '1px solid #1e242c', background: 'transparent', color: '#7d8794', borderRadius: 4, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Person / Entity</div>
              <input value={form.person} onChange={e => setForm({ ...form, person: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }} />
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Type</div>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }}>
                <option value="owe">I owe</option>
                <option value="owed">Owed to me</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Total</div>
              <input value={form.total} onChange={e => setForm({ ...form, total: parseFloat(e.target.value) || 0 })} type="number" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Remaining</div>
              <input value={form.remaining} onChange={e => setForm({ ...form, remaining: parseFloat(e.target.value) || 0 })} type="number" style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }} />
            </div>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>Currency</div>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} style={{ width: '100%', height: 34, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12.5px Space Grotesk, sans-serif', outline: 'none' }}>
                <option value="USD">USD</option>
                <option value="DA">DA</option>
                <option value="EUR">EUR</option>
              </select>
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
