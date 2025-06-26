import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AdminUser {
    id: number;
    email: string;
    name: string;
    role: string;
    permissions: string[];
}

interface UseAdminAuthReturn {
    user: AdminUser | null;
    loading: boolean;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
    isAdmin: boolean;
    isManager: boolean;
}

export function useAdminAuth(requireAuth = true): UseAdminAuthReturn {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const logout = useCallback(() => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setUser(null);
        router.push('/admin/login');
    }, [router]);

    const checkAuth = useCallback(async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const userData = localStorage.getItem('adminUser');

            if (!token || !userData) {
                if (requireAuth) {
                    router.push('/admin/login');
                }
                setLoading(false);
                return;
            }

            // Parse user data
            const parsedUser = JSON.parse(userData);

            // Verify token is still valid by parsing JWT
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );

            const payload = JSON.parse(jsonPayload);

            // Check if token is expired
            const currentTime = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < currentTime) {
                // Token expired
                logout();
                return;
            }

            // Verify user has admin privileges
            const roles = Array.isArray(payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'])
                ? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
                : [payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']];

            const hasAdminAccess = roles && (roles.includes('Admin') || roles.includes('Manager'));

            if (!hasAdminAccess) {
                logout();
                return;
            }

            setUser(parsedUser);
        } catch (error) {
            console.error('Auth check error:', error);
            if (requireAuth) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    }, [requireAuth, router, logout]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const hasPermission = (permission: string): boolean => {
        return user?.permissions.includes(permission) || false;
    };

    const isAdmin = user?.role === 'Admin';
    const isManager = user?.role === 'Manager' || isAdmin;

    return {
        user,
        loading,
        logout,
        hasPermission,
        isAdmin,
        isManager
    };
}