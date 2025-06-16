// === UPDATED LOGIN PAGE (src/app/auth/login/page.tsx) ===
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setCookie, parseCookies } from 'nookies';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resendingConfirmation, setResendingConfirmation] = useState(false);

    // Check if user is already logged in
    useEffect(() => {
        const cookies = parseCookies();
        if (cookies.token) {
            router.push('/');
        }
    }, [router]);

    // Function to handle resending email confirmation
    const handleResendConfirmation = async () => {
        if (!email) {
            toast.error('Please enter your email address first.');
            return;
        }

        setResendingConfirmation(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/api/auth/resend-confirmation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                toast.success('Confirmation email sent! Please check your inbox.');
                setError('');
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to send confirmation email.');
            }
        } catch (error) {
            console.error('Resend confirmation error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setResendingConfirmation(false);
        }
    };

    

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('Attempting login with:', { email, passwordLength: password.length });

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                }),
            });

            console.log('Login response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Login successful:', { user: data.user, hasToken: !!data.token });

                // Store token in cookies with proper security settings
                setCookie(null, 'token', data.token, {
                    maxAge: 7 * 24 * 60 * 60, // 7 days (matches JWT expiry)
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                });

                // Store user data in localStorage for easy access
                if (typeof window !== 'undefined') {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }

                toast.success(`Welcome back, ${data.user.firstName}!`);

                // Redirect to home page
                router.push('/');
                router.refresh();
            } else {
                const errorData = await response.json();
                console.log('Login error response:', errorData);

                if (errorData.requiresEmailConfirmation) {
                    setError('Please confirm your email before logging in. Check your inbox for the confirmation link.');
                    toast.error('Email confirmation required. Please check your inbox.');
                } else {
                    setError(errorData.message || 'Invalid email or password');
                    toast.error('Login failed. Please check your credentials.');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Network error. Please check your connection and try again.');
            toast.error('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-[#1a1713] via-[#2a211c] to-[#1a1713]">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#c89b6a]/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#f8c15c]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 w-full max-w-lg mx-4">
                {/* Back to Home Button */}
                <div className="mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center space-x-2 text-[#c89b6a] hover:text-[#f8c15c] transition-colors group"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-medium">Back to Home</span>
                    </Link>
                </div>

                {/* Login Card */}
                <div className="bg-[#1a1713]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#c89b6a]/30 p-8 md:p-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center space-x-3 mb-6 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#f8c15c] to-[#c89b6a] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <span className="text-[#1a1713] font-bold text-2xl">🍫</span>
                            </div>
                            <span className="text-[#f3d5a5] font-bold text-3xl">ChocolateStore</span>
                        </Link>
                        <h1 className="text-4xl font-bold text-[#f3d5a5] mb-3 drop-shadow-lg">Welcome Back</h1>
                        <p className="text-[#c89b6a] text-lg">Sign in to continue your chocolate journey</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/50 border border-red-700/50 rounded-xl backdrop-blur-sm">
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-red-300 font-medium">{error}</p>
                                    {error.includes('confirm your email') && (
                                        <div className="mt-3">
                                            <button
                                                onClick={handleResendConfirmation}
                                                disabled={resendingConfirmation}
                                                className="text-sm text-red-200 hover:text-white underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {resendingConfirmation ? 'Sending...' : 'Resend confirmation email'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-[#c89b6a] mb-3">
                                Email Address
                            </label>
                            <div className="relative group">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    className="w-full bg-[#2a211c]/90 border border-[#c89b6a]/30 rounded-xl px-4 py-4 pl-12 text-[#f3d5a5] placeholder-[#c89b6a]/70 focus:outline-none focus:ring-2 focus:ring-[#f8c15c] focus:border-transparent transition-all duration-300 group-hover:border-[#c89b6a]/50"
                                    placeholder="Enter your email address"
                                />
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-5 h-5 text-[#c89b6a] group-focus-within:text-[#f8c15c] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-[#c89b6a] mb-3">
                                Password
                            </label>
                            <div className="relative group">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    className="w-full bg-[#2a211c]/90 border border-[#c89b6a]/30 rounded-xl px-4 py-4 pl-12 pr-12 text-[#f3d5a5] placeholder-[#c89b6a]/70 focus:outline-none focus:ring-2 focus:ring-[#f8c15c] focus:border-transparent transition-all duration-300 group-hover:border-[#c89b6a]/50"
                                    placeholder="Enter your password"
                                />
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-5 h-5 text-[#c89b6a] group-focus-within:text-[#f8c15c] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#c89b6a] hover:text-[#f8c15c] transition-colors focus:outline-none"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center group cursor-pointer">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-[#c89b6a]/30 bg-[#2a211c]/90 text-[#f8c15c] focus:ring-[#f8c15c] focus:ring-offset-0 focus:ring-offset-transparent"
                                />
                                <span className="ml-3 text-sm text-[#c89b6a] group-hover:text-[#f3d5a5] transition-colors">
                                    Remember me
                                </span>
                            </label>
                            <Link
                                href="/auth/forgot-password"
                                className="text-sm text-[#f8c15c] hover:text-[#f3d5a5] transition-colors font-medium"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#c89b6a] to-[#f8c15c] text-[#1a1713] py-4 px-6 rounded-xl font-bold text-lg hover:from-[#f8c15c] hover:to-[#c89b6a] focus:outline-none focus:ring-2 focus:ring-[#f8c15c] focus:ring-offset-2 focus:ring-offset-[#1a1713] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center space-x-3">
                                    <div className="w-6 h-6 border-2 border-[#1a1713] border-t-transparent rounded-full animate-spin"></div>
                                    <span>Signing In...</span>
                                </span>
                            ) : (
                                <span className="flex items-center justify-center space-x-2">
                                    <span>Sign In</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="mt-8 text-center">
                        <p className="text-[#c89b6a] text-lg">
                            New to our chocolate family?{' '}
                            <Link
                                href="/auth/register"
                                className="text-[#f8c15c] hover:text-[#f3d5a5] font-bold transition-colors hover:underline"
                            >
                                Create an account
                            </Link>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}