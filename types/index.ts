export interface Category { key: string; name_en: string; name_ar: string; color: string; }
export interface Transaction {
  id: number; date: string; merchant: string; category: string; method: string;
  account_id?: number; original_currency: string; original_amount: number; converted_amount: number;
  type: 'income' | 'spend' | 'debtOut' | 'debtIn'; note?: string; created_at: string;
}
export interface Account {
  id: number; name: string; type: string; currency: string;
  details: string; icon: string; balance: number; created_at: string;
}
export interface Salary { id: number; company: string; role: string; gross: number; net: number; payday: string; type: string; month: number; year: number; }
export interface Service { id: number; name: string; description: string; terms: string; amount: number; status: string; next_invoice: string; month: number; year: number; }
export interface Subscription { id: number; name: string; plan: string; cost: number; next_billing: string; month: number; year: number; }
export interface Bill { id: number; name: string; cost: number; average: number; month: number; year: number; }
export interface Debt { id: number; person: string; type: string; total: number; remaining: number; due: string; note: string; month: number; year: number; }
export interface Budget { id: number; category_key: string; budget_amount: number; month: number; year: number; }
export interface PaymentMethod {
  id: number; name: string; type: string; details: string; icon: string;
  network?: string; last4?: string;
}
export interface Merchant {
  id: number; name: string; category?: string;
  osmId?: string; osmType?: string; address?: string; latitude?: number; longitude?: number;
}
export type Screen = 'overview' | 'income' | 'spending' | 'debts' | 'tx' | 'budget' | 'accounts';
export type Direction = 'terminal' | 'ledger' | 'canvas';
export type Language = 'en' | 'ar';
export type Currency = 'USD' | 'DA' | 'EUR';
export interface Settings { direction: Direction; language: Language; currency: Currency; month: number; }

export interface PurchaseCandidate {
  source: 'gmail' | 'ocr';
  externalId: string;
  merchant?: string;
  purchaseDate?: string;
  amount?: number;
  currency?: string;
  cardLast4?: string;
  matchedMethodId?: number;
  category?: string;
  note?: string;
  confidence: number;
  rawText?: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}

export interface MarketQuote {
  symbol: string;
  name: string;
  category: 'metal' | 'energy' | 'index';
  price: number;
  currency: string;
  unit?: string;
  change?: number;
  changePercent?: number;
  asOf: string;
  source: string;
  delayed: boolean;
}

export interface MarketPoint {
  date: string;
  price: number;
}

export interface MarketProvider {
  getQuotes(): Promise<MarketQuote[]>;
  getHistory(symbol: string, range: string): Promise<MarketPoint[]>;
}
