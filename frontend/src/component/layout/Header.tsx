'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseCookies, destroyCookie } from 'nookies';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();

    const { token } = parseCookies();
    const isLoggedIn = !!token;

    const handleLogout = () => {
        destroyCookie(null, 'token');
        router.push('/');
        router.refresh();
    };

    return (
        <header className="bg-brown-800 text-white shadow-md">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <Link href="/" className="text-2xl font-bold">
                        Chocolate Haven
                    </Link>

                    <div className="hidden md:flex items-center space-x-6">
                        <Link href="/products" className="hover:text-brown-300 transition">
                            Products
                        </Link>
                        <Link href="/categories" className="hover:text-brown-300 transition">
                            Categories
                        </Link>
                        <Link href="/about" className="hover:text-brown-300 transition">
                            About
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Link href="/cart" className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </Link>

                        {isLoggedIn ? (
                            <div className="relative">
                                <button
                                    className="flex items-center space-x-1"
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                >
                                    <span>Account</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg py-2 z-10">
                                        <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100">
                                            My Profile
                                        </Link>
                                        <Link href="/orders" className="block px-4 py-2 hover:bg-gray-100">
                                            My Orders
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/auth/login" className="hover:text-brown-300 transition">
                                Login
                            </Link>
                        )}

                        <button
                            className="md:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="md:hidden mt-4 py-3 border-t border-brown-700">
                        <div className="flex flex-col space-y-3">
                            <Link href="/products" className="hover:text-brown-300 transition">
                                Products
                            </Link>
                            <Link href="/categories" className="hover:text-brown-300 transition">
                                Categories
                            </Link>
                            <Link href="/about" className="hover:text-brown-300 transition">
                                About
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}