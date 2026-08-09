export interface PlaceResult {
  osm_id: string;
  osm_type: string;
  display_name: string;
  address?: Record<string, string>;
  lat: string;
  lon: string;
}

export async function searchPlaces(query: string, country = 'dz'): Promise<PlaceResult[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', query);
  url.searchParams.set('countrycodes', country);
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '8');
  url.searchParams.set('accept-language', 'en,fr,ar');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'Noble/1.0 (mailto:ayoub@example.com)' },
    next: { revalidate: 2592000 },
  });
  if (!res.ok) throw new Error('Places search failed');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any[];
  return data.map((r) => ({
    osm_id: String(r.osm_id),
    osm_type: r.osm_type,
    display_name: r.display_name,
    address: r.address,
    lat: r.lat,
    lon: r.lon,
  }));
}

export function mapOSMToCategory(osmType?: string, address?: Record<string, string>): string {
  const tags = address || {};
  if (tags.shop === 'supermarket' || tags.shop === 'convenience') return 'daily';
  if (tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.amenity === 'fast_food') return 'real';
  if (tags.amenity === 'fuel') return 'transport';
  if (tags.shop === 'clothes' || tags.shop === 'shoes') return 'real';
  if (tags.shop === 'electronics') return 'online';
  return 'daily';
}
