import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value || null;
}

export async function getUserFromToken(): Promise<TokenPayload | null> {
  try {
    const token = await getTokenFromCookies();
    if (!token) return null;

    const decoded = jwt.verify(
      token,
      process.env.JWT_PUBLIC_KEY || 'your-secret-key',
      { algorithms: ['RS256'] }
    ) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function isAuthenticated(user: TokenPayload | null): boolean {
  return user !== null;
}

export function hasRole(user: TokenPayload | null, roles: string[]): boolean {
  return user !== null && roles.includes(user.role);
}

// For use inside Next.js route handlers (takes NextRequest)
export function getUserFromRequest(request: NextRequest): TokenPayload | null {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;
    return jwt.verify(
      token,
      process.env.JWT_PUBLIC_KEY || 'your-secret-key',
      { algorithms: ['RS256'] }
    ) as TokenPayload;
  } catch {
    return null;
  }
}

export const EC_ROLES = ['EC_OFFICER', 'PRESIDENT', 'SECRETARY', 'SYSTEM_ADMIN'];
export const PRESIDENT_ROLES = ['PRESIDENT', 'SYSTEM_ADMIN'];
