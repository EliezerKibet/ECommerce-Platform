'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/services';
import { toast } from 'react-hot-toast';
import { parseCookies } from 'nookies';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Check if user is already logged in
    useEffect(() => {
        const cookies = parseCookies();
        if (cookies.token) {
            router.push('/');
        }
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (error) {
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            setError('First name and last name are required');
            return;
        }

        setLoading(true);

        try {
            // Your existing service expects this format
            const registrationData = {
                email: formData.email.trim(),
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim()
            };

            console.log('=== REGISTRATION DEBUG INFO ===');
            console.log('Form data being sent:', {
                email: registrationData.email,
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                passwordLength: registrationData.password?.length || 0,
                confirmPasswordLength: registrationData.confirmPassword?.length || 0,
                emailValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationData.email),
                passwordsMatch: registrationData.password === registrationData.confirmPassword,
                allFieldsPresent: !!(registrationData.email && registrationData.firstName && registrationData.lastName && registrationData.password && registrationData.confirmPassword)
            });
            console.log('=== END DEBUG INFO ===');

            await register(registrationData);
            toast.success('Registration successful! Please check your email to confirm your account.');
            router.push('/auth/login');
        } catch (error: unknown) {
            console.error('=== REGISTRATION ERROR ===');
            console.error('Full error object:', error);

            let errorMessage = 'Registration failed. Please try again.';

            // Type-safe error handling without any 'any' types
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as {
                    response?: {
                        data?: {
                            message?: string;
                            errors?: unknown;
                        };
                    };
                };

                if (axiosError.response?.data) {
                    const responseData = axiosError.response.data;

                    if (responseData.message) {
                        errorMessage = responseData.message;
                    } else if (responseData.errors) {
                        if (Array.isArray(responseData.errors)) {
                            errorMessage = responseData.errors.join(', ');
                        } else if (typeof responseData.errors === 'object' && responseData.errors !== null) {
                            const errorMessages = Object.values(responseData.errors).flat().map(String);
                            errorMessage = errorMessages.join(', ');
                        }
                    }
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-[#1a1713] via-[#2a211c] to-[#1a1713] py-12 px-4">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#c89b6a]/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#f8c15c]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#c89b6a]/5 rounded-full blur-3xl animate-pulse delay-500"></div>
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

                {/* Register Card */}
                <div className="bg-[#1a1713]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#c89b6a]/30 p-8 md:p-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center space-x-3 mb-6 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#f8c15c] to-[#c89b6a] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <span className="text-[#1a1713] font-bold text-2xl">🍫</span>
                            </div>
                            <span className="text-[#f3d5a5] font-bold text-3xl">ChocolateStore</span>
                        </Link>
                        <h1 className="text-4xl font-bold text-[#f3d5a5] mb-3 drop-shadow-lg">Join Our Family</h1>
                        <p className="text-[#c89b6a] text-lg">Create your account and start your chocolate journey</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/50 border border-red-700/50 rounded-xl backdrop-blur-sm">
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-300 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Register Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Fields Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* First Name Field */}
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-semibold text-[#c89b6a] mb-3">
                                    First Name
                                </label>
                                <div className="relative group">
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        autoComplete="given-name"
                                        className="w-full bg-[#2a211c]/90 border border-[#c89b6a]/30 rounded-xl px-4 py-4 pl-12 text-[#f3d5a5] placeholder-[#c89b6a]/70 focus:outline-none focus:ring-2 focus:ring-[#f8c15c] focus:border-transparent transition-all duration-300 group-hover:border-[#c89b6a]/50"
                                        placeholder="First name"
                                    />
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                        <svg className="w-5 h-5 text-[#c89b6a] group-focus-within:text-[#f8c15c] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Last Name Field */}
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-semibold text-[#c89b6a] mb-3">
                                    Last Name
                                </label>
                                <div className="relative group">
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                        autoComplete="family-name"
                                        className="w-full bg-[#2a211c]/90 border border-[#c89b6a]/30 rounded-xl px-4 py-4 pl-12 text-[#f3d5a5] placeholder-[#c89b6a]/70 focus:outline-none focus:ring-2 focus:ring-[#f8c15c] focus:border-transparent transition-all duration-300 group-hover:border-[#c89b6a]/50"
                                        placeholder="Last name"
                                    />
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                        <svg className="w-5 h-5 text-[#c89b6a] group-focus-within:text-[#f8c15c] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-[#c89b6a] mb-3">
                                Email Address
                            </label>
                            <div className="relative group">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
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
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    autoComplete="new-password"
                                    minLength={6}
                                    className="w-full bg-[#2a211c]/90 border border-[#c89b6a]/30 rounded-xl px-4 py-4 pl-12 pr-12 text-[#f3d5a5] placeholder-[#c89b6a]/70 focus:outline-none focus:ring-2 focus:ring-[#f8c15c] focus:border-transparent transition-all duration-300 group-hover:border-[#c89b6a]/50"
                                    placeholder="Create a password (min 6 characters)"
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

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#c89b6a] mb-3">
                                Confirm Password
                            </label>
                            <div className="relative group">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    autoComplete="new-password"
                                    minLength={6}
                                    className="w-full bg-[#2a211c]/90 border border-[#c89b6a]/30 rounded-xl px-4 py-4 pl-12 pr-12 text-[#f3d5a5] placeholder-[#c89b6a]/70 focus:outline-none focus:ring-2 focus:ring-[#f8c15c] focus:border-transparent transition-all duration-300 group-hover:border-[#c89b6a]/50"
                                    placeholder="Confirm your password"
                                />
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-5 h-5 text-[#c89b6a] group-focus-within:text-[#f8c15c] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#c89b6a] hover:text-[#f8c15c] transition-colors focus:outline-none"
                                >
                                    {showConfirmPassword ? (
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

                        {/* Password Strength Indicator */}
                        {formData.password && (
                            <div className="text-sm text-[#c89b6a]">
                                <div className="flex items-center space-x-2">
                                    <span>Password strength:</span>
                                    <div className="flex space-x-1">
                                        <div className={`w-2 h-2 rounded-full ${formData.password.length >= 6 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                                        <div className={`w-2 h-2 rounded-full ${formData.password.length >= 8 && /[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                                        <div className={`w-2 h-2 rounded-full ${formData.password.length >= 8 && /[0-9]/.test(formData.password) && /[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#c89b6a] to-[#f8c15c] text-[#1a1713] py-4 px-6 rounded-xl font-bold text-lg hover:from-[#f8c15c] hover:to-[#c89b6a] focus:outline-none focus:ring-2 focus:ring-[#f8c15c] focus:ring-offset-2 focus:ring-offset-[#1a1713] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center space-x-3">
                                    <div className="w-6 h-6 border-2 border-[#1a1713] border-t-transparent rounded-full animate-spin"></div>
                                    <span>Creating Account...</span>
                                </span>
                            ) : (
                                <span className="flex items-center justify-center space-x-2">
                                    <span>Create Account</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Sign In Link */}
                    <div className="mt-8 text-center">
                        <p className="text-[#c89b6a] text-lg">
                            Already part of our chocolate family?{' '}
                            <Link
                                href="/auth/login"
                                className="text-[#f8c15c] hover:text-[#f3d5a5] font-bold transition-colors hover:underline"
                            >
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}