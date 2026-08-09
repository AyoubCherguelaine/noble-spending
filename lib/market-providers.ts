import type { MarketQuote, MarketPoint, MarketProvider } from '@/types';

interface ItemWithUnit { symbol: string; name: string; unit: string }
interface ItemWithoutUnit { symbol: string; name: string }

export const METALS_LIST: ItemWithUnit[] = [
  { symbol: 'GC=F', name: 'Gold', unit: 'troy oz' },
  { symbol: 'SI=F', name: 'Silver', unit: 'troy oz' },
  { symbol: 'PL=F', name: 'Platinum', unit: 'troy oz' },
  { symbol: 'PA=F', name: 'Palladium', unit: 'troy oz' },
  { symbol: 'HG=F', name: 'Copper', unit: 'lb' },
];

export const ENERGY_LIST: ItemWithUnit[] = [
  { symbol: 'BZ=F', name: 'Brent Crude', unit: 'bbl' },
  { symbol: 'CL=F', name: 'WTI Crude', unit: 'bbl' },
  { symbol: 'NG=F', name: 'Natural Gas', unit: 'MMBtu' },
];

export const INDEXES: ItemWithoutUnit[] = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^NDX', name: 'Nasdaq 100' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^FCHI', name: 'CAC 40' },
  { symbol: '^GDAXI', name: 'DAX' },
];

class YahooFinanceProvider implements MarketProvider {
  private base = 'https://query1.finance.yahoo.com/v8/finance/chart/';

  private classify(symbol: string): 'metal' | 'energy' | 'index' {
    if (METALS_LIST.some(m => m.symbol === symbol)) return 'metal';
    if (ENERGY_LIST.some(e => e.symbol === symbol)) return 'energy';
    return 'index';
  }

  async getQuotes(): Promise<MarketQuote[]> {
    const quotes: MarketQuote[] = [];
    const all = [...METALS_LIST, ...ENERGY_LIST, ...INDEXES];
    for (const item of all) {
      try {
        const url = `${this.base}${encodeURIComponent(item.symbol)}?interval=1d&range=5d`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 3600 } });
        if (!res.ok) continue;
        const data = await res.json();
        const result = data.chart?.result?.[0];
        if (!result) continue;
        const meta = result.meta;
        const price = meta.regularMarketPrice || meta.previousClose;
        if (!price) continue;
        const prevClose = meta.previousClose || price;
        const change = price - prevClose;
        const changePercent = prevClose ? (change / prevClose) * 100 : 0;
        const timestamp = result.timestamp?.[result.timestamp.length - 1];
        const asOf = timestamp ? new Date(timestamp * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
        quotes.push({
          symbol: item.symbol,
          name: item.name,
          category: this.classify(item.symbol),
          price,
          currency: meta.currency || 'USD',
          unit: 'unit' in item ? (item as ItemWithUnit).unit : undefined,
          change: isNaN(change) ? undefined : change,
          changePercent: isNaN(changePercent) ? undefined : changePercent,
          asOf,
          source: 'yahoo',
          delayed: true,
        });
      } catch {
        // skip
      }
    }
    return quotes;
  }

  async getHistory(symbol: string, _range: string): Promise<MarketPoint[]> {
    try {
      const url = `${this.base}${encodeURIComponent(symbol)}?interval=1d&range=1mo`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 86400 } });
      if (!res.ok) return [];
      const data = await res.json();
      const result = data.chart?.result?.[0];
      if (!result) return [];
      const timestamps = result.timestamp || [];
      const closes = result.indicators?.quote?.[0]?.close || [];
      const points: MarketPoint[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        const price = closes[i];
        if (price != null && !isNaN(price)) {
          points.push({ date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10), price });
        }
      }
      return points.slice(-90);
    } catch {
      return [];
    }
  }
}

export const marketProviders: MarketProvider[] = [new YahooFinanceProvider()];
