'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getProducts, getCategories } from '@/lib/services';
import { Product, Category } from '@/types';
import { useReviews } from '@/hooks/useReviews';

// Type definitions
interface ProductWrapper {
    $id?: string;
    product: Product;
    isFavorite: boolean;
}

type ProductItem = ProductWrapper | Product;

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

interface ReviewSummary {
    productId: number;
    totalReviews: number;
    averageRating: number;
    ratingBreakdown: { [key: number]: number };
}

interface ProductCardProps {
    product: Product;
    onAddToCart: (productId: number, quantity: number) => Promise<boolean>;
    reviewSummary?: ReviewSummary;
}

export default function ProductsPage() {
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get('category');

    const [products, setProducts] = useState<Product[]>([]);
    const [, setRawProducts] = useState<ProductItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [page] = useState(1);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(categoryParam);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | 'newest'>('name');
    const [showSearch, setShowSearch] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [user, setUser] = useState<User | null>(null);
    const [showCartNotification, setShowCartNotification] = useState(false);

    // Review integration
    useReviews();
    const [productReviews, setProductReviews] = useState<{ [productId: number]: ReviewSummary }>({});

    // API Base URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202';

    // Simplified auth headers
    const getAuthHeaders = (): Record<string, string> => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (typeof document !== 'undefined') {
            const authCookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('token='));

            if (authCookie) {
                const token = authCookie.split('=')[1];
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    };

    // Fetch cart count
    const fetchCartCount = async (): Promise<void> => {
        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/api/Carts`, {
                method: 'GET',
                credentials: 'include',
                headers: headers,
            });

            if (response.ok) {
                const cartData = await response.json();
                const itemCount = cartData.itemCount || cartData.totalItems ||
                    (cartData.items && cartData.items.$values ? cartData.items.$values.length : 0) || 0;
                setCartCount(itemCount);
            }
        } catch (error) {
            console.error('Error fetching cart count:', error);
        }
    };

    // Function to fetch review summaries for products
    const fetchProductReviewSummaries = async (productIds: number[]) => {
        if (productIds.length === 0) return;

        try {
            console.log('📊 Fetching review summaries for products:', productIds);

            // Batch fetch review summaries
            const summaryPromises = productIds.map(async (productId) => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews/summary`);
                    if (response.ok) {
                        const summary: ReviewSummary = await response.json();
                        return { productId, summary };
                    }
                    return { productId, summary: null };
                } catch (error) {
                    console.error(`Error fetching summary for product ${productId}:`, error);
                    return { productId, summary: null };
                }
            });

            const results = await Promise.all(summaryPromises);

            const summaries: { [productId: number]: ReviewSummary } = {};
            results.forEach(({ productId, summary }) => {
                if (summary && summary.totalReviews > 0) {
                    summaries[productId] = summary;
                }
            });

            setProductReviews(summaries);
            console.log('📊 Loaded review summaries:', summaries);
        } catch (error) {
            console.error('Error fetching review summaries:', error);
        }
    };

    // Add item to cart function
    const addToCart = async (productId: number, quantity: number = 1): Promise<boolean> => {
        try {
            console.log('🛒 Adding product to cart...', { productId, quantity });

            const headers = getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/api/Carts/items`, {
                method: 'POST',
                credentials: 'include',
                headers: headers,
                body: JSON.stringify({
                    productId: productId,
                    quantity: quantity,
                    isGiftWrapped: false,
                    giftMessage: ''
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Item added to cart:', result);

                await fetchCartCount();
                setShowCartNotification(true);
                setTimeout(() => setShowCartNotification(false), 3000);

                return true;
            } else {
                const errorText = await response.text();
                console.error('❌ Failed to add to cart:', response.status, errorText);
                return false;
            }
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
            return false;
        }
    };

    // Check for user authentication
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error('Error parsing stored user:', error);
                    localStorage.removeItem('user');
                }
            }
        }
    }, []);

    useEffect(() => {
        if (categoryParam) {
            setCategoryFilter(categoryParam);
        } else {
            setCategoryFilter(null);
        }

        async function fetchData() {
            setLoading(true);
            try {
                const [categoriesData, productsData] = await Promise.all([
                    getCategories(),
                    getProducts(page, 12)
                ]);

                setCategories(Array.isArray(categoriesData) ? categoriesData : []);

                const rawItems = productsData.items || [];
                setRawProducts(rawItems);

                const extractedProducts = rawItems.map((item: ProductItem) => {
                    if ('product' in item) {
                        return item.product;
                    }
                    return item;
                });

                setProducts(extractedProducts);

                // Fetch cart count and review summaries
                await fetchCartCount();

                // Fetch review summaries for all products
                const productIds = extractedProducts
                    .filter(p => p && p.id)
                    .map(p => p.id);

                if (productIds.length > 0) {
                    await fetchProductReviewSummaries(productIds);
                }
            } catch (error) {
                console.error('Error loading data:', error);
                setCategories([]);
                setProducts([]);
                setRawProducts([]);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [page, categoryParam]);

    const displayedProducts = useMemo(() => {
        let filtered = products;

        // Filter by category
        if (categoryFilter) {
            filtered = filtered.filter((product: Product) => {
                if (!product) return false;
                const matches = [
                    product.categoryName?.toLowerCase() === categoryFilter.toLowerCase(),
                    categories.some(cat =>
                        cat.id === product.categoryId &&
                        cat.name?.toLowerCase() === categoryFilter.toLowerCase()
                    ),
                ];
                return matches.some(match => match === true);
            });
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter((product: Product) =>
                product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort products
        filtered = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'newest':
                    return b.id - a.id;
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return filtered;
    }, [products, categoryFilter, categories, searchTerm, sortBy]);

    return (
        <div className="min-h-screen">
            {/* Cart Success Notification */}
            {showCartNotification && (
                <div className="fixed top-20 right-4 z-[60] max-w-sm">
                    <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in-right border border-green-400/30 backdrop-blur-sm">
                        <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <div className="flex-1">
                            <p className="font-semibold text-sm">Added to cart!</p>
                            <p className="text-green-100 text-xs">Item successfully added</p>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href="/carts"
                                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors border border-white/20"
                            >
                                View Cart
                            </Link>
                            <button
                                onClick={() => setShowCartNotification(false)}
                                className="text-white/80 hover:text-white p-1 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="fixed top-0 right-0 z-50 p-4">
                <div className="flex items-center space-x-3">
                    <Link href={user ? "/profile" : "/auth/login"} className="relative group">
                        <div className="p-3 rounded-full bg-[#1a1713]/80 backdrop-blur-sm border border-[#c89b6a]/30 hover:bg-[#1a1713]/90 hover:border-[#f8c15c]/50 transition-all duration-300 shadow-lg">
                            {user ? (
                                <div className="relative">
                                    <svg className="w-6 h-6 text-[#c89b6a] group-hover:text-[#f8c15c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1713]"></div>
                                </div>
                            ) : (
                                <svg className="w-6 h-6 text-[#c89b6a] group-hover:text-[#f8c15c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                            )}
                        </div>
                        <div className="absolute right-0 top-full mt-2 px-2 py-1 bg-[#1a1713]/90 text-[#f3d5a5] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {user ? `Hi, ${user.firstName || 'User'}!` : 'Sign In'}
                        </div>
                    </Link>

                    <Link href="/orders" className="relative group">
                        <div className="p-3 rounded-full bg-[#1a1713]/80 backdrop-blur-sm border border-[#c89b6a]/30 hover:bg-[#1a1713]/90 hover:border-[#f8c15c]/50 transition-all duration-300 shadow-lg">
                            <svg className="w-6 h-6 text-[#c89b6a] group-hover:text-[#f8c15c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="absolute right-0 top-full mt-2 px-2 py-1 bg-[#1a1713]/90 text-[#f3d5a5] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            My Orders
                        </div>
                    </Link>

                    <Link href="/carts" className="relative group">
                        <div className="p-3 rounded-full bg-[#1a1713]/80 backdrop-blur-sm border border-[#c89b6a]/30 hover:bg-[#1a1713]/90 hover:border-[#f8c15c]/50 transition-all duration-300 shadow-lg">
                            <svg className="w-6 h-6 text-[#c89b6a] group-hover:text-[#f8c15c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0H17M9 19.5a1.5 1.5 0 003 0M20 19.5a1.5 1.5 0 003 0" />
                            </svg>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#f8c15c] text-[#1a1713] text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-[#1a1713] animate-pulse">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </div>
                        <div className="absolute right-0 top-full mt-2 px-2 py-1 bg-[#1a1713]/90 text-[#f3d5a5] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Shopping Cart {cartCount > 0 && `(${cartCount})`}
                        </div>
                    </Link>

                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className="relative group"
                    >
                        <div className="p-3 rounded-full bg-[#1a1713]/80 backdrop-blur-sm border border-[#c89b6a]/30 hover:bg-[#1a1713]/90 hover:border-[#f8c15c]/50 transition-all duration-300 shadow-lg">
                            <svg className="w-6 h-6 text-[#c89b6a] group-hover:text-[#f8c15c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <div className="absolute right-0 top-full mt-2 px-2 py-1 bg-[#1a1713]/90 text-[#f3d5a5] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Search Products
                        </div>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            {showSearch && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search chocolates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1a1713]/90 backdrop-blur-sm border border-[#c89b6a]/30 rounded-full px-6 py-3 pl-12 pr-12 text-[#f3d5a5] placeholder-[#c89b6a]/70 focus:outline-none focus:ring-2 focus:ring-[#f8c15c] focus:border-transparent shadow-xl"
                            autoFocus
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                            <svg className="w-5 h-5 text-[#c89b6a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <button
                            onClick={() => setShowSearch(false)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#c89b6a] hover:text-[#f8c15c] transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Breadcrumb */}
            <div className="container mx-auto px-4 pt-24 pb-4">
                <div className="flex items-center space-x-2 text-sm text-[#c89b6a]/80">
                    <Link href="/" className="hover:text-[#f8c15c] transition-colors">Home</Link>
                    <span>›</span>
                    <span className="text-[#f3d5a5]">
                        {categoryFilter ? `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Products` : 'All Products'}
                    </span>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-8">
                {/* Page Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#f3d5a5] drop-shadow-lg mb-4">
                        {categoryFilter
                            ? `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Collection`
                            : 'Premium Chocolate Collection'}
                    </h1>
                    <p className="text-[#c89b6a] text-lg">
                        Discover our handcrafted chocolates made with the finest ingredients
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="w-full lg:w-1/4">
                        <div className="bg-[#1a1713]/90 rounded-xl p-6 shadow-lg border border-[#c89b6a]/20 sticky top-28">
                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-4 text-[#f3d5a5] border-b border-[#c89b6a]/50 pb-2">Categories</h3>
                                <ul className="space-y-2">
                                    <li>
                                        <button
                                            onClick={() => {
                                                setCategoryFilter(null);
                                                window.history.pushState({}, '', '/products');
                                            }}
                                            className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${!categoryFilter
                                                ? 'bg-[#c89b6a]/40 text-[#f8f8f8] font-medium'
                                                : 'text-[#e6e6e6] hover:bg-[#2a211c]/80'}`}
                                        >
                                            All Products ({products.length})
                                        </button>
                                    </li>
                                    {categories.map((category) => {
                                        const categoryProductCount = products.filter(p =>
                                            p.categoryName?.toLowerCase() === category.name?.toLowerCase()
                                        ).length;
                                        return (
                                            <li key={category.id || `category-${category.name}`}>
                                                <Link
                                                    href={`/products?category=${category.name?.toLowerCase()}`}
                                                    className={`block px-3 py-2 rounded-lg transition-colors ${categoryFilter === category.name?.toLowerCase()
                                                        ? 'bg-[#c89b6a]/40 text-[#f8f8f8] font-medium'
                                                        : 'text-[#e6e6e6] hover:bg-[#2a211c]/80'}`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span>{category.name}</span>
                                                        <span className="text-xs text-[#c89b6a]">({categoryProductCount})</span>
                                                    </div>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold mb-4 text-[#f3d5a5] border-b border-[#c89b6a]/50 pb-2">Quick Links</h3>
                                <div className="space-y-2">
                                    <Link href="/offers" className="flex items-center space-x-2 text-[#e6e6e6] hover:text-[#f8c15c] transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                        </svg>
                                        <span>Coupons & Deals & Promotions</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="w-full lg:w-3/4">
                        {/* Filters and Sort */}
                        <div className="bg-[#1a1713]/80 rounded-xl p-4 mb-6 border border-[#c89b6a]/20">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center space-x-4">
                                    <span className="text-[#c89b6a] text-sm">
                                        Showing {displayedProducts.length} of {products.length} products
                                    </span>
                                    {searchTerm && (
                                        <span className="text-[#f8c15c] text-sm">
                                            {`for "${searchTerm}"`}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-[#c89b6a] text-sm">Sort by:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as 'name' | 'price-low' | 'price-high' | 'newest')}
                                        className="bg-[#2a211c]/90 border border-[#c89b6a]/30 rounded-lg px-3 py-1 text-[#f3d5a5] text-sm focus:outline-none focus:ring-2 focus:ring-[#f8c15c]"
                                    >
                                        <option value="name">Name A-Z</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="newest">Newest First</option>
                                    </select>

                                    <div className="flex border border-[#c89b6a]/30 rounded-lg overflow-hidden">
                                        <button className="p-2 bg-[#c89b6a]/40 text-[#f3d5a5]">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                                            </svg>
                                        </button>
                                        <button className="p-2 bg-[#2a211c]/50 text-[#c89b6a] hover:bg-[#c89b6a]/20">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M3 3v8h8V3H3zm10 0v8h8V3h-8zM3 13v8h8v-8H3zm10 0v8h8v-8h-8z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Products Grid */}
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#f3d5a5]"></div>
                            </div>
                        ) : displayedProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayedProducts.map((product: Product) => (
                                    <ProductCard
                                        key={product?.id || `product-${Math.random()}`}
                                        product={product}
                                        onAddToCart={addToCart}
                                        reviewSummary={productReviews[product.id]}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-[#1a1713]/80 rounded-xl shadow-lg border border-[#c89b6a]/20">
                                <div className="mb-4">
                                    <svg className="w-16 h-16 text-[#c89b6a] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-[#f3d5a5] mb-2">No products found</h3>
                                <p className="text-[#c89b6a] mb-6">
                                    {searchTerm
                                        ? `No chocolates match "${searchTerm}"`
                                        : categoryFilter
                                            ? `No ${categoryFilter} chocolates available`
                                            : 'No products available'}
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setCategoryFilter(null);
                                        window.history.pushState({}, '', '/products');
                                    }}
                                    className="bg-[#c89b6a] text-[#1a1713] px-6 py-2 rounded-lg hover:bg-[#f8c15c] transition-colors font-medium"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}

function ProductCard({ product, onAddToCart, reviewSummary }: ProductCardProps) {
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const price = product?.price !== undefined && product?.price !== null
        ? product.price.toFixed(2)
        : '0.00';

    // Use review summary from props instead of product data
    const hasRating = reviewSummary && reviewSummary.averageRating > 0;
    const hasReviews = reviewSummary && reviewSummary.totalReviews > 0;

    const getImageUrl = (imageUrl: string | null | undefined) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) return imageUrl;
        if (imageUrl.startsWith('/uploads/')) {
            return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}${imageUrl}`;
        }
        if (!imageUrl.includes('/')) {
            return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/uploads/${imageUrl}`;
        }
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/${imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl}`;
    };

    const imageUrl = getImageUrl(product?.imageUrl);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!product?.id) return;

        setIsAddingToCart(true);
        try {
            const success = await onAddToCart(product.id, 1);
            if (success) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2000);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            setIsAddingToCart(false);
        }
    };

    return (
        <div className="group bg-[#1a1713]/90 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-[#c89b6a]/20 hover:border-[#f8c15c]/40">
            <Link href={`/products/${product?.id}`}>
                <div className="relative h-56 bg-[#2a211c]/90 overflow-hidden">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={product.name || 'Product'}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-[#c89b6a]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl">🍫</span>
                                </div>
                                <span className="text-[#c89b6a] text-sm">No Image</span>
                            </div>
                        </div>
                    )}

                    {/* Add to Cart Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                            onClick={handleAddToCart}
                            disabled={isAddingToCart || product.stockQuantity <= 0}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform scale-95 group-hover:scale-100 flex items-center gap-2 ${showSuccess
                                ? 'bg-green-600 text-white'
                                : product.stockQuantity <= 0
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-[#c89b6a] hover:bg-[#f8c15c] text-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isAddingToCart ? (
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : showSuccess ? (
                                <>
                                    <span>✓</span>
                                    <span>Added!</span>
                                </>
                            ) : product.stockQuantity <= 0 ? (
                                'Out of Stock'
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0H17M9 19.5a1.5 1.5 0 003 0M20 19.5a1.5 1.5 0 003 0" />
                                    </svg>
                                    <span>Add to Cart</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Stock Status Badges */}
                    {product.stockQuantity <= 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                Out of Stock
                            </span>
                        </div>
                    )}

                    {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                        <div className="absolute top-3 left-3">
                            <span className="bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                Only {product.stockQuantity} left
                            </span>
                        </div>
                    )}

                    {/* Review badge if product has reviews */}
                    {hasReviews && (
                        <div className="absolute top-3 right-3">
                            <div className="bg-[#f8c15c]/90 text-[#1a1713] px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                <span>★</span>
                                <span>{reviewSummary.averageRating.toFixed(1)}</span>
                                <span>({reviewSummary.totalReviews})</span>
                            </div>
                        </div>
                    )}
                </div>
            </Link>

            <div className="p-5">
                <Link href={`/products/${product?.id}`}>
                    <h3 className="text-lg font-bold mb-2 text-[#f3d5a5] hover:text-[#f8c15c] transition-colors line-clamp-2">
                        {product?.name || 'Unnamed Product'}
                    </h3>
                </Link>

                <p className="text-[#c89b6a] text-sm mb-3 line-clamp-2">
                    {product?.description || 'Delicious chocolate crafted with premium ingredients'}
                </p>

                {/* Rating using review summary data */}
                <div className="flex items-center mb-3">
                    {hasRating ? (
                        <>
                            <div className="flex mr-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star} className="text-sm">
                                        {star <= Math.round(reviewSummary.averageRating) ? (
                                            <span className="text-[#f8c15c]">★</span>
                                        ) : (
                                            <span className="text-[#c89b6a]/30">★</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                            {hasReviews && (
                                <span className="text-xs text-[#c89b6a]">
                                    ({reviewSummary.totalReviews} review{reviewSummary.totalReviews !== 1 ? 's' : ''})
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-xs text-[#c89b6a]/70 italic">No reviews yet</span>
                    )}
                </div>

                {/* Price and Actions */}
                <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[#f8c15c]">${price}</span>
                    <button
                        onClick={handleAddToCart}
                        disabled={isAddingToCart || product.stockQuantity <= 0}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1 ${product.stockQuantity <= 0
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : showSuccess
                                ? 'bg-green-600 text-white'
                                : 'bg-[#c89b6a] text-[#1a1713] hover:bg-[#f8c15c] hover:shadow-lg transform hover:-translate-y-0.5'
                            }`}
                    >
                        {isAddingToCart ? (
                            <>
                                <div className="w-4 h-4 border-2 border-[#1a1713] border-t-transparent rounded-full animate-spin"></div>
                                <span>Adding...</span>
                            </>
                        ) : showSuccess ? (
                            <>
                                <span>✓</span>
                                <span>Added!</span>
                            </>
                        ) : product.stockQuantity <= 0 ? (
                            'Out of Stock'
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0H17M9 19.5a1.5 1.5 0 003 0M20 19.5a1.5 1.5 0 003 0" />
                                </svg>
                                <span>Add to Cart</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Quick View Link */}
                <Link
                    href={`/products/${product?.id}`}
                    className="block mt-3 text-center text-[#c89b6a] hover:text-[#f8c15c] text-sm transition-colors"
                >
                    View Details →
                </Link>
            </div>
        </div>
    );
}