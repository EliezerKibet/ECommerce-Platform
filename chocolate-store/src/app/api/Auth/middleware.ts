import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'chocolate-store-secret-key-2024';

export interface AuthUser {
    userId: number;
    email: string;
    name: string;
    role: string;
    permissions: string[];
}

interface JWTPayload {
    userId: number;
    email: string;
    name: string;
    role: string;
    permissions: string[];
    iat: number;
    exp: number;
}

export function verifyToken(token: string): AuthUser | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return {
            userId: decoded.userId,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role,
            permissions: decoded.permissions || []
        };
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

export function extractTokenFromRequest(request: NextRequest): string | null {
    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Check cookies (if you're using cookie-based auth)
    const token = request.cookies.get('adminToken')?.value;
    if (token) {
        return token;
    }

    return null;
}

export function requireAuth(request: NextRequest): { user: AuthUser } | { error: string; status: number } {
    const token = extractTokenFromRequest(request);

    if (!token) {
        return { error: 'No token provided', status: 401 };
    }

    const user = verifyToken(token);
    if (!user) {
        return { error: 'Invalid or expired token', status: 401 };
    }

    return { user };
}

export function requireAdminRole(user: AuthUser): boolean {
    return user.role === 'Admin' || user.role === 'Manager';
}

export function requirePermission(user: AuthUser, permission: string): boolean {
    return user.permissions.includes(permission);
}