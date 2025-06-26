// === CORRECTED FORGOT PASSWORD PAGE (src/app/auth/forgot-password/page.tsx) ===
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState('');
    const [resendCount, setResendCount] = useState(0);
    const [canResend, setCanResend] = useState(true);
    const [countdown, setCountdown] = useState(0);
    const searchParams = useSearchParams();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // useEffect(() => {
    //     const cookies = parseCookies();
    //     if (cookies.token) {
    //         router.push('/');
    //     }
    // }, [router]);


    // Countdown timer for resend cooldown
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(countdown - 1);
            }, 1000);
        } else if (countdown === 0 && !canResend) {
            setCanResend(true);
        }
        return () => clearInterval(timer);
    }, [countdown, canResend]);

    useEffect(() => {
        // 1. Try to get email from query string
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
            return;
        }
        // 2. Try to get email from localStorage (if user is signed in)
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    if (user?.email) {
                        setEmail(user.email);
                    }
                } catch { }
            }
        }
    }, [searchParams]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('user');
            setIsAuthenticated(!!storedUser);
        }
    }, []);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFormError('');

        try {
            console.log('Sending forgot password request for:', email);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            console.log('Forgot password response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Forgot password response:', data);

                setSubmitted(true);
                setResendCount(resendCount + 1);
                toast.success('Password reset email sent! Please check your inbox.');

                // Set cooldown for resending (60 seconds)
                if (resendCount >= 0) {
                    setCanResend(false);
                    setCountdown(60);
                }
            } else {
                const errorData = await response.json();
                console.log('Forgot password error:', errorData);
                setFormError(errorData.message || 'Failed to send password reset email.');
                toast.error(errorData.message || 'Failed to send password reset email.');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            setFormError('Network error. Please check your connection and try again.');
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        if (canResend) {
            setSubmitted(false);
            setFormError('');
        }
    };

    const handleTryDifferentEmail = () => {
        setSubmitted(false);
        setFormError('');
        setEmail('');
        setResendCount(0);
        setCanResend(true);
        setCountdown(0);
    };

    // Success/Confirmation Screen
    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-[#1a1713] via-[#2a211c] to-[#1a1713]">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10 w-full max-w-lg mx-4">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center space-x-2 text-[#c89b6a] hover:text-[#f8c15c] transition-colors group"
                        >
                            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="font-medium">Back to Login</span>
                        </Link>
                    </div>

                    <div className="bg-[#1a1713]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#c89b6a]/30 p-8 md:p-10 text-center">
                        {/* Success Icon */}
                        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        {/* Success Message */}
                        <h1 className="text-4xl font-bold text-[#f3d5a5] mb-4">Check Your Email! 📧</h1>
                        <p className="text-[#c89b6a] mb-6 text-lg">
                            We&apos;ve sent a password reset link to:
                        </p>
                        <div className="bg-[#2a211c]/50 border border-[#c89b6a]/30 rounded-lg p-4 mb-6">
                            <p className="text-[#f8c15c] font-semibold text-lg break-all">{email}</p>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-4 mb-8">
                            <div className="flex items-start space-x-3 text-left">
                                <div className="w-6 h-6 bg-[#f8c15c] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-[#1a1713] text-sm font-bold">1</span>
                                </div>
                                <p className="text-[#c89b6a]">Check your email inbox and spam folder</p>
                            </div>
                            <div className="flex items-start space-x-3 text-left">
                                <div className="w-6 h-6 bg-[#f8c15c] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-[#1a1713] text-sm font-bold">2</span>
                                </div>
                                <p className="text-[#c89b6a]">Click the &ldquo;Reset Password&rdquo; link in the email</p>
                            </div>
                            <div className="flex items-start space-x-3 text-left">
                                <div className="w-6 h-6 bg-[#f8c15c] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-[#1a1713] text-sm font-bold">3</span>
                                </div>
                                <p className="text-[#c89b6a]">Create your new password</p>
                            </div>
                        </div>

                        {/* Important Notice */}
                        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 mb-6">
                            <div className="flex items-center space-x-2 mb-2">
                                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.854-.833-2.624 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="text-yellow-300 font-semibold">Important</span>
                            </div>
                            <p className="text-yellow-200 text-sm">
                                The reset link will expire in <strong>24 hours</strong> for security reasons.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-4">
                            <Link
                                href="/auth/login"
                                className="block bg-gradient-to-r from-[#c89b6a] to-[#f8c15c] text-[#1a1713] py-3 px-6 rounded-lg font-semibold hover:from-[#f8c15c] hover:to-[#c89b6a] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                Back to Login
                            </Link>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleResend}
                                    disabled={!canResend}
                                    className="flex-1 bg-[#2a211c]/50 border border-[#c89b6a]/30 text-[#c89b6a] py-3 px-4 rounded-lg font-medium hover:bg-[#c89b6a]/10 hover:text-[#f8c15c] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {!canResend ? `Resend in ${countdown}s` : 'Resend Email'}
                                </button>

                                <button
                                    onClick={handleTryDifferentEmail}
                                    className="flex-1 text-[#c89b6a] hover:text-[#f8c15c] py-3 px-4 rounded-lg font-medium transition-colors underline"
                                >
                                    Try Different Email
                                </button>
                            </div>
                        </div>

                        {/* Troubleshooting */}
                        <div className="mt-8 p-4 bg-gray-800/30 border border-gray-600/30 rounded-lg">
                            <details className="text-sm">
                                <summary className="text-gray-400 cursor-pointer hover:text-gray-300 font-medium">
                                    📧 Didn&apos;t receive the email?
                                </summary>
                                <div className="mt-3 space-y-2 text-gray-300 text-left">
                                    <p>• Check your spam/junk folder</p>
                                    <p>• Verify the email address is correct</p>
                                    <p>• Wait a few minutes for delivery</p>
                                    <p>• Add our domain to your safe senders list</p>
                                    <p>• Contact support if issues persist</p>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main Forgot Password Form
    return (
        <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-[#1a1713] via-[#2a211c] to-[#1a1713]">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#c89b6a]/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#f8c15c]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 w-full max-w-lg mx-4">
                {/* Back Button */}
                <div className="mb-6">
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center space-x-2 text-[#c89b6a] hover:text-[#f8c15c] transition-colors group"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-medium">Back to Login</span>
                    </Link>
                </div>

                {/* Main Card */}
                <div className="bg-[#1a1713]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#c89b6a]/30 p-8 md:p-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center space-x-3 mb-6 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#f8c15c] to-[#c89b6a] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <span className="text-[#1a1713] font-bold text-2xl">🍫</span>
                            </div>
                            <span className="text-[#f3d5a5] font-bold text-3xl">ChocolateStore</span>
                        </Link>

                        <div className="w-16 h-16 bg-gradient-to-br from-[#f8c15c] to-[#c89b6a] rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-[#1a1713]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-[#f3d5a5] mb-3 drop-shadow-lg">Forgot Password?</h1>
                        <p className="text-[#c89b6a] text-lg">No worries! Enter your email and we&apos;ll send you a reset link</p>
                    </div>


                    {/* Error Message */}
                    {formError && (
                        <div className="mb-6 p-4 bg-red-900/50 border border-red-700/50 rounded-xl backdrop-blur-sm">
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-300 font-medium">{formError}</p>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                            <p className="text-[#c89b6a]/70 text-sm mt-2">
                                We&apos;ll send a secure reset link to this email address
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#c89b6a] to-[#f8c15c] text-[#1a1713] py-4 px-6 rounded-xl font-bold text-lg hover:from-[#f8c15c] hover:to-[#c89b6a] focus:outline-none focus:ring-2 focus:ring-[#f8c15c] focus:ring-offset-2 focus:ring-offset-[#1a1713] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center space-x-3">
                                    <div className="w-6 h-6 border-2 border-[#1a1713] border-t-transparent rounded-full animate-spin"></div>
                                    <span>Sending Reset Link...</span>
                                </span>
                            ) : (
                                <span className="flex items-center justify-center space-x-2">
                                    <span>Send Reset Link</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Security Notice */}
                    <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-blue-300 font-semibold text-sm">Security Notice</span>
                        </div>
                        <p className="text-blue-200 text-sm">
                            For your security, the reset link will expire in 24 hours. We&apos;ll never ask for your password via email.
                        </p>
                    </div>

                    {/* Back to Login */}
                    {!isAuthenticated && (
                        <div className="mt-8 text-center">
                            <p className="text-[#c89b6a] text-lg">
                                Remember your password?{' '}
                                <Link
                                    href="/auth/login"
                                    className="text-[#f8c15c] hover:text-[#f3d5a5] font-bold transition-colors hover:underline"
                                >
                                    Sign in here
                                </Link>
                            </p>
                        </div>
                    )}

                    {/* Help Section */}
                    <div className="mt-8 p-4 bg-gray-800/30 border border-gray-600/30 rounded-lg">
                        <details className="text-sm">
                            <summary className="text-gray-400 cursor-pointer hover:text-gray-300 font-medium">
                                🤔 Need help with your account?
                            </summary>
                            <div className="mt-3 space-y-2 text-gray-300">
                                <p>If you&apos;re having trouble accessing your account:</p>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li>Make sure you&apos;re using the correct email address</li>
                                    <li>Check if your account was created with a different email</li>
                                    <li>Contact our support team for assistance</li>
                                </ul>
                                <div className="mt-3 pt-3 border-t border-gray-600">
                                    <Link
                                        href="/contact"
                                        className="text-[#f8c15c] hover:text-[#f3d5a5] transition-colors"
                                    >
                                        Contact Support →
                                    </Link>
                                </div>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    );
}