// src/app/admin/dashboard/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from './AdminDashboard';

// Global String.repeat patch to safely handle negative values
if (typeof window !== 'undefined') {
    const originalRepeat = String.prototype.repeat;
    String.prototype.repeat = function (count) {
        // Ensure count is non-negative
        if (count < 0) {
            console.error(`PREVENTED ERROR: String.repeat called with negative count: ${count}`);
            console.error(`String content: "${this.toString().substring(0, 50)}${this.toString().length > 50 ? '...' : ''}"`);
            console.error('Stack trace:', new Error().stack);
            return '';
        }
        return originalRepeat.call(this, count);
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Token verification function wrapped in useCallback
    const verifyToken = useCallback(async (token: string) => {
        try {
            // Simple token verification (expand as needed)
            if (token) {
                setIsAuthenticated(true);
            } else {
                router.push('/admin/login');
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('adminToken');
            router.push('/admin/login');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    // Authentication check effect
    useEffect(() => {
        const checkAuthentication = async () => {
            const token = localStorage.getItem('adminToken');

            if (!token) {
                router.push('/admin/login');
                setIsLoading(false);
                return;
            }

            await verifyToken(token);
        };

        checkAuthentication();
    }, [router, verifyToken]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex justify-center items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                    <div className="text-xl font-semibold text-white">Checking authentication...</div>
                </div>
            </div>
        );
    }

    // Authenticated state
    if (isAuthenticated) {
        return <AdminDashboard />;
    }

    // This return is only reached if there's a logic error
    return null;
}