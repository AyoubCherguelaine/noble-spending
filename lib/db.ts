import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { getRuntimeEnv } from './jwt-secret';

const configuredDataDir = getRuntimeEnv('NOBLE_DATA_DIR');
const localDataDir = path.join(process.cwd(), 'data');
const temporaryDataDir = path.join('/tmp', 'noble-data');

function getWritableDataDir(): string {
  const candidates = configuredDataDir
    ? [configuredDataDir, temporaryDataDir]
    : getRuntimeEnv('NETLIFY') === 'true'
      ? [temporaryDataDir, localDataDir]
      : [localDataDir, temporaryDataDir];

  for (const candidate of [...new Set(candidates)]) {
    try {
      fs.mkdirSync(candidate, { recursive: true });
      fs.accessSync(candidate, fs.constants.W_OK);
      return candidate;
    } catch {
      // Try the next location; Netlify's deployed filesystem may be read-only.
    }
  }

  throw new Error('No writable data directory is available');
}

const dataDir = getWritableDataDir();
const DB_PATH = path.join(dataDir, 'db.sqlite');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
