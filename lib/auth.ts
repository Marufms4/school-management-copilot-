import { cookies } from 'next/headers';
import crypto from 'crypto';
import type { User } from '@/types';

// JWT_SECRET is resolved at call time so that the build step (which sets
// NODE_ENV=production but doesn't have env vars injected) does not fail.
// At actual request time the server process must have JWT_SECRET set.
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'JWT_SECRET environment variable is required in production. ' +
        'Set it to a random 32+ character string.'
      );
    }
    return 'educore-dev-secret-not-for-production';
  }
  return secret;
}

export function createToken(payload: User): string {
  const secret = getJwtSecret();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): (User & { iat: number; exp: number }) | null {
  try {
    const secret = getJwtSecret();
    const [header, body, signature] = token.split('.');
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as User & {
      iat: number;
      exp: number;
    };
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return {
    id: payload.id,
    tenantId: payload.tenantId,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  };
}
