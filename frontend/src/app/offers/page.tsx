'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Promotion {
    id: number;
    name: string;
    description: string;
    discountPercentage: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    products?: Array<{
        id: number;
        name: string;
        price: number;
        imageUrl?: string;
    }>;
}

interface Coupon {
    id: number;
    code: string;
    description: string;
    discountType: 'Percentage' | 'FixedAmount';
    discountAmount: number;
    minimumOrderAmount?: number;
    startDate: string;
    endDate: string;
    usageLimit?: number;
    usedCount: number;
    isActive: boolean;
}

export default function OffersPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

    useEffect(() => {
        fetchOffersData();
    }, []);

    const fetchOffersData = async () => {
        setLoading(true);
        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202';

            // Fetch promotions from admin endpoint
            const promotionsResponse = await fetch(`${API_BASE_URL}/api/Admin/promotions`);
            const promotionsData = await promotionsResponse.json();
            console.log('All Promotions from API:', promotionsData);

            // Handle different response formats and filter for ACTIVE only
            let promotionsArray = [];
            if (Array.isArray(promotionsData)) {
                promotionsArray = promotionsData;
            } else if (promotionsData && Array.isArray(promotionsData.$values)) {
                promotionsArray = promotionsData.$values;
            } else if (promotionsData && promotionsData.promotions && Array.isArray(promotionsData.promotions)) {
                promotionsArray = promotionsData.promotions;
            } else {
                promotionsArray = [];
            }

            // Filter to show ONLY ACTIVE promotions
            const activePromotions = promotionsArray.filter((promo: Promotion) =>
                promo.isActive === true
            );
            console.log('Active Promotions Only:', activePromotions);

            // Fetch coupons from admin endpoint  
            const couponsResponse = await fetch(`${API_BASE_URL}/api/Admin/coupons`);
            const couponsData = await couponsResponse.json();
            console.log('All Coupons from API:', couponsData);

            // Handle different response formats and filter for ACTIVE only
            let couponsArray = [];
            if (Array.isArray(couponsData)) {
                couponsArray = couponsData;
            } else if (couponsData && Array.isArray(couponsData.$values)) {
                couponsArray = couponsData.$values;
            } else if (couponsData && couponsData.coupons && Array.isArray(couponsData.coupons)) {
                couponsArray = couponsData.coupons;
            } else {
                couponsArray = [];
            }

            // Filter to show ONLY ACTIVE coupons
            const activeCoupons = couponsArray.filter((coupon: Coupon) =>
                coupon.isActive === true
            );
            console.log('Active Coupons Only:', activeCoupons);

            setPromotions(activePromotions);
            setCoupons(activeCoupons);

            // Log final counts for clarity
            console.log(`Displaying ${activePromotions.length} active promotions and ${activeCoupons.length} active coupons`);

        } catch (error) {
            console.error('Error fetching offers:', error);
            setPromotions([]);
            setCoupons([]);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (couponCode: string) => {
        try {
            await navigator.clipboard.writeText(couponCode);
            setCopiedCoupon(couponCode);
            setTimeout(() => setCopiedCoupon(null), 2000);
        } catch (error) {
            console.error('Failed to copy coupon code:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateDiscountedPrice = (originalPrice: number, discountPercentage: number) => {
        return originalPrice * (1 - discountPercentage / 100);
    };

    const isPromotionExpiringSoon = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && diffDays > 0;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#c89b6a] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            {/* Navigation */}
            <div className="fixed top-0 left-0 z-50 p-4">
                <Link
                    href="/"
                    className="flex items-center space-x-2 bg-[#1a1713]/80 hover:bg-[#1a1713] text-[#f3d5a5] py-2 px-4 rounded-md transition duration-300 backdrop-blur-sm"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Home</span>
                </Link>
            </div>

            <div className="container mx-auto px-4 pt-20">
                {/* Page Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-bold text-[#f3d5a5] drop-shadow-lg mb-4">
                        🎉 Special Offers & Deals
                    </h1>
                    <p className="text-xl text-[#c89b6a] max-w-2xl mx-auto">
                        Save big on your favorite chocolates with our exclusive promotions and discount coupons!
                    </p>
                </div>

                {/* How to Use Offers - Instructions Section */}
                <section className="mb-16">
                    <div className="bg-gradient-to-br from-[#2a211c]/80 to-[#1a1713]/90 rounded-2xl p-8 border border-[#c89b6a]/30">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-[#f3d5a5] mb-4">💡 How to Save Money</h2>
                            <p className="text-[#c89b6a] text-lg">Follow these simple steps to maximize your savings</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Step 1: Browse Promotions */}
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#f8c15c] to-[#c89b6a] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-[#1a1713]">1</span>
                                </div>
                                <h3 className="text-[#f8c15c] font-bold mb-2">🔥 Browse Promotions</h3>
                                <p className="text-[#c89b6a] text-sm">
                                    Check our <strong>Hot Promotions</strong> section above for percentage discounts on specific products.
                                    Click <em>&quot;Shop This Promotion&quot;</em> to see discounted items.
                                </p>
                            </div>

                            {/* Step 2: Copy Coupons */}
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#f8c15c] to-[#c89b6a] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-[#1a1713]">2</span>
                                </div>
                                <h3 className="text-[#f8c15c] font-bold mb-2">🎫 Copy Coupon Codes</h3>
                                <p className="text-[#c89b6a] text-sm">
                                    Click <strong>&quot;Copy Code&quot;</strong> on any coupon above. The code will be saved to your clipboard.
                                    Check minimum order requirements if any.
                                </p>
                            </div>

                            {/* Step 3: Shop & Add to Cart */}
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#f8c15c] to-[#c89b6a] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-[#1a1713]">3</span>
                                </div>
                                <h3 className="text-[#f8c15c] font-bold mb-2">🛒 Add Products to Cart</h3>
                                <p className="text-[#c89b6a] text-sm">
                                    Browse our products and add your favorites to cart.
                                    <strong>Promotion discounts</strong> apply automatically to eligible items.
                                </p>
                            </div>

                            {/* Step 4: Apply at Checkout */}
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#f8c15c] to-[#c89b6a] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-[#1a1713]">4</span>
                                </div>
                                <h3 className="text-[#f8c15c] font-bold mb-2">💳 Apply Coupon at Checkout</h3>
                                <p className="text-[#c89b6a] text-sm">
                                    At checkout, paste your copied coupon code in the <strong>&quot;Coupon Code&quot;</strong> field
                                    and click <em>&quot;Apply&quot;</em> to see instant savings!
                                </p>
                            </div>
                        </div>

                        {/* Pro Tips Section */}
                        <div className="mt-8 pt-8 border-t border-[#c89b6a]/30">
                            <h3 className="text-2xl font-bold text-[#f3d5a5] mb-4 text-center">🎯 Pro Savings Tips</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#1a1713]/60 rounded-lg p-4">
                                    <h4 className="text-[#f8c15c] font-bold mb-2 flex items-center">
                                        <span className="mr-2">📚</span> Stack Your Savings
                                    </h4>
                                    <p className="text-[#c89b6a] text-sm">
                                        <strong>Promotions</strong> (percentage off) are applied automatically.
                                        Then add a <strong>coupon code</strong> at checkout for additional savings!
                                        Some coupons can be combined with promotions.
                                    </p>
                                </div>
                                <div className="bg-[#1a1713]/60 rounded-lg p-4">
                                    <h4 className="text-[#f8c15c] font-bold mb-2 flex items-center">
                                        <span className="mr-2">⏰</span> Watch Expiry Dates
                                    </h4>
                                    <p className="text-[#c89b6a] text-sm">
                                        Look for <span className="bg-red-600 text-white px-1 rounded text-xs">ENDING SOON!</span> badges.
                                        These offers expire within 3 days. Act fast to secure your savings!
                                    </p>
                                </div>
                                <div className="bg-[#1a1713]/60 rounded-lg p-4">
                                    <h4 className="text-[#f8c15c] font-bold mb-2 flex items-center">
                                        <span className="mr-2">🎯</span> Check Minimum Orders
                                    </h4>
                                    <p className="text-[#c89b6a] text-sm">
                                        Some coupons require a minimum order amount.
                                        Add more products to your cart to qualify for bigger discounts!
                                    </p>
                                </div>
                                <div className="bg-[#1a1713]/60 rounded-lg p-4">
                                    <h4 className="text-[#f8c15c] font-bold mb-2 flex items-center">
                                        <span className="mr-2">🔄</span> Limited Usage Coupons
                                    </h4>
                                    <p className="text-[#c89b6a] text-sm">
                                        Some coupons have usage limits. The progress bar shows how many times it&apos;s been used.
                                        Popular coupons may run out quickly!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="mt-8 text-center">
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/products"
                                    className="bg-gradient-to-r from-[#c89b6a] to-[#f8c15c] hover:from-[#f8c15c] hover:to-[#c89b6a] text-[#1a1713] font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
                                >
                                    <span>🛍️</span>
                                    <span>Start Shopping Now</span>
                                </Link>
                                <Link
                                    href="/cart"
                                    className="bg-transparent border-2 border-[#c89b6a] text-[#f3d5a5] hover:bg-[#c89b6a] hover:text-[#1a1713] font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
                                >
                                    <span>🛒</span>
                                    <span>View Cart & Checkout</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
                {promotions.length > 0 && (
                    <section className="mb-16">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-[#f3d5a5] mb-4">🔥 Hot Promotions</h2>
                            <p className="text-[#c89b6a]">Limited time offers on selected products</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {promotions.map((promotion) => (
                                <div key={promotion.id} className="bg-[#1a1713]/90 rounded-2xl p-6 border border-[#c89b6a]/30 hover:border-[#f8c15c]/50 transition-all duration-300 relative overflow-hidden">
                                    {/* Background Pattern */}
                                    <div className="absolute inset-0 opacity-5">
                                        <div className="absolute top-4 right-4 text-6xl">🍫</div>
                                        <div className="absolute bottom-4 left-4 text-4xl">✨</div>
                                    </div>

                                    <div className="relative z-10">
                                        {/* Promotion Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-2xl font-bold text-[#f8c15c] mb-2">{promotion.name}</h3>
                                                <div className="flex items-center space-x-2">
                                                    <span className="bg-gradient-to-r from-[#f8c15c] to-[#c89b6a] text-[#1a1713] px-3 py-1 rounded-full text-sm font-bold">
                                                        {promotion.discountPercentage}% OFF
                                                    </span>
                                                    {isPromotionExpiringSoon(promotion.endDate) && (
                                                        <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                                                            ENDING SOON!
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-[#c89b6a] mb-4 leading-relaxed">{promotion.description}</p>

                                        {/* Validity Period */}
                                        <div className="bg-[#2a211c]/60 rounded-lg p-3 mb-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-[#c89b6a]">Valid from:</span>
                                                <span className="text-[#f3d5a5] font-medium">{formatDate(promotion.startDate)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-[#c89b6a]">Valid until:</span>
                                                <span className="text-[#f3d5a5] font-medium">{formatDate(promotion.endDate)}</span>
                                            </div>
                                        </div>

                                        {/* Featured Products */}
                                        {promotion.products && promotion.products.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="text-[#f3d5a5] font-semibold mb-3">Featured Products:</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {promotion.products.slice(0, 4).map((product) => (
                                                        <div key={product.id} className="bg-[#2a211c]/40 rounded-lg p-3">
                                                            <h5 className="text-[#f3d5a5] text-sm font-medium mb-1">{product.name}</h5>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-[#c89b6a] text-xs line-through">${product.price.toFixed(2)}</span>
                                                                <span className="text-[#f8c15c] text-sm font-bold">
                                                                    ${calculateDiscountedPrice(product.price, promotion.discountPercentage).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Call to Action */}
                                        <Link
                                            href={`/products?promotion=${promotion.id}`}
                                            className="block w-full bg-gradient-to-r from-[#c89b6a] to-[#f8c15c] hover:from-[#f8c15c] hover:to-[#c89b6a] text-[#1a1713] font-bold py-3 px-6 rounded-lg text-center transition-all duration-300 transform hover:scale-105"
                                        >
                                            Shop This Promotion →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Coupon Codes Section */}
                {coupons.length > 0 && (
                    <section className="mb-16">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-[#f3d5a5] mb-4">🎫 Discount Coupons</h2>
                            <p className="text-[#c89b6a]">Use these coupon codes at checkout for instant savings</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {coupons.map((coupon) => {
                                const isExpiringSoon = isPromotionExpiringSoon(coupon.endDate);
                                const usagePercentage = coupon.usageLimit ? (coupon.usedCount / coupon.usageLimit) * 100 : 0;

                                return (
                                    <div key={coupon.id} className="bg-[#1a1713]/90 rounded-xl border-2 border-dashed border-[#c89b6a]/50 p-6 hover:border-[#f8c15c]/70 transition-all duration-300 relative">
                                        {/* Coupon Header */}
                                        <div className="text-center mb-4">
                                            <div className="bg-[#f8c15c] text-[#1a1713] px-4 py-2 rounded-lg font-bold text-lg mb-2">
                                                {coupon.code}
                                            </div>
                                            <div className="flex items-center justify-center space-x-2">
                                                <span className="text-2xl font-bold text-[#f8c15c]">
                                                    {coupon.discountType === 'Percentage'
                                                        ? `${coupon.discountAmount}% OFF`
                                                        : `$${coupon.discountAmount} OFF`
                                                    }
                                                </span>
                                                {isExpiringSoon && (
                                                    <span className="bg-red-600 text-white px-2 py-1 rounded text-xs animate-pulse">
                                                        EXPIRES SOON!
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Coupon Details */}
                                        <div className="space-y-2 mb-4">
                                            <p className="text-[#c89b6a] text-sm text-center">{coupon.description}</p>

                                            {coupon.minimumOrderAmount && (
                                                <p className="text-[#f3d5a5] text-xs text-center">
                                                    Min. order: ${coupon.minimumOrderAmount}
                                                </p>
                                            )}

                                            <div className="text-xs text-center text-[#c89b6a]">
                                                Valid: {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}
                                            </div>

                                            {/* Usage Limit Progress */}
                                            {coupon.usageLimit && (
                                                <div className="mt-3">
                                                    <div className="flex justify-between text-xs text-[#c89b6a] mb-1">
                                                        <span>Used: {coupon.usedCount}/{coupon.usageLimit}</span>
                                                        <span>{Math.round(usagePercentage)}%</span>
                                                    </div>
                                                    <div className="w-full bg-[#2a211c] rounded-full h-2">
                                                        <div
                                                            className="bg-gradient-to-r from-[#c89b6a] to-[#f8c15c] h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${usagePercentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Copy Button */}
                                        <button
                                            onClick={() => copyToClipboard(coupon.code)}
                                            className="w-full bg-[#c89b6a] hover:bg-[#f8c15c] text-[#1a1713] font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
                                        >
                                            {copiedCoupon === coupon.code ? (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span>Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>Copy Code</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* No Offers Available */}
                {!loading && promotions.length === 0 && coupons.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🍫</div>
                        <h2 className="text-2xl font-bold text-[#f3d5a5] mb-4">No Active Offers</h2>
                        <p className="text-[#c89b6a] mb-8">Check back soon for exciting deals and promotions!</p>
                        <Link
                            href="/products"
                            className="bg-[#c89b6a] hover:bg-[#f8c15c] text-[#1a1713] font-bold py-3 px-6 rounded-lg transition-all duration-300"
                        >
                            Browse All Products
                        </Link>
                    </div>
                )}

                {/* Call to Action */}
                <section className="text-center bg-[#1a1713]/80 rounded-2xl p-8 border border-[#c89b6a]/30">
                    <h2 className="text-3xl font-bold text-[#f3d5a5] mb-4">Ready to Save?</h2>
                    <p className="text-[#c89b6a] mb-6 max-w-2xl mx-auto">
                        Don&apos;t miss out on these amazing deals! Start shopping now and treat yourself to premium chocolates at unbeatable prices.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/products"
                            className="bg-gradient-to-r from-[#c89b6a] to-[#f8c15c] hover:from-[#f8c15c] hover:to-[#c89b6a] text-[#1a1713] font-bold py-3 px-8 rounded-lg transition-all duration-300"
                        >
                            Shop All Products
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}