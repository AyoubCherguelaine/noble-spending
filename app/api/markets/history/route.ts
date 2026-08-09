import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';
import { marketProviders } from '@/lib/market-providers';

export async function GET(request: Request) {
  initSchema();
  const url = new URL(request.url);
  const symbol = url.searchParams.get('symbol') || 'XAU';
  const range = url.searchParams.get('range') || '1M';
  const cacheKey = `history_${symbol}_${range}`;

  try {
    const cached = db.prepare("SELECT payload FROM external_cache WHERE provider = 'markets' AND cache_key = ? AND expires_at > datetime('now') LIMIT 1").get(cacheKey) as { payload: string } | undefined;
    if (cached) {
      return NextResponse.json({ points: JSON.parse(cached.payload), stale: false });
    }
    const points: { date: string; price: number }[] = [];
    for (const provider of marketProviders) {
      try {
        const p = await provider.getHistory(symbol, range);
        points.push(...p);
        if (points.length > 0) break;
      } catch {
        // continue
      }
    }
    const payload = JSON.stringify(points);
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT OR REPLACE INTO external_cache (provider, cache_key, payload, fetched_at, expires_at) VALUES (?, ?, ?, ?, ?)').run('markets', cacheKey, payload, now.toISOString(), expires);
    return NextResponse.json({ points, stale: false });
  } catch (e) {
    const fallback = db.prepare("SELECT payload FROM external_cache WHERE provider = 'markets' AND cache_key = ? LIMIT 1").get(cacheKey) as { payload: string } | undefined;
    if (fallback) return NextResponse.json({ points: JSON.parse(fallback.payload), stale: true });
    return NextResponse.json({ points: [], stale: true }, { status: 503 });
  }
}
