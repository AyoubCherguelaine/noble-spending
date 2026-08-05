'use client';

import { useMemo } from 'react';
import { convertToDisplay, formatMoney, getRates } from '@/lib/currency';

interface MoneyProps {
  amount: number;
  currency: string;
  displayCurrency?: string;
  settings?: Record<string, string>;
  signed?: boolean;
  style?: React.CSSProperties;
}

export default function Money({ amount, currency, displayCurrency = 'USD', settings = {}, signed = false, style }: MoneyProps) {
  const rates = useMemo(() => getRates(settings), [settings.rate_eur, settings.rate_da]);
  const displayAmount = useMemo(() => convertToDisplay(amount, currency, displayCurrency, rates), [amount, currency, displayCurrency, rates]);
  const formatted = useMemo(() => formatMoney(displayAmount, displayCurrency, signed), [displayAmount, displayCurrency, signed]);

  return <span style={style}>{formatted}</span>;
}
