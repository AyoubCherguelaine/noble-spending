import { jwtVerify } from 'jose';

const COOKIE_NAME = 'session';
const TOKEN_EXPIRY = '7d';
const SECRET_FILE = '.jwt-secret';

export function getRuntimeEnv(name: string): string {
  const runtimeEnv = (0, eval)('process.env')[name];
  return typeof runtimeEnv === 'string' ? runtimeEnv : '';
}

export function getSecretFromFile(): string {
  const envSecret = getRuntimeEnv('JWT_SECRET');
  if (envSecret.length > 0) {
    return envSecret;
  }
  const path = require('path');
  const fs = require('fs');
  const secretPath = path.join(process.cwd(), SECRET_FILE);
  try {
    const content = fs.readFileSync(secretPath, 'utf-8').trim();
    if (content.length === 64) return content;
  } catch {}
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const secret = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  try {
    fs.writeFileSync(secretPath, secret, { mode: 0o600 });
  } catch (e) {
    console.error('Failed to write JWT secret file:', e);
  }
  return secret;
}

export { COOKIE_NAME, TOKEN_EXPIRY };
