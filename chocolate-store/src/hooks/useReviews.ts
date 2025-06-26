// src/hooks/useReviews.ts
import { useState, useCallback, useRef } from 'react';

interface ReviewDto {
    id: number;
    productId: number;
    userId: string;
    userName: string;
    rating: number;
    title?: string;
    comment: string;
    isVerifiedPurchase: boolean;
    isApproved: boolean;
    createdAt: string;
    updatedAt?: string;
}

interface ReviewForm {
    rating: number;
    title?: string;
    comment: string;
}

export const useReviews = () => {
    const [userReviews, setUserReviews] = useState<{ [productId: number]: ReviewDto }>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Track which products we've already checked to avoid duplicates
    const checkedProducts = useRef(new Set<number>());

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202';

    // Get auth headers - optimized version
    const getAuthHeaders = useCallback((): Record<string, string> => {
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
    }, []);

    // Check if user is authenticated
    const isAuthenticated = useCallback(() => {
        if (typeof document !== 'undefined') {
            const tokenCookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('token='));
            return !!tokenCookie;
        }
        return false;
    }, []);

    // Get user's review for a specific product (single API call)
    const getUserReview = useCallback(async (productId: number): Promise<ReviewDto | null> => {
        if (!isAuthenticated()) return null;

        // Don't check the same product multiple times
        if (checkedProducts.current.has(productId)) {
            return userReviews[productId] || null;
        }

        try {
            console.log(`🔍 Checking user review for product ${productId}`);

            const response = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews/user`, {
                headers: getAuthHeaders()
            });

            checkedProducts.current.add(productId);

            if (response.ok) {
                const review = await response.json();
                console.log(`✅ Found user review for product ${productId}: rating ${review.rating}`);

                setUserReviews(prev => ({
                    ...prev,
                    [productId]: review
                }));

                return review;
            } else if (response.status === 404) {
                console.log(`❌ No user review found for product ${productId}`);
                return null;
            } else {
                console.error(`Error fetching user review for product ${productId}:`, response.status);
                return null;
            }
        } catch (error) {
            console.error(`Error fetching user review for product ${productId}:`, error);
            return null;
        }
    }, [isAuthenticated, userReviews, getAuthHeaders, API_BASE_URL]);

    // Batch check user reviews for multiple products (optimized)
    const checkUserReviews = useCallback(async (productIds: number[]) => {
        if (!isAuthenticated() || productIds.length === 0) return;

        // Filter out products we've already checked
        const uncheckedProducts = productIds.filter(id => !checkedProducts.current.has(id));

        if (uncheckedProducts.length === 0) {
            console.log('All products already checked, skipping API calls');
            return;
        }

        setLoading(true);
        console.log('🔍 Checking user reviews for unchecked products:', uncheckedProducts);

        try {
            // Limit concurrent requests to avoid overwhelming the server
            const batchSize = 5;
            const batches = [];

            for (let i = 0; i < uncheckedProducts.length; i += batchSize) {
                batches.push(uncheckedProducts.slice(i, i + batchSize));
            }

            for (const batch of batches) {
                const promises = batch.map(productId => getUserReview(productId));
                await Promise.allSettled(promises);

                // Small delay between batches to be nice to the server
                if (batches.length > 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            console.log(`📋 Completed checking ${uncheckedProducts.length} products`);
        } catch (error) {
            console.error('Error checking user reviews:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, getUserReview]);

    // Submit or update a review
    const submitReview = useCallback(async (
        productId: number,
        reviewData: ReviewForm,
        existingReviewId?: number
    ) => {
        if (!isAuthenticated()) {
            throw new Error('You must be logged in to submit a review');
        }

        const url = existingReviewId
            ? `${API_BASE_URL}/api/products/${productId}/reviews/${existingReviewId}`
            : `${API_BASE_URL}/api/products/${productId}/reviews`;

        const method = existingReviewId ? 'PUT' : 'POST';

        console.log(`📝 ${method === 'POST' ? 'Creating' : 'Updating'} review for product ${productId}`);

        setSubmitting(true);
        try {
            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(reviewData)
            });

            if (response.ok) {
                const review = await response.json();
                console.log(`✅ Review ${method === 'POST' ? 'created' : 'updated'} successfully:`, review.id);

                // Update local state
                setUserReviews(prev => ({
                    ...prev,
                    [productId]: review
                }));

                return { success: true, review };
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error(`❌ Review submission failed:`, errorData);
                return { success: false, error: errorData.message || 'Failed to submit review' };
            }
        } catch (error) {
            console.error('❌ Review submission error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
        } finally {
            setSubmitting(false);
        }
    }, [isAuthenticated, getAuthHeaders, API_BASE_URL]);

    // Get all reviews for a product (public endpoint)
    const getProductReviews = useCallback(async (productId: number): Promise<ReviewDto[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews`, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                const reviewList = data.$values || data || [];
                console.log(`📝 Found ${reviewList.length} reviews for product ${productId}`);
                return reviewList;
            }
            return [];
        } catch (error) {
            console.error(`Error fetching reviews for product ${productId}:`, error);
            return [];
        }
    }, [API_BASE_URL]);

    // Clear cache for a specific product (useful after updates)
    const clearProductCache = useCallback((productId: number) => {
        checkedProducts.current.delete(productId);
        setUserReviews(prev => {
            const newState = { ...prev };
            delete newState[productId];
            return newState;
        });
    }, []);

    // Clear all cache
    const clearAllCache = useCallback(() => {
        checkedProducts.current.clear();
        setUserReviews({});
    }, []);

    return {
        userReviews,
        loading,
        submitting,
        getUserReview,
        checkUserReviews,
        submitReview,
        getProductReviews,
        clearProductCache,
        clearAllCache
    };
};