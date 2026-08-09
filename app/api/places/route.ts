import { NextResponse } from 'next/server';
import { searchPlaces } from '@/lib/places';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });
  try {
    const results = await searchPlaces(q);
    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json({ error: 'places unavailable' }, { status: 503 });
  }
}
