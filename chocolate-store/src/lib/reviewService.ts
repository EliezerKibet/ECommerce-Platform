// lib/reviewService.ts
import api from './api';

export interface Review {
    id: number;
    productId: number;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    reviewDate: string;
}

export interface CreateReviewDto {
    rating: number;
    comment: string;
}

export interface UpdateReviewDto {
    rating: number;
    comment: string;
}

export interface ProductRatingsSummaryDto {
    productId: number;
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
}

export class ReviewService {
    private static API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202';

    // Get reviews for a product
    static async getProductReviews(productId: number, page = 1, pageSize = 10): Promise<Review[]> {
        try {
            const response = await api.get(`/api/products/${productId}/reviews`, {
                params: { page, pageSize }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching product reviews:', error);
            throw error;
        }
    }

    // Get product rating summary
    static async getProductRatingsSummary(productId: number): Promise<ProductRatingsSummaryDto> {
        try {
            const response = await api.get(`/api/products/${productId}/reviews/summary`);
            return response.data;
        } catch (error) {
            console.error('Error fetching product ratings summary:', error);
            throw error;
        }
    }

    // Create a new review
    static async createReview(productId: number, reviewData: CreateReviewDto): Promise<Review> {
        try {
            const response = await api.post(`/api/products/${productId}/reviews`, reviewData);
            return response.data;
        } catch (error) {
            console.error('Error creating review:', error);
            throw error;
        }
    }

    // Update an existing review
    static async updateReview(productId: number, reviewId: number, reviewData: UpdateReviewDto): Promise<Review> {
        try {
            const response = await api.put(`/api/products/${productId}/reviews/${reviewId}`, reviewData);
            return response.data;
        } catch (error) {
            console.error('Error updating review:', error);
            throw error;
        }
    }

    // Delete a review
    static async deleteReview(productId: number, reviewId: number): Promise<void> {
        try {
            await api.delete(`/api/products/${productId}/reviews/${reviewId}`);
        } catch (error) {
            console.error('Error deleting review:', error);
            throw error;
        }
    }

    // Get a specific review
    static async getReview(productId: number, reviewId: number): Promise<Review> {
        try {
            const response = await api.get(`/api/products/${productId}/reviews/${reviewId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching review:', error);
            throw error;
        }
    }

    // Check if current user has purchased the product and can review it
    static async canUserReview(): Promise<boolean> {
        try {
            // This would need to be implemented based on your order system
            // For now, we'll assume users can review if they're logged in or have a guest session
            const token = document.cookie.split('; ').find(row => row.startsWith('token='));
            const guestId = document.cookie.split('; ').find(row => row.startsWith('GuestId='));

            return !!(token || guestId);
        } catch (error) {
            console.error('Error checking review eligibility:', error);
            return false;
        }
    }

    // Get current user's review for a product (if any)
    static async getUserReviewForProduct(productId: number): Promise<Review | null> {
        try {
            const reviews = await this.getProductReviews(productId);
            const currentUserId = this.getCurrentUserId();

            if (!currentUserId) return null;

            return reviews.find(review => review.userId === currentUserId) || null;
        } catch (error) {
            console.error('Error fetching user review:', error);
            return null;
        }
    }

    // Helper to get current user ID
    private static getCurrentUserId(): string | null {
        try {
            // Try to get from localStorage first (authenticated users)
            const user = localStorage.getItem('user');
            if (user) {
                const userData = JSON.parse(user);
                return userData.id;
            }

            // Try to get guest ID from cookie
            const guestIdCookie = document.cookie.split('; ').find(row => row.startsWith('GuestId='));
            if (guestIdCookie) {
                const guestId = guestIdCookie.split('=')[1];
                return guestId.startsWith('guest-') ? guestId : `guest-${guestId}`;
            }

            return null;
        } catch (error) {
            console.error('Error getting current user ID:', error);
            return null;
        }
    }
}