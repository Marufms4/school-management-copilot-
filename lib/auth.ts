import { cookies } from 'next/headers';
import crypto from 'crypto';
import type { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'educore-secret-key-change-in-production';

export function createToken(payload: User): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): (User & { iat: number; exp: number }) | null {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
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
