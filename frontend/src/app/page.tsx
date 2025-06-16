// app/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Admin shortcut
    useEffect(() => {
        let lastKeyTime = 0;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/') {
                const currentTime = new Date().getTime();
                if (currentTime - lastKeyTime < 500) {
                    router.push('/admin/login');
                }
                lastKeyTime = currentTime;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showUserMenu && !(event.target as Element).closest('.user-menu-container')) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUserMenu]);

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
        router.refresh();
    };

    return (
        <div className="w-full">
            {/* Hero Section */}
            <div className="relative w-full h-[70vh] bg-brown-800">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 text-white z-10">
                    {/* Welcome Message for Authenticated Users */}
                    {isAuthenticated && !isLoading && user && (
                        <div className="mb-6 p-4 bg-[#c89b6a]/20 border border-[#c89b6a]/40 rounded-xl backdrop-blur-sm">
                            <p className="text-[#f8c15c] text-lg font-medium">
                                Welcome back, {user.firstName}!
                            </p>
                            <p className="text-[#f3d5a5] text-sm">
                                Ready to explore our delicious chocolate collection?
                            </p>
                        </div>
                    )}

                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Experience Premium Chocolate
                    </h1>
                    <p className="text-xl max-w-2xl mb-8">
                        Handcrafted with the finest ingredients from around the world.
                        Discover your new favorite chocolate today.
                    </p>
                    <Link
                        href="/products"
                        className="bg-brown-500 hover:bg-brown-600 text-white font-bold py-3 px-8 rounded-full transition duration-300"
                    >
                        Shop Now
                    </Link>
                </div>
                <div className="absolute inset-0 opacity-50 bg-gradient-to-r from-brown-900 to-brown-800"></div>

                {/* User Authentication Section */}
                <div className="absolute top-4 right-4 z-20">
                    {isLoading ? (
                        <div className="bg-[#1a1713]/80 text-[#f3d5a5] py-2 px-4 rounded-md flex items-center">
                            <div className="w-4 h-4 border-2 border-[#c89b6a] border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span className="text-sm">Loading...</span>
                        </div>
                    ) : isAuthenticated && user ? (
                        <div className="relative user-menu-container">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-3 bg-[#1a1713]/80 hover:bg-[#1a1713] text-[#f3d5a5] py-2 px-4 rounded-md transition duration-300"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-[#c89b6a] to-[#f8c15c] rounded-full flex items-center justify-center">
                                    <span className="text-[#1a1713] font-bold text-sm">
                                        {user.firstName?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <span className="font-medium hidden sm:block">
                                    {user.firstName}
                                </span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* User Dropdown Menu */}
                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-[#2a211c] rounded-xl shadow-lg border border-[#c89b6a]/30 py-2 z-50">
                                    <div className="px-4 py-3 border-b border-[#c89b6a]/20">
                                        <p className="text-[#f3d5a5] font-medium text-sm truncate">
                                            {user.firstName} {user.lastName}
                                        </p>
                                        <p className="text-[#c89b6a] text-xs break-all leading-relaxed">
                                            {user.email}
                                        </p>
                                    </div>

                                    {/* Menu Items */}
                                    <Link
                                        href="/profile"
                                        className="flex items-center px-4 py-3 text-[#c89b6a] hover:text-[#f8c15c] hover:bg-[#c89b6a]/10 transition-colors text-sm"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        My Profile
                                    </Link>

                                    <Link
                                        href="/orders"
                                        className="flex items-center px-4 py-3 text-[#c89b6a] hover:text-[#f8c15c] hover:bg-[#c89b6a]/10 transition-colors text-sm"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        My Orders
                                    </Link>

                                    <Link
                                        href="/carts"
                                        className="flex items-center px-4 py-3 text-[#c89b6a] hover:text-[#f8c15c] hover:bg-[#c89b6a]/10 transition-colors text-sm"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0H17M9 19.5a1.5 1.5 0 003 0M20 19.5a1.5 1.5 0 003 0" />
                                        </svg>
                                        Shopping Cart
                                    </Link>

                                    <Link
                                        href="/addresses"
                                        className="flex items-center px-4 py-3 text-[#c89b6a] hover:text-[#f8c15c] hover:bg-[#c89b6a]/10 transition-colors text-sm"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        My Addresses
                                    </Link>

                                    <div className="border-t border-[#c89b6a]/20 mt-2 pt-2">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full text-left px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors text-sm"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href="/auth/login"
                            className="bg-[#1a1713]/80 hover:bg-[#1a1713] text-[#f3d5a5] py-2 px-4 rounded-md transition duration-300"
                        >
                            Account Login
                        </Link>
                    )}
                </div>
            </div>

            {/* Features Section */}
            <div className="py-16 bg-brown-50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="bg-brown-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-brown-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Premium Quality</h3>
                            <p className="text-gray-700 mb-4">
                                We use only the finest cocoa beans sourced from sustainable farms around the world.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="bg-brown-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-brown-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
                            <p className="text-gray-700 mb-4">
                                Your transactions are secure with our encrypted payment system.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="bg-brown-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-brown-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
                            <p className="text-gray-700 mb-4">
                                We ensure your chocolate arrives fresh and perfect with our temperature-controlled shipping.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Collections */}
            <div className="py-16 container mx-auto px-4">
                <h2 className="text-4xl font-bold mb-10 text-center text-[#f3d5a5] drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
                    Our Collections
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-[#1a1713]/90 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition duration-300">
                        <div className="h-60 relative">
                            <Image
                                src="/uploads/dark_espresso_collections.jpg"
                                alt="Dark Chocolate Collection"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw"
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-2 text-[#f3d5a5]">Dark Chocolate</h3>
                            <p className="text-white mb-4">Rich and intense flavors with high cocoa content.</p>
                            <Link
                                href="/products?category=dark%20chocolate"
                                className="inline-flex items-center text-[#f8c15c] font-semibold hover:text-[#f3d5a5] transition-colors"
                            >
                                Explore <span className="ml-1">→</span>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-[#1a1713]/90 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition duration-300">
                        <div className="h-60 relative">
                            <Image
                                src="/uploads/milk_classic_collections.jpg"
                                alt="Milk Chocolate Collection"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw"
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-2 text-[#f3d5a5]">Milk Chocolate</h3>
                            <p className="text-white mb-4">Smooth and creamy classics loved by everyone.</p>
                            <Link
                                href="/products?category=milk%20chocolate"
                                className="inline-flex items-center text-[#f8c15c] font-semibold hover:text-[#f3d5a5] transition-colors"
                            >
                                Explore <span className="ml-1">→</span>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-[#1a1713]/90 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition duration-300">
                        <div className="h-60 relative">
                            <Image
                                src="/uploads/truffle_collection_collections.jpg"
                                alt="Specialty Flavors Collection"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw"
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-2 text-[#f3d5a5]">Specialty Flavors</h3>
                            <p className="text-white mb-4">Unique combinations and artisanal creations.</p>
                            <Link
                                href="/products?category=chocolate%20gifts"
                                className="inline-flex items-center text-[#f8c15c] font-semibold hover:text-[#f3d5a5] transition-colors"
                            >
                                Explore <span className="ml-1">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div className="py-16 bg-brown-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-6">Our Chocolate Story</h2>
                        <p className="text-lg mb-8">
                            At Chocolate Haven, we believe in creating chocolate that tells a story. From bean to bar, we
                            carefully source the finest cacao beans and transform them into exceptional chocolate
                            creations. Our passion for quality and flavor is reflected in every piece we make.
                        </p>
                        <Link
                            href="/about"
                            className="inline-block border-2 border-brown-600 text-brown-600 hover:bg-brown-600 hover:text-white font-bold py-2 px-6 rounded-full transition duration-300"
                        >
                            Learn More
                        </Link>
                    </div>
                </div>
            </div>

            {/* Personalized Section for Authenticated Users */}
            {isAuthenticated && !isLoading && user && (
                <div className="py-16 bg-[#2a211c]/50">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto text-center">
                            <h2 className="text-3xl font-bold mb-6 text-[#f3d5a5]">Welcome back, {user.firstName}!</h2>
                            <p className="text-[#c89b6a] text-lg mb-8">
                                Based on your previous orders and preferences, we think you&apos;ll love these selections.
                            </p>
                            <div className="flex flex-col md:flex-row gap-6 justify-center max-w-2xl mx-auto">
                                <div className="bg-[#1a1713]/80 rounded-xl p-6 text-center flex-1 hover:bg-[#1a1713]/90 transition-all duration-300">
                                    <div className="text-4xl mb-4">🎁</div>
                                    <h3 className="text-xl font-bold text-[#f3d5a5] mb-2">Exclusive Offers</h3>
                                    <p className="text-[#c89b6a] mb-4">Special deals just for you</p>
                                    <Link
                                        href="/offers"
                                        className="text-[#f8c15c] hover:text-[#f3d5a5] font-semibold transition-colors"
                                    >
                                        View Offers →
                                    </Link>
                                </div>
                                <div className="bg-[#1a1713]/80 rounded-xl p-6 text-center flex-1 hover:bg-[#1a1713]/90 transition-all duration-300">
                                    <div className="text-4xl mb-4">📦</div>
                                    <h3 className="text-xl font-bold text-[#f3d5a5] mb-2">Your Orders</h3>
                                    <p className="text-[#c89b6a] mb-4">Track and manage your orders</p>
                                    <Link
                                        href="/orders"
                                        className="text-[#f8c15c] hover:text-[#f3d5a5] font-semibold transition-colors"
                                    >
                                        View Orders →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Account Section for Non-Authenticated Users */}
            {!isAuthenticated && !isLoading && (
                <div className="py-16 bg-[#1a1713]">
                    <div className="container mx-auto px-4">
                        <div className="max-w-lg mx-auto">
                            <div className="bg-[#2a211c]/80 p-8 rounded-lg text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#c89b6a] to-[#f8c15c] rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl">🍫</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-[#f3d5a5]">Join Our Chocolate Family</h3>
                                <p className="text-white mb-6">
                                    Create an account to track orders, save favorites, access exclusive offers, and get personalized recommendations for our premium chocolate products.
                                </p>
                                <div className="flex flex-col sm:flex-row justify-center gap-4">
                                    <Link
                                        href="/auth/login"
                                        className="bg-[#c89b6a] hover:bg-[#b48a5a] text-white font-bold py-3 px-6 rounded-md transition duration-300"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        className="bg-transparent border border-[#c89b6a] text-[#f3d5a5] hover:bg-[#c89b6a]/20 font-semibold py-3 px-6 rounded-md transition duration-300"
                                    >
                                        Create Account
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Newsletter Section */}
            <div className="py-16 bg-brown-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-lg mx-auto text-center">
                        <h3 className="text-2xl font-bold mb-4">Stay Sweet with Our Newsletter</h3>
                        <p className="text-gray-700 mb-6">
                            Get the latest updates on new products, exclusive offers, and chocolate tips delivered to your inbox.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-4 py-3 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500 focus:border-transparent"
                                defaultValue={isAuthenticated && user ? user.email : ''}
                            />
                            <button className="bg-brown-600 hover:bg-brown-700 text-white font-semibold py-3 px-6 rounded-md transition duration-300">
                                Subscribe
                            </button>
                        </div>
                        {isAuthenticated && user && (
                            <p className="text-sm text-gray-600 mt-2">
                                Using your account email: {user.email}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}