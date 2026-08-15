import { SignJWT, jwtVerify } from 'jose';
import { getSecretFromFile, getRuntimeEnv, COOKIE_NAME, TOKEN_EXPIRY } from './jwt-secret';
import { db } from './db';
import nodeCrypto from 'node:crypto';

function seedCredentials() {
  const existing = db.prepare("SELECT value FROM settings WHERE key = 'auth_username'").get() as { value: string } | undefined;
  if (!existing) {
    const defaultUsername = getRuntimeEnv('AUTH_USERNAME');
    const defaultPassword = getRuntimeEnv('AUTH_PASSWORD');
    if (!defaultUsername || !defaultPassword) return;
    const hash = hashPasswordSync(defaultPassword);
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('auth_username', defaultUsername);
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run('auth_password_hash', hash);
  }
}

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = nodeCrypto.getRandomValues(new Uint8Array(16));
    nodeCrypto.scrypt(password, salt, 64, (err: any, derivedKey: any) => {
      if (err) return reject(err);
      const buf = Buffer.concat([salt, Buffer.from(derivedKey)]);
      resolve(buf.toString('hex'));
    });
  });
}

function hashPasswordSync(password: string): string {
  const salt = nodeCrypto.getRandomValues(new Uint8Array(16));
  const key = nodeCrypto.scryptSync(password, salt, 64);
  return Buffer.concat([salt, key]).toString('hex');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const buf = Buffer.from(hash, 'hex');
    const salt = buf.subarray(0, 16);
    const storedKey = buf.subarray(16);
    return new Promise((resolve, reject) => {
      nodeCrypto.scrypt(password, salt, 64, (err: any, derivedKey: any) => {
        if (err) return reject(err);
        resolve(nodeCrypto.timingSafeEqual(storedKey, Buffer.from(derivedKey)));
      });
    });
  } catch {
    return false;
  }
}

export function getCredentials(): { username: string; passwordHash: string } | null {
  seedCredentials();
  const rows = db.prepare("SELECT key, value FROM settings WHERE key IN ('auth_username','auth_password_hash')").all() as { key: string; value: string }[];
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  if (!map.auth_username || !map.auth_password_hash) return null;
  return { username: map.auth_username, passwordHash: map.auth_password_hash };
}

export function hasUser(): boolean {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'auth_username'").get() as { value: string } | undefined;
    return !!row?.value;
  } catch {
    return false;
  }
}

export async function issueToken(username: string): Promise<string> {
  const secret = getSecretFromFile();
  const secretKey = new TextEncoder().encode(secret);
  const jwt = await new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secretKey);
  return jwt;
}

export async function verifyToken(token: string): Promise<{ username: string } | null> {
  try {
    const secret = getSecretFromFile();
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return { username: payload.username as string };
  } catch {
    return null;
  }
}

export { COOKIE_NAME, TOKEN_EXPIRY };
