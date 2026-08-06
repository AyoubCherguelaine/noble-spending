import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'test2.sqlite');
if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.exec('CREATE TABLE IF NOT EXISTS debug (id INTEGER PRIMARY KEY)');
db.exec("INSERT INTO debug (id) VALUES (1)");

export async function GET() {
  const rows = db.prepare('SELECT * FROM debug').all();
  const exists = fs.existsSync(DB_PATH);
  const size = exists ? fs.statSync(DB_PATH).size : 0;
  return new Response(JSON.stringify({ path: DB_PATH, exists, size, rows }), { headers: { 'content-type': 'application/json' } });
}
