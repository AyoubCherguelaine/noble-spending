import { db } from '@/lib/db';
import { initSchema } from '@/lib/schema';

export async function GET() {
  try {
    initSchema();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    return new Response(JSON.stringify({ tables, count: tables.length }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { headers: { 'content-type': 'application/json' } });
  }
}
