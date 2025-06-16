// src/app/products/[id]/page.tsx - Fixed for nested API response structure
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Product } from '@/types';

interface ReviewSummary {
    totalReviews: number;
    averageRating: number;
    ratingBreakdown: { [key: number]: number };
}

interface ReviewDto {
    id: number;
    productId: number;
    userId: string;
    userName: string;
    rating: number;
    title?: string;
    comment: string;
    createdAt: string;
    updatedAt?: string;
}

interface ProductApiResponse {
    product: Product;
    isFavorite: boolean;
    promotion?: {
        id: number;
        name: string;
        description: string;
        discountPercentage: number;
        endDate: string;
        timeRemaining: string;
        type: string;
        bannerImageUrl?: string;
        colorScheme?: string;
    };
    originalPrice?: number;
    discountedPrice?: number;
    savings?: number;
}

export default function ProductDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params);

    const [productData, setProductData] = useState<ProductApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
    const [reviews, setReviews] = useState<ReviewDto[]>([]);
    const [addingToCart, setAddingToCart] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202';

    // Get auth headers for cart operations
    const getAuthHeaders = (): Record<string, string> => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (typeof document !== 'undefined') {
            const tokenCookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('token='));

            if (tokenCookie) {
                const token = tokenCookie.split('=')[1];
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    };

    // Fetch product details using the correct endpoint
    const fetchProduct = async () => {
        try {
            const url = `${API_BASE_URL}/api/products/${id}`;
            console.log('📡 Fetching product from:', url);

            const response = await fetch(url);
            console.log('📡 Response status:', response.status);

            if (response.ok) {
                const responseData = await response.json();
                console.log('📦 Raw API response:', responseData);

                // Handle the nested response structure from your controller
                let productResponse: ProductApiResponse;

                if (responseData.product) {
                    // Standard response with nested product
                    productResponse = {
                        product: responseData.product,
                        isFavorite: responseData.isFavorite || false,
                        promotion: responseData.promotion,
                        originalPrice: responseData.originalPrice,
                        discountedPrice: responseData.discountedPrice,
                        savings: responseData.savings
                    };
                } else if (responseData.Product) {
                    // Alternative casing
                    productResponse = {
                        product: responseData.Product,
                        isFavorite: responseData.IsFavorite || false,
                        promotion: responseData.Promotion,
                        originalPrice: responseData.OriginalPrice,
                        discountedPrice: responseData.DiscountedPrice,
                        savings: responseData.Savings
                    };
                } else {
                    // Direct product response (fallback)
                    productResponse = {
                        product: responseData,
                        isFavorite: false
                    };
                }

                console.log('📦 Processed product data:', productResponse);
                setProductData(productResponse);
                setError(null);
            } else {
                const errorText = await response.text();
                console.error('❌ Product fetch failed:', response.status, errorText);
                setError(`Failed to load product: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Error fetching product:', error);
            setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    // Alternative: Use the /details endpoint if available
    const fetchProductDetails = async () => {
        try {
            const url = `${API_BASE_URL}/api/products/${id}/details`;
            console.log('📡 Fetching product details from:', url);

            const response = await fetch(url);
            console.log('📡 Details response status:', response.status);

            if (response.ok) {
                const detailsData = await response.json();
                console.log('📦 Product details response:', detailsData);

                // Extract data from details response
                if (detailsData.product || detailsData.Product) {
                    const product = detailsData.product || detailsData.Product;
                    const reviews = detailsData.reviews || detailsData.Reviews || [];
                    const ratingSummary = detailsData.ratingSummary || detailsData.RatingSummary;

                    setProductData({
                        product: product,
                        isFavorite: detailsData.isFavorite || detailsData.IsFavorite || false
                    });

                    // Set reviews directly from details response
                    if (Array.isArray(reviews)) {
                        setReviews(reviews);
                    } else if (reviews && Array.isArray(reviews.$values)) {
                        setReviews(reviews.$values);
                    }

                    // Set rating summary directly from details response
                    if (ratingSummary) {
                        setReviewSummary(ratingSummary);
                    }

                    setError(null);
                    return true; // Success
                }
            }
            return false; // Failed
        } catch (error) {
            console.error('❌ Error fetching product details:', error);
            return false; // Failed
        }
    };

    // Fetch review summary separately
    const fetchReviewSummary = async () => {
        try {
            const url = `${API_BASE_URL}/api/products/${id}/reviews/summary`;
            const response = await fetch(url);
            if (response.ok) {
                const summary = await response.json();
                console.log('📊 Review summary:', summary);
                setReviewSummary(summary);
            }
        } catch (error) {
            console.error('❌ Error fetching review summary:', error);
        }
    };

    // Fetch reviews separately
    const fetchReviews = async () => {
        try {
            const url = `${API_BASE_URL}/api/products/${id}/reviews`;
            const response = await fetch(url);
            if (response.ok) {
                const reviewsData = await response.json();
                console.log('💬 Reviews data:', reviewsData);

                let reviewsList: ReviewDto[] = [];
                if (Array.isArray(reviewsData)) {
                    reviewsList = reviewsData;
                } else if (reviewsData && Array.isArray(reviewsData.$values)) {
                    reviewsList = reviewsData.$values;
                }

                setReviews(reviewsList);
            }
        } catch (error) {
            console.error('❌ Error fetching reviews:', error);
        }
    };

    // Add to cart function
    const handleAddToCart = async () => {
        if (!productData?.product?.id || addingToCart) return;

        setAddingToCart(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/Carts/items`, {
                method: 'POST',
                credentials: 'include',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    productId: productData.product.id,
                    quantity: 1,
                    isGiftWrapped: false,
                    giftMessage: ''
                }),
            });

            if (response.ok) {
                alert('Product added to cart!');
            } else {
                const errorText = await response.text();
                console.error('Failed to add to cart:', errorText);
                alert('Failed to add product to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Error adding product to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    useEffect(() => {
        if (id) {
            console.log('🚀 Loading product data for ID:', id);

            // Try the details endpoint first, fall back to regular endpoint
            fetchProductDetails().then(success => {
                if (!success) {
                    console.log('📡 Details endpoint failed, trying regular endpoint');
                    fetchProduct();
                    fetchReviewSummary();
                    fetchReviews();
                } else {
                    console.log('✅ Successfully loaded from details endpoint');
                    setLoading(false);
                }
            });
        }
    }, [id]);

    // Render star rating
    const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
        const starSize = size === 'sm' ? 'text-sm' : 'text-base';
        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`${starSize} ${star <= Math.round(rating) ? 'text-[#f8c15c]' : 'text-[#c89b6a]/30'
                        }`}>
                        ★
                    </span>
                ))}
            </div>
        );
    };

    // Safe image URL helper
    const getImageUrl = (imageUrl: string | null | undefined) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) return imageUrl;
        if (imageUrl.startsWith('/uploads/')) {
            return `${API_BASE_URL}${imageUrl}`;
        }
        if (!imageUrl.includes('/')) {
            return `${API_BASE_URL}/uploads/${imageUrl}`;
        }
        return `${API_BASE_URL}/${imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1a1713]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[#c89b6a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#c89b6a]">Loading product details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1a1713]">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading Product</h1>
                    <p className="text-[#c89b6a] mb-4">{error}</p>
                    <div className="space-y-2">
                        <Link
                            href="/products"
                            className="block bg-[#c89b6a] hover:bg-[#f8c15c] text-white px-4 py-2 rounded transition-colors"
                        >
                            ← Back to Products
                        </Link>
                        <button
                            onClick={() => {
                                setError(null);
                                setLoading(true);
                                fetchProduct();
                            }}
                            className="block w-full bg-[#2a211c] hover:bg-[#3a312c] text-[#c89b6a] px-4 py-2 rounded transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!productData?.product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1a1713]">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[#f3d5a5] mb-4">Product Not Found</h1>
                    <Link
                        href="/products"
                        className="bg-[#c89b6a] hover:bg-[#f8c15c] text-white px-4 py-2 rounded transition-colors"
                    >
                        ← Back to Products
                    </Link>
                </div>
            </div>
        );
    }

    const product = productData.product;
    const imageUrl = getImageUrl(product.imageUrl);
    const currentPrice = productData.discountedPrice || product.price;
    const hasPromotion = productData.promotion && productData.originalPrice;

    return (
        <div className="min-h-screen bg-[#1a1713] py-8">
            <div className="container mx-auto px-4">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <div className="flex items-center space-x-2 text-sm text-[#c89b6a]/80">
                        <Link href="/" className="hover:text-[#f8c15c] transition-colors">
                            Home
                        </Link>
                        <span>›</span>
                        <Link href="/products" className="hover:text-[#f8c15c] transition-colors">
                            Products
                        </Link>
                        <span>›</span>
                        <span className="text-[#f3d5a5]">{product.name}</span>
                    </div>
                </div>

                {/* Promotion Banner */}
                {hasPromotion && (
                    <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-lg p-4 mb-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg">{productData.promotion?.name}</h3>
                                <p className="text-sm opacity-90">{productData.promotion?.description}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold">{productData.promotion?.discountPercentage}% OFF</div>
                                <div className="text-sm">Save ${productData.savings?.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Product Image */}
                    <div className="bg-[#2a211c]/90 rounded-xl p-6">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={product.name || 'Product'}
                                className="w-full h-96 object-cover rounded-lg"
                                onError={(e) => {
                                    console.error('Image failed to load:', imageUrl);
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="w-full h-96 bg-[#c89b6a]/20 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-6xl block mb-2">🍫</span>
                                    <span className="text-[#c89b6a]">No Image Available</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h1 className="text-3xl font-bold text-[#f3d5a5]">
                                    {product.name || 'Product'}
                                </h1>
                                {productData.isFavorite && (
                                    <span className="text-red-500 text-xl">❤️</span>
                                )}
                            </div>
                            <p className="text-[#c89b6a] text-lg">
                                {product.description || 'No description available'}
                            </p>
                        </div>

                        {/* Rating Summary */}
                        {reviewSummary && reviewSummary.totalReviews > 0 ? (
                            <div className="bg-[#2a211c]/50 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    {renderStars(reviewSummary.averageRating, 'md')}
                                    <span className="text-lg font-semibold text-[#f3d5a5]">
                                        {reviewSummary.averageRating.toFixed(1)}
                                    </span>
                                    <span className="text-[#c89b6a]">
                                        ({reviewSummary.totalReviews} review{reviewSummary.totalReviews !== 1 ? 's' : ''})
                                    </span>
                                </div>

                                {/* Rating Breakdown */}
                                <div className="space-y-2">
                                    {[5, 4, 3, 2, 1].map((rating) => {
                                        const count = reviewSummary.ratingBreakdown[rating] || 0;
                                        const percentage = reviewSummary.totalReviews > 0
                                            ? (count / reviewSummary.totalReviews) * 100
                                            : 0;

                                        return (
                                            <div key={rating} className="flex items-center gap-2 text-sm">
                                                <span className="text-[#c89b6a] w-8">{rating}★</span>
                                                <div className="flex-1 h-2 bg-[#c89b6a]/20 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#f8c15c] transition-all duration-300"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[#c89b6a] w-12 text-right">
                                                    {count}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#2a211c]/50 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    {renderStars(0, 'md')}
                                    <span className="text-[#c89b6a]">No reviews yet</span>
                                </div>
                            </div>
                        )}

                        {/* Price and Stock */}
                        <div className="bg-[#2a211c]/50 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="text-3xl font-bold text-[#f8c15c]">
                                    ${currentPrice?.toFixed(2) || '0.00'}
                                </div>
                                {hasPromotion && (
                                    <div className="text-lg text-[#c89b6a] line-through">
                                        ${productData.originalPrice?.toFixed(2)}
                                    </div>
                                )}
                            </div>

                            {(product.stockQuantity ?? 0) > 0 ? (
                                <div className="text-green-400">
                                    ✓ In Stock ({product.stockQuantity} available)
                                </div>
                            ) : (
                                <div className="text-red-400">
                                    ✗ Out of Stock
                                </div>
                            )}
                        </div>

                        {/* Add to Cart Button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={(product.stockQuantity ?? 0) <= 0 || addingToCart}
                            className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${(product.stockQuantity ?? 0) <= 0
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : addingToCart
                                        ? 'bg-[#c89b6a]/50 text-white cursor-wait'
                                        : 'bg-[#c89b6a] hover:bg-[#f8c15c] text-white'
                                }`}
                        >
                            {addingToCart ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Adding to Cart...
                                </>
                            ) : (product.stockQuantity ?? 0) <= 0 ? (
                                'Out of Stock'
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0H17M9 19.5a1.5 1.5 0 003 0M20 19.5a1.5 1.5 0 003 0" />
                                    </svg>
                                    Add to Cart
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Reviews Section */}
                <div id="reviews" className="bg-[#2a211c]/30 rounded-xl p-6">
                    <h2 className="text-2xl font-bold text-[#f3d5a5] mb-6">
                        Customer Reviews
                    </h2>

                    {reviews.length > 0 ? (
                        <div className="space-y-6">
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-[#1a1713]/50 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                {renderStars(review.rating)}
                                                <span className="font-semibold text-[#f3d5a5]">
                                                    {review.userName || 'Anonymous'}
                                                </span>
                                            </div>
                                            {review.title && (
                                                <h4 className="font-medium text-[#f8c15c] mb-2">
                                                    {review.title}
                                                </h4>
                                            )}
                                        </div>
                                        <span className="text-xs text-[#c89b6a]">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-[#c89b6a]">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-[#c89b6a] mb-4">No reviews yet</p>
                            <p className="text-sm text-[#c89b6a]/70">
                                Be the first to review this product!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}