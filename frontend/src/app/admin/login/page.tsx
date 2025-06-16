'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LoginResponse {
    success: boolean;
    message: string;
    token?: string;
    user?: {
        id: number;
        email: string;
        name: string;
        role: string;
        permissions: string[];
    };
}

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDemoCredentials, setShowDemoCredentials] = useState(false);
    const router = useRouter();

    const verifyExistingToken = useCallback(async () => {
        try {
            // You could add a token verification endpoint here
            // For now, just redirect if token exists
            router.push('/admin/dashboard');
        } catch {
            // Token is invalid, clear it
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
        }
    }, [router]);

    useEffect(() => {
        // Set dark background for login page
        document.body.style.backgroundColor = '#0f0f0f';
        document.body.style.backgroundImage = `
      radial-gradient(circle at 25% 25%, #2a1810 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, #1a1a1a 0%, transparent 50%)
    `;

        // Check if user is already logged in
        const existingToken = localStorage.getItem('adminToken');
        if (existingToken) {
            // Verify token is still valid
            verifyExistingToken();
        }

        return () => {
            document.body.style.backgroundColor = '';
            document.body.style.backgroundImage = '';
        };
    }, [verifyExistingToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/Auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data: LoginResponse = await response.json();

            if (response.ok && data.success) {
                // Parse JWT token to verify role (as in your original code)
                const userToken = data.token!;

                try {
                    const base64Url = userToken.split('.')[1];
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

                    const hasAdminAccess = roles && (roles.includes('Admin') || roles.includes('Manager'));

                    if (hasAdminAccess) {
                        // Store authentication data
                        localStorage.setItem('adminToken', userToken);
                        localStorage.setItem('adminUser', JSON.stringify(data.user));

                        // Show success message briefly before redirect
                        setError('');

                        // Redirect to admin dashboard
                        router.push('/admin/dashboard/AdminDashboard');
                    } else {
                        setError('Access denied. Administrator privileges required.');
                    }
                } catch (tokenError) {
                    console.error('Token parsing error:', tokenError);
                    setError('Authentication error. Please try again.');
                }
            } else {
                setError(data.message || 'Invalid login credentials');
            }
        } catch (networkError) {
            console.error('Login error:', networkError);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const fillDemoCredentials = (type: 'admin' | 'manager') => {
        if (type === 'admin') {
            setEmail('admin@chocolatestore.com');
            setPassword('admin123');
        } else {
            setEmail('manager@chocolatestore.com');
            setPassword('manager123');
        }
        setShowDemoCredentials(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-gradient-to-br from-[#2a211c]/95 to-[#1a1510]/95 p-8 rounded-xl shadow-2xl backdrop-blur-sm border border-[#3a312c]/30">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mb-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#c89b6a] to-[#b48a5a] rounded-full">
                            <span className="text-2xl font-bold text-white">🍫</span>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-[#f3d5a5] mb-2">Admin Portal</h2>
                    <p className="text-[#d4b896] text-sm">Chocolate Store Management System</p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
                        <div className="flex items-center">
                            <span className="text-red-400 mr-2">⚠️</span>
                            {error}
                        </div>
                    </div>
                )}

                {/* Demo Credentials */}
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                        className="text-[#f8c15c] hover:text-[#f3d5a5] text-sm underline mb-2"
                    >
                        Show Demo Credentials
                    </button>

                    {showDemoCredentials && (
                        <div className="bg-[#1a1510]/50 p-3 rounded-lg border border-[#3a312c]/50 text-sm">
                            <p className="text-[#d4b896] mb-2">Demo accounts:</p>
                            <div className="space-y-2">
                                <button
                                    onClick={() => fillDemoCredentials('admin')}
                                    className="block w-full text-left px-2 py-1 rounded bg-[#2a211c]/50 text-[#f8c15c] hover:bg-[#3a312c]/50"
                                >
                                    👑 Admin: admin@chocolatestore.com / admin123
                                </button>
                                <button
                                    onClick={() => fillDemoCredentials('manager')}
                                    className="block w-full text-left px-2 py-1 rounded bg-[#2a211c]/50 text-[#f8c15c] hover:bg-[#3a312c]/50"
                                >
                                    🏪 Manager: manager@chocolatestore.com / manager123
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[#f3d5a5] mb-2 font-medium" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-[#3a312c]/80 border border-[#5a4a40] rounded-lg text-white placeholder-[#9a8a80] focus:outline-none focus:ring-2 focus:ring-[#c89b6a] focus:border-transparent transition duration-200"
                            required
                            placeholder="Enter your email"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-[#f3d5a5] mb-2 font-medium" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[#3a312c]/80 border border-[#5a4a40] rounded-lg text-white placeholder-[#9a8a80] focus:outline-none focus:ring-2 focus:ring-[#c89b6a] focus:border-transparent transition duration-200"
                            required
                            placeholder="Enter your password"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-gradient-to-r from-[#c89b6a] to-[#b48a5a] hover:from-[#b48a5a] hover:to-[#a57a4a] text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-[1.02] shadow-lg ${loading ? 'opacity-70 cursor-not-allowed transform-none' : ''
                            }`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Signing In...
                            </div>
                        ) : (
                            'Sign In to Admin Panel'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="text-[#f8c15c] hover:text-[#f3d5a5] transition duration-200 inline-flex items-center"
                    >
                        <span className="mr-1">←</span>
                        Return to Store
                    </Link>
                </div>
            </div>
        </div>
    );
}