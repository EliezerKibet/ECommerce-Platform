'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            // Skip auth check for login page
            if (pathname === '/admin/login') {
                setLoading(false);
                return;
            }

            const token = localStorage.getItem('adminToken');

            if (!token) {
                router.push('/admin/login');
                return;
            }

            try {
                // Parse the JWT token to check the role
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                    atob(base64)
                        .split('')
                        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                        .join('')
                );

                const payload = JSON.parse(jsonPayload);
                const roles = Array.isArray(payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'])
                    ? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
                    : [payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']];

                // Check if token has Admin role
                if (roles && roles.includes('Admin')) {
                    // User is authenticated as admin, allow access
                    setLoading(false);
                } else {
                    // Not an admin, redirect to login
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    router.push('/admin/login');
                }
            } catch (error) {
                console.error("Token validation error:", error);
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                router.push('/admin/login');
            }
        };

        checkAuth();
    }, [pathname, router]);

    // Set black background for all admin pages
    useEffect(() => {
        document.body.style.backgroundColor = '#000';
        return () => {
            document.body.style.backgroundColor = '';
        };
    }, []);

    if (loading && pathname !== '/admin/login') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-[#f3d5a5] text-xl">
                    <span className="mr-2">Loading</span>
                    <span className="animate-pulse">...</span>
                </div>
            </div>
        );
    }

    // For login page or when authenticated
    return (
        <div className="min-h-screen bg-black text-[#f3d5a5]">
            {children}
        </div>
    );
}