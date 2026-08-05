export type Currency = 'USD' | 'DA' | 'EUR';

export interface Rates {
  rate_eur: number;
  rate_da: number;
  rate_eur_da: number;
}

export const CURRENCY_SYMBOLS: Record<Currency, { symbol: string; decimals: number }> = {
  USD: { symbol: '$', decimals: 2 },
  DA: { symbol: 'DA', decimals: 0 },
  EUR: { symbol: '€', decimals: 2 },
};

export function getRates(settings: Record<string, string>): Rates {
  return {
    rate_eur: parseFloat(settings.rate_eur || '1.14'),
    rate_da: parseFloat(settings.rate_da || '134.4'),
    rate_eur_da: parseFloat(settings.rate_eur_da || '146'),
  };
}

export function toUsd(amount: number, currency: string, rates: Rates): number {
  if (currency === 'USD' || !amount) return amount;
  if (currency === 'DA') return amount / rates.rate_da;
  if (currency === 'EUR') return amount * rates.rate_eur;
  return amount;
}

export function convertToDisplay(amount: number, fromCurrency: string, toCurrency: string, rates: Rates): number {
  if (fromCurrency === toCurrency || !amount) return amount;

  if (toCurrency === 'USD') {
    return toUsd(amount, fromCurrency, rates);
  }

  if (toCurrency === 'DA') {
    if (fromCurrency === 'EUR' && rates.rate_eur_da > 0) {
      return amount * rates.rate_eur_da;
    }
    const usd = toUsd(amount, fromCurrency, rates);
    return usd * rates.rate_da;
  }

  if (toCurrency === 'EUR') {
    if (fromCurrency === 'DA' && rates.rate_eur_da > 0) {
      return amount / rates.rate_eur_da;
    }
    const usd = toUsd(amount, fromCurrency, rates);
    return usd / rates.rate_eur;
  }

  return amount;
}

export function formatMoney(amount: number, currency: string, signed = false): string {
  const sym = CURRENCY_SYMBOLS[currency as Currency] || CURRENCY_SYMBOLS.USD;
  const n = Math.abs(amount);
  const s = n.toLocaleString('en-US', { minimumFractionDigits: sym.decimals, maximumFractionDigits: sym.decimals });
  const sign = signed ? (amount < 0 ? '−' : '+') : (amount < 0 ? '−' : '');
  if (currency === 'DA') return sign + s + ' DA';
  return sign + sym.symbol + ' ' + s;
}
