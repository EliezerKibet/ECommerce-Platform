// Enhanced adminServices.ts with better error handling and fallback support

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202';

// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Enhanced helper function to handle API responses with better error details
async function handleApiResponse(response: Response) {
    console.log('Response status:', response.status);
    console.log('Response URL:', response.url);

    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails: Record<string, unknown> | null = null;

        try {
            const errorData = await response.json();
            console.log('Error response data:', errorData);
            errorMessage = errorData.message || errorData.error || errorData.title || errorMessage;
            errorDetails = errorData;
        } catch {
            console.log('Could not parse error response, using default message');
            // Try to get text response for more details
            try {
                const textResponse = await response.text();
                console.log('Error response text:', textResponse);
                if (textResponse) {
                    errorDetails = { rawResponse: textResponse };
                }
            } catch {
                // Ignore if we can't get text either
            }
        }

        const error = new Error(errorMessage);
        (error as ExtendedError).details = errorDetails;
        (error as ExtendedError).status = response.status;
        throw error;
    }

    const data = await response.json();
    console.log('Success response data:', data);

    // Handle ASP.NET Core's JSON serialization format with $id and $values
    if (data && typeof data === 'object' && '$values' in data) {
        return data.$values;
    }

    return data;
}

// Extended Error interface for better error handling
interface ExtendedError extends Error {
    details?: Record<string, unknown> | null;
    status?: number;
}

// Type definitions (keeping existing ones)
export interface ProductDto {
    id: number;
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
    categoryName: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryDto {
    id: number;
    name: string;
    description: string;
    isActive?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CouponDto {
    id: number;
    code: string;
    discountAmount: number;
    discountType: string;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    usageCount: number;
    expiryDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PromotionDto {
    id: number;
    name: string;
    description: string;
    discountPercentage: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    products?: PromotionProductDto[];
}

export interface PromotionProductDto {
    id: number;
    promotionId: number;
    productId: number;
    productName: string;
    originalPrice: number;
    discountedPrice: number;
}

// Enhanced interface for sales summary with better error handling
export interface SalesSummaryDto {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    periodStart: string;
    periodEnd: string;
    customerBreakdown?: {
        totalUsers: number;
        adminUsers: number;
        customerUsers: number;
        method1Count?: number;
        method2Count?: number;
        adminUsernames?: string[];
    };
}

// Fallback interface for customer count only
export interface CustomerCountFallback {
    totalCustomers: number;
    totalUsers: number;
    adminUsers: number;
    lastUpdated: string;
}

// Enhanced analytics service with fallback mechanisms
export const adminAnalyticsService = {
    // Sales Analytics with fallback to customer count only
    getSalesSummary: async (startDate?: string, endDate?: string): Promise<SalesSummaryDto> => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/analytics/sales/summary?${params}`, {
                headers: getAuthHeaders()
            });
            return handleApiResponse(response);
        } catch (error) {
            console.error('Sales summary failed, attempting fallback to customer count:', error);

            // Fallback 1: Try to get customer count only
            try {
                const customerData = await adminAnalyticsService.getTotalCustomers();
                console.log('Fallback customer data:', customerData);

                // Return a minimal sales summary with real customer count
                return {
                    totalRevenue: 0,
                    totalOrders: 0,
                    totalCustomers: customerData.totalCustomers,
                    averageOrderValue: 0,
                    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    periodEnd: new Date().toISOString().split('T')[0],
                    customerBreakdown: {
                        totalUsers: customerData.totalUsers,
                        adminUsers: customerData.adminUsers,
                        customerUsers: customerData.totalCustomers
                    }
                };
            } catch (fallbackError) {
                console.error('Customer count fallback also failed:', fallbackError);

                // Fallback 2: Return empty data but don't throw
                return {
                    totalRevenue: 0,
                    totalOrders: 0,
                    totalCustomers: 0,
                    averageOrderValue: 0,
                    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    periodEnd: new Date().toISOString().split('T')[0]
                };
            }
        }
    },

    // Customer count endpoints with enhanced error handling
    getTotalCustomers: async (): Promise<CustomerCountFallback> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/analytics/customers/total`, {
                headers: getAuthHeaders()
            });
            return handleApiResponse(response);
        } catch (error) {
            console.error('Direct customer count failed:', error);
            throw error;
        }
    },

    // Alternative customer count with verification
    verifyCustomerCount: async (): Promise<{
        method1_UserManager: number;
        method2_DirectQuery: number;
        method3_Subtraction: number;
        allMethodsMatch: boolean;
        details: {
            totalUsers: number;
            adminUsers: number;
            adminUserNames: string[];
        };
        recommendedCount: number;
    }> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/analytics/customers/verify`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    },

    // Debug endpoint for troubleshooting
    getDebugCounts: async (): Promise<{
        productCount: number;
        categoryCount: number;
        orderCount: number;
        userCount: number;
        customerCount: number;
        adminCount: number;
        roleBreakdown: Record<string, number>;
        userDetails: {
            totalUsers: number;
            adminUsers: Array<{ id: string; userName: string; email: string }>;
            sampleCustomers: Array<{ id: string; userName: string; email: string }>;
        };
    }> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/debug/counts`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    },

    // Health check endpoint to test basic connectivity
    healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
        try {
            // Try to hit any working endpoint to test connectivity
            const response = await fetch(`${API_BASE_URL}/api/admin/debug/counts`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                return {
                    status: 'healthy',
                    timestamp: new Date().toISOString()
                };
            } else {
                return {
                    status: `unhealthy - ${response.status}`,
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            return {
                status: `error - ${error instanceof Error ? error.message : 'unknown'}`,
                timestamp: new Date().toISOString()
            };
        }
    },

    // Other analytics methods (keeping existing implementations)
    getSalesByProduct: async (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetch(`${API_BASE_URL}/api/admin/analytics/sales/by-product?${params}`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    },

    getSalesByCategory: async (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetch(`${API_BASE_URL}/api/admin/analytics/sales/by-category?${params}`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    }
};

// Admin service (keeping existing implementation but with enhanced error handling)
export const adminService = {
    getProducts: async (): Promise<ProductDto[]> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    },

    getCategories: async (): Promise<CategoryDto[]> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    },

    getCoupons: async (): Promise<CouponDto[]> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/coupons`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    },

    getPromotions: async (): Promise<PromotionDto[]> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/promotions`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    },

    deleteProduct: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
    }
};