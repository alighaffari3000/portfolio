import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionPayload {
  authenticated: boolean;
  exp: number; // Unix timestamp in seconds
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || (import.meta as any).env?.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is not defined');
  }
  return secret;
}

/**
 * Verifies provided credentials against env variables using bcrypt.
 */
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const rawUsername = process.env.ADMIN_USERNAME || (import.meta as any).env?.ADMIN_USERNAME;
  const rawPasswordHash = process.env.ADMIN_PASSWORD_HASH || (import.meta as any).env?.ADMIN_PASSWORD_HASH;

  if (!rawUsername || !rawPasswordHash) {
    return false;
  }

  const adminUsername = rawUsername.trim();
  const adminPasswordHash = rawPasswordHash.trim();

  if (username !== adminUsername) {
    return false;
  }


  try {
    return await bcrypt.compare(password, adminPasswordHash);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Signs payload using HMAC-SHA256 with constant-time verification.
 */
function signPayload(payloadStr: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
}

/**
 * Creates signed session token string: `base64(payload).signature`
 */
export function createSessionToken(): string {
  const secret = getSessionSecret();
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL;
  const payload: SessionPayload = { authenticated: true, exp };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signPayload(payloadStr, secret);
  return `${payloadStr}.${signature}`;
}

/**
 * Verifies session token with constant-time signature comparison and expiration check.
 */
export function verifySessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadStr, signature] = parts;
  const secret = getSessionSecret();
  const expectedSignature = signPayload(payloadStr, secret);

  const sigBuffer = Buffer.from(signature);
  const expectedSigBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedSigBuffer.length) {
    return false;
  }

  const isSignatureValid = crypto.timingSafeEqual(sigBuffer, expectedSigBuffer);
  if (!isSignatureValid) {
    return false;
  }

  try {
    const payloadJson = Buffer.from(payloadStr, 'base64url').toString('utf-8');
    const payload: SessionPayload = JSON.parse(payloadJson);

    if (!payload.authenticated || typeof payload.exp !== 'number') {
      return false;
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp > payload.exp) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export { SESSION_COOKIE_NAME, SESSION_TTL };
