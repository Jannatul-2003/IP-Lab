import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export const EC_ROLES = ['EC_OFFICER', 'PRESIDENT', 'SECRETARY', 'FACULTY_ADVISOR', 'SYSTEM_ADMIN'];
export const ADMIN_ROLES = ['SYSTEM_ADMIN', 'FACULTY_ADVISOR'];

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function getUserFromRequest(request: NextRequest): DecodedToken | null {
  try {
    // Try to get token from Authorization header first (Bearer token)
    const authHeader = request.headers.get('authorization');
    let token = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fallback to cookie
      token = request.cookies.get('auth_token')?.value;
    }

    if (!token) return null;

    const decoded = jwt.verify(
      token,
      process.env.JWT_PUBLIC_KEY || 'your-secret-key',
      { algorithms: ['RS256'] }
    ) as DecodedToken;

    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function generateAccessToken(userId: string, email: string, role: string): string {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_PRIVATE_KEY || 'your-secret-key',
    { expiresIn: '24h', algorithm: 'RS256' }
  );
}

export function requireAuth(user: DecodedToken | null) {
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }
  return null;
}

export function requireRole(user: DecodedToken | null, roles: string[]) {
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }
  if (!roles.includes(user.role)) {
    return { error: 'Forbidden - Insufficient permissions', status: 403 };
  }
  return null;
}
