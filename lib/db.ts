import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { getRuntimeEnv } from './jwt-secret';

const configuredDataDir = getRuntimeEnv('NOBLE_DATA_DIR');
const dataDir = configuredDataDir || (getRuntimeEnv('NETLIFY') === 'true'
  ? path.join('/tmp', 'noble-data')
  : path.join(process.cwd(), 'data'));
const DB_PATH = path.join(dataDir, 'db.sqlite');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
