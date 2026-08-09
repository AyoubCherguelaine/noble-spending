import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';
import { marketProviders } from '@/lib/market-providers';
import type { MarketQuote } from '@/types';

export async function GET() {
  initSchema();
  try {
    const cached = db.prepare("SELECT payload FROM external_cache WHERE provider = 'markets' AND cache_key = 'quotes' AND expires_at > datetime('now') LIMIT 1").get() as { payload: string } | undefined;
    if (cached) {
      return NextResponse.json({ quotes: JSON.parse(cached.payload), stale: false });
    }
    const quotes: MarketQuote[] = [];
    for (const provider of marketProviders) {
      try {
        const q = await provider.getQuotes();
        quotes.push(...q);
        if (quotes.length > 0) break;
      } catch {
        // try next provider
      }
    }
    const payload = JSON.stringify(quotes);
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    db.prepare('INSERT OR REPLACE INTO external_cache (provider, cache_key, payload, fetched_at, expires_at) VALUES (?, ?, ?, ?, ?)').run('markets', 'quotes', payload, now.toISOString(), expires);
    return NextResponse.json({ quotes, stale: false });
  } catch (e) {
    const fallback = db.prepare("SELECT payload FROM external_cache WHERE provider = 'markets' AND cache_key = 'quotes' LIMIT 1").get() as { payload: string } | undefined;
    if (fallback) return NextResponse.json({ quotes: JSON.parse(fallback.payload), stale: true });
    return NextResponse.json({ quotes: [], stale: true }, { status: 503 });
  }
}

export async function POST() {
  initSchema();
  try {
    const quotes: MarketQuote[] = [];
    for (const provider of marketProviders) {
      try {
        const q = await provider.getQuotes();
        quotes.push(...q);
        if (quotes.length > 0) break;
      } catch {
        // continue
      }
    }
    if (quotes.length === 0) {
      return NextResponse.json({ quotes: [], stale: true }, { status: 503 });
    }
    const payload = JSON.stringify(quotes);
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    db.prepare('INSERT OR REPLACE INTO external_cache (provider, cache_key, payload, fetched_at, expires_at) VALUES (?, ?, ?, ?, ?)').run('markets', 'quotes', payload, now.toISOString(), expires);
    return NextResponse.json({ quotes, stale: false });
  } catch (e) {
    return NextResponse.json({ error: 'refresh failed' }, { status: 500 });
  }
}
