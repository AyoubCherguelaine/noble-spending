'use client';

import { useState, useEffect } from 'react';
import { convertToDisplay, formatMoney, getRates } from '@/lib/currency';

const CURRENCIES = [
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'DA', label: 'DA' },
];

export default function CurrencyExchange({ settings, onClose }: any) {
  const rates = getRates(settings || {});
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');

  const numAmount = parseFloat(amount || '0');
  const converted = convertToDisplay(numAmount, fromCurrency, toCurrency, rates);

  const rateLabel = () => {
    if (fromCurrency === toCurrency) return '1:1';
    if (fromCurrency === 'USD' && toCurrency === 'EUR') return `1 USD = ${(1 / rates.rate_eur).toFixed(4)} EUR`;
    if (fromCurrency === 'USD' && toCurrency === 'DA') return `1 USD = ${rates.rate_da.toFixed(2)} DA`;
    if (fromCurrency === 'EUR' && toCurrency === 'USD') return `1 EUR = ${rates.rate_eur.toFixed(4)} USD`;
    if (fromCurrency === 'EUR' && toCurrency === 'DA') return `1 EUR = ${rates.rate_eur_da.toFixed(2)} DA`;
    if (fromCurrency === 'DA' && toCurrency === 'USD') return `1 DA = ${(1 / rates.rate_da).toFixed(6)} USD`;
    if (fromCurrency === 'DA' && toCurrency === 'EUR') return `1 DA = ${(1 / rates.rate_eur_da).toFixed(4)} EUR`;
    return '';
  };

  const swap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(3,6,10,.62)', backdropFilter: 'blur(3px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', background: '#12151a', border: '1px solid #1e242c', borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,.5)', animation: 'fadeUp .16s ease-out' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #1e242c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ font: '600 13.5px Space Grotesk, sans-serif' }}>Currency exchange</span>
          <button onClick={onClose} style={{ width: 26, height: 26, border: '1px solid #1e242c', background: 'transparent', color: '#7d8794', borderRadius: 4, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>AMOUNT</div>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" placeholder="0.00" style={{ width: '100%', height: 38, padding: '0 11px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '600 14px IBM Plex Mono, monospace', outline: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>FROM</div>
              <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value)} style={{ width: '100%', height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }}>
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <button onClick={swap} style={{ marginTop: 18, width: 32, height: 32, border: '1px solid #1e242c', background: '#1e242c', color: '#e6edf3', borderRadius: 4, cursor: 'pointer', font: '16px' }}>⇄</button>
            <div>
              <div style={{ font: '500 9.5px IBM Plex Mono, monospace', color: '#7d8794', letterSpacing: '.07em', marginBottom: 6 }}>TO</div>
              <select value={toCurrency} onChange={e => setToCurrency(e.target.value)} style={{ width: '100%', height: 34, padding: '0 8px', background: '#0b0d10', border: '1px solid #1e242c', borderRadius: 4, color: '#e6edf3', font: '400 12px IBM Plex Mono, monospace', outline: 'none' }}>
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ padding: '12px 14px', background: '#1e242c', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: '400 11.5px Space Grotesk, sans-serif', color: '#7d8794' }}>Rate</span>
              <span style={{ font: '500 11px IBM Plex Mono, monospace', color: '#7d8794' }}>{rateLabel()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ font: '400 11.5px Space Grotesk, sans-serif', color: '#7d8794' }}>You receive</span>
              <span style={{ font: '600 18px IBM Plex Mono, monospace', color: '#4ade80' }}>{formatMoney(converted, toCurrency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
