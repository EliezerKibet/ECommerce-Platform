// API services for admin dashboard

import {
    SalesSummaryDto,
    AllTimeSalesDto,
    SalesOrderDto,
    ProductDto,
    CategoryDto,
    CouponDto,
    PromotionDto,
    CustomerCountFallback,
    ExtendedError,
    AspNetValueResponse,
    AspNetOrder,
    AspNetOrderItem
} from './types';

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
                    dailyData: [],
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
                    periodEnd: new Date().toISOString().split('T')[0],
                    dailyData: []
                };
            }
        }
    },

    getAllTimeSales: async (): Promise<AllTimeSalesDto> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/analytics/sales/all-time`, {
                headers: getAuthHeaders()
            });
            return handleApiResponse(response);
        } catch (error) {
            console.error('All time sales failed:', error);
            return {
                allTimeSales: {
                    summary: {
                        totalRevenue: 0,
                        totalOrders: 0,
                        averageOrderValue: 0,
                        firstOrderDate: '',
                        lastOrderDate: '',
                        businessDays: 0
                    },
                    monthlyData: [],
                    yearlyData: []
                },
                totalCustomers: 0,
                generatedAt: new Date().toISOString()
            };
        }
    },

    getFlexibleSalesSummary: async (period: string): Promise<SalesSummaryDto | AllTimeSalesDto> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/analytics/sales/flexible?period=${period}`, {
                headers: getAuthHeaders()
            });
            return handleApiResponse(response);
        } catch (error) {
            console.error('Flexible sales summary failed:', error);
            if (period === 'alltime') {
                return adminAnalyticsService.getAllTimeSales();
            } else {
                return adminAnalyticsService.getSalesSummary();
            }
        }
    },

    getSalesOrders: async (page: number = 1, pageSize: number = 50): Promise<SalesOrderDto> => {
        try {
            console.log('🌐 Making API call to:', `${API_BASE_URL}/api/admin/analytics/sales/orders?page=${page}&pageSize=${pageSize}`);

            const response = await fetch(`${API_BASE_URL}/api/admin/analytics/sales/orders?page=${page}&pageSize=${pageSize}`, {
                headers: getAuthHeaders()
            });

            const rawData = await handleApiResponse(response);

            // Handle different response structures
            let data: {
                orders: Array<{
                    orderId: string | number;
                    orderNumber?: string;
                    orderDate: string;
                    customerName: string;
                    customerEmail: string;
                    totalAmount: number;
                    subtotal?: number;
                    tax?: number;
                    shippingCost?: number;
                    discountAmount?: number;
                    status: string;
                    paymentStatus?: string;
                    paymentMethod?: string;
                    itemCount: number;
                    couponCode?: string;
                    orderNotes?: string;
                    shippingAddress?: string;
                    shippingPhone?: string;
                    shippingMethod?: string;
                    orderItems: Array<{
                        orderItemId?: number;
                        productId: number;
                        productName: string;
                        quantity: number;
                        unitPrice: number;
                        total: number;
                    }>;
                }>;
                pagination?: {
                    currentPage: number;
                    pageSize: number;
                    totalOrders: number;
                    totalPages: number;
                    hasNextPage: boolean;
                    hasPreviousPage: boolean;
                };
            };

            // Check if the response has the expected structure
            if (rawData && typeof rawData === 'object' && 'orders' in rawData) {
                const ordersData = rawData.orders;
                let ordersArray: AspNetOrder[] | null = null;

                // Check if it's the $values format (ASP.NET Core serialization)
                if (ordersData && typeof ordersData === 'object' && '$values' in ordersData && Array.isArray(ordersData.$values)) {
                    console.log('✅ Found orders in $values format with length:', ordersData.$values.length);
                    ordersArray = ordersData.$values as AspNetOrder[];
                } else if (Array.isArray(ordersData)) {
                    console.log('✅ Found orders array directly with length:', ordersData.length);
                    ordersArray = ordersData as AspNetOrder[];
                }

                if (ordersArray) {
                    let paginationData = rawData.pagination;
                    if (paginationData && typeof paginationData === 'object' && '$values' in paginationData) {
                        paginationData = (paginationData as AspNetValueResponse<unknown>).$values;
                    }

                    // Map AspNetOrder[] to the expected shape for SalesOrderDto
                    data = {
                        orders: ordersArray.map((order) => {
                            let orderItemsArray: AspNetOrderItem[] = [];
                            if (order.orderItems) {
                                if (Array.isArray(order.orderItems)) {
                                    orderItemsArray = order.orderItems;
                                } else if (
                                    typeof order.orderItems === 'object' &&
                                    '$values' in order.orderItems &&
                                    Array.isArray(order.orderItems.$values)
                                ) {
                                    orderItemsArray = order.orderItems.$values;
                                }
                            }

                            // Ensure orderId is never undefined
                            const orderId = order.orderId ?? order.id ?? 0;

                            return {
                                orderId,
                                orderNumber: order.orderNumber,
                                orderDate: order.orderDate,
                                customerName: order.customerName || 'Unknown',
                                customerEmail: order.customerEmail || 'N/A',
                                totalAmount: order.totalAmount || 0,
                                subtotal: order.subtotal,
                                tax: order.tax,
                                shippingCost: order.shippingCost,
                                discountAmount: order.discountAmount,
                                status: order.status || 'Pending',
                                paymentStatus: order.paymentStatus,
                                paymentMethod: order.paymentMethod,
                                itemCount: order.itemCount || orderItemsArray.length,
                                couponCode: order.couponCode,
                                orderNotes: order.orderNotes,
                                shippingAddress: order.shippingAddress,
                                shippingPhone: order.shippingPhone,
                                shippingMethod: order.shippingMethod,
                                orderItems: orderItemsArray.map((item, idx) => ({
                                    orderItemId: item.$id ? parseInt(item.$id) : idx,
                                    productId: item.productId,
                                    productName: item.productName,
                                    quantity: item.quantity,
                                    unitPrice: item.unitPrice,
                                    total: item.total,
                                }))
                            };
                        }),
                        pagination: paginationData
                    };
                } else {
                    console.warn('⚠️ Orders property exists but is not an array or $values format');
                    return {
                        orders: [],
                        pagination: {
                            currentPage: page,
                            pageSize: pageSize,
                            totalOrders: 0,
                            totalPages: 0,
                            hasNextPage: false,
                            hasPreviousPage: false
                        }
                    };
                }
            } else if (Array.isArray(rawData)) {
                // If the response is directly an array, transform it
                data = {
                    orders: rawData.map((order: AspNetOrder) => {
                        let orderItemsArray: AspNetOrderItem[] = [];
                        if (order.orderItems) {
                            if (Array.isArray(order.orderItems)) {
                                orderItemsArray = order.orderItems;
                            } else if (
                                typeof order.orderItems === 'object' &&
                                '$values' in order.orderItems &&
                                Array.isArray(order.orderItems.$values)
                            ) {
                                orderItemsArray = order.orderItems.$values;
                            }
                        }

                        // Ensure orderId is never undefined
                        const orderId = order.orderId ?? order.id ?? order.orderNumber ?? 0;

                        return {
                            orderId,
                            orderNumber: order.orderNumber,
                            orderDate: order.orderDate,
                            customerName: order.customerName || 'Unknown',
                            customerEmail: order.customerEmail || 'N/A',
                            totalAmount: order.totalAmount || 0,
                            subtotal: order.subtotal,
                            tax: order.tax,
                            shippingCost: order.shippingCost,
                            discountAmount: order.discountAmount,
                            status: order.status || 'Pending',
                            paymentStatus: order.paymentStatus,
                            paymentMethod: order.paymentMethod,
                            itemCount: order.itemCount || orderItemsArray.length,
                            couponCode: order.couponCode,
                            orderNotes: order.orderNotes,
                            shippingAddress: order.shippingAddress,
                            shippingPhone: order.shippingPhone,
                            shippingMethod: order.shippingMethod,
                            orderItems: orderItemsArray.map((item, idx) => ({
                                orderItemId: item.$id ? parseInt(item.$id) : idx,
                                productId: item.productId,
                                productName: item.productName,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                total: item.total,
                            }))
                        };
                    }),
                    pagination: {
                        currentPage: page,
                        pageSize: pageSize,
                        totalOrders: rawData.length,
                        totalPages: Math.ceil(rawData.length / pageSize),
                        hasNextPage: false,
                        hasPreviousPage: false
                    }
                };
            } else {
                console.warn('⚠️ Unexpected API response structure:', rawData);
                return {
                    orders: [],
                    pagination: {
                        currentPage: page,
                        pageSize: pageSize,
                        totalOrders: 0,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPreviousPage: false
                    }
                };
            }

            // Ensure orders is an array and already transformed
            if (!Array.isArray(data.orders)) {
                console.warn('⚠️ Orders is not an array:', data.orders);
                data.orders = [];
            }

            return {
                orders: data.orders,
                pagination: data.pagination || {
                    currentPage: page,
                    pageSize: pageSize,
                    totalOrders: data.orders.length,
                    totalPages: Math.ceil(data.orders.length / pageSize),
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            };
        } catch (error) {
            console.error('❌ Sales orders failed with error:', error);
            return {
                orders: [],
                pagination: {
                    currentPage: page,
                    pageSize: pageSize,
                    totalOrders: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            };
        }
    },

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

    getDebugCounts: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/debug/counts`, {
                headers: getAuthHeaders()
            });
            return handleApiResponse(response);
        } catch (error) {
            console.error('Debug counts failed:', error);
            return {
                productCount: 0,
                categoryCount: 0,
                orderCount: 0,
                userCount: 0,
                customerCount: 0,
                adminCount: 0,
                roleBreakdown: {},
                userDetails: {
                    totalUsers: 0,
                    adminUsers: [],
                    sampleCustomers: []
                }
            };
        }
    },

    healthCheck: async () => {
        try {
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

    getPromotions: async (): Promise<PromotionDto[]> => {
        try {
            // Fix: Use /api/admin/promotions instead of /api/promotions
            const response = await fetch(`${API_BASE_URL}/api/admin/promotions`, {
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch promotions');
            const data = await response.json();
            return Array.isArray(data) ? data : (data.$values || []);
        } catch (error) {
            console.error('Error fetching promotions:', error);
            return [];
        }
    },

    createPromotion: async (formData: FormData): Promise<PromotionDto> => {
        try {
            console.log('=== CREATING PROMOTION ===');

            // Log the FormData contents
            console.log('FormData contents:');
            for (const [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            // Convert FormData to JSON since your backend expects [FromBody]
            const promotionData = {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                discountPercentage: parseFloat(formData.get('discountPercentage') as string),
                startDate: formData.get('startDate') as string,
                endDate: formData.get('endDate') as string,
                isActive: formData.get('isActive') === 'true',
                productIds: formData.get('productIds') ? JSON.parse(formData.get('productIds') as string) : []
            };

            console.log('Converted promotion data:', promotionData);

            const response = await fetch(`${API_BASE_URL}/api/admin/promotions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(promotionData)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                // Get detailed error information
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                let errorData = null;

                try {
                    const errorText = await response.text();
                    console.log('Error response text:', errorText);

                    if (errorText) {
                        try {
                            errorData = JSON.parse(errorText);
                            console.log('Parsed error data:', errorData);

                            if (errorData.message) {
                                errorMessage = errorData.message;
                            } else if (errorData.errors) {
                                const validationErrors = Object.entries(errorData.errors)
                                    .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                                    .join('; ');
                                errorMessage = `Validation errors: ${validationErrors}`;
                            }
                        } catch {
                            errorMessage = errorText;
                        }
                    }
                } catch (readError) {
                    console.error('Could not read error response:', readError);
                }

                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Promotion created successfully:', result);
            return result;
        } catch (error) {
            console.error('Error creating promotion:', error);
            throw error;
        }
    },

    updatePromotion: async (id: number, formData: FormData): Promise<PromotionDto> => {
        try {
            console.log('=== UPDATING PROMOTION ===');
            console.log('Promotion ID:', id);

            // Log all FormData entries
            console.log('=== FORM DATA ENTRIES ===');
            for (const [key, value] of formData.entries()) {
                console.log(`${key}:`, value, typeof value);
            }

            // Extract form data
            const name = formData.get('name') as string;
            const description = formData.get('description') as string;
            const discountPercentageStr = formData.get('discountPercentage') as string;
            const startDate = formData.get('startDate') as string;
            const endDate = formData.get('endDate') as string;
            const isActiveStr = formData.get('isActive') as string;
            const productIdsStr = formData.get('productIds') as string;

            // Optional fields with defaults
            const bannerImageUrl = formData.get('bannerImageUrl') as string || '';
            const colorScheme = formData.get('colorScheme') as string || '';
            const typeStr = formData.get('type') as string || '1'; // Default to FlashSale = 1

            // Validate required fields
            if (!name || !name.trim()) {
                throw new Error('Promotion name is required');
            }
            if (!startDate) {
                throw new Error('Start date is required');
            }
            if (!endDate) {
                throw new Error('End date is required');
            }
            if (!discountPercentageStr || isNaN(parseFloat(discountPercentageStr))) {
                throw new Error('Valid discount percentage is required');
            }

            const discountPercentage = parseFloat(discountPercentageStr);
            if (discountPercentage < 0 || discountPercentage > 100) {
                throw new Error('Discount percentage must be between 0 and 100');
            }

            // Parse dates
            const startDateTime = new Date(startDate);
            const endDateTime = new Date(endDate);

            if (isNaN(startDateTime.getTime())) {
                throw new Error('Invalid start date format');
            }
            if (isNaN(endDateTime.getTime())) {
                throw new Error('Invalid end date format');
            }
            if (endDateTime <= startDateTime) {
                throw new Error('End date must be after start date');
            }

            // Parse product IDs
            let productIds: number[] = [];
            if (productIdsStr) {
                try {
                    productIds = JSON.parse(productIdsStr);
                    if (!Array.isArray(productIds)) {
                        productIds = [];
                    }
                } catch (e) {
                    console.warn('Could not parse productIds, using empty array:', e);
                    productIds = [];
                }
            }

            // Parse type - must be valid enum value (1-6)
            let typeValue = parseInt(typeStr) || 1; // Default to FlashSale = 1
            if (typeValue < 1 || typeValue > 6) {
                typeValue = 1; // Reset to FlashSale if invalid
            }

            const promotionData = {
                name: name.trim(),
                description: description?.trim() || '',
                discountPercentage: discountPercentage,
                startDate: startDateTime.toISOString(),
                endDate: endDateTime.toISOString(),
                isActive: isActiveStr === 'true',
                bannerImageUrl: bannerImageUrl || '',    // ADD THIS
                type: typeValue,                         // ADD THIS
                colorScheme: colorScheme || '',          // ADD THIS
                productIds: productIds || []
            };

            console.log('=== PROMOTION DATA TO SEND ===');
            console.log(JSON.stringify(promotionData, null, 2));

            const response = await fetch(`${API_BASE_URL}/api/admin/promotions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(promotionData)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

                try {
                    const errorText = await response.text();
                    console.log('=== ERROR RESPONSE ===');
                    console.log('Error response text:', errorText);

                    if (errorText) {
                        try {
                            const errorDetails = JSON.parse(errorText);
                            console.log('Parsed error details:', errorDetails);

                            if (errorDetails.message) {
                                errorMessage = errorDetails.message;
                            } else if (errorDetails.errors) {
                                if (Array.isArray(errorDetails.errors)) {
                                    const errorMessages = errorDetails.errors.map((err: unknown) =>
                                        typeof err === 'string' ? err :
                                            (err && typeof err === 'object' && 'ErrorMessage' in err && 'Field' in err) ?
                                                `${(err as { Field: string }).Field}: ${(err as { ErrorMessage: string }).ErrorMessage}` :
                                                JSON.stringify(err)
                                    );
                                    errorMessage = `Validation errors: ${errorMessages.join('; ')}`;
                                } else if (typeof errorDetails.errors === 'object') {
                                    const fieldErrors = Object.entries(errorDetails.errors)
                                        .map(([field, errors]) => {
                                            const errorArray = Array.isArray(errors) ? errors : [errors];
                                            return `${field}: ${errorArray.join(', ')}`;
                                        });
                                    errorMessage = `Validation errors: ${fieldErrors.join('; ')}`;
                                }
                            }
                        } catch (parseError) {
                            console.error('Could not parse error response as JSON:', parseError);
                            errorMessage = errorText;
                        }
                    }
                } catch (readError) {
                    console.error('Could not read error response:', readError);
                }

                console.error('Final error message:', errorMessage);
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('=== PROMOTION UPDATED SUCCESSFULLY ===');
            console.log('Updated promotion:', result);
            return result;
        } catch (error) {
            console.error('=== ERROR UPDATING PROMOTION ===');
            console.error('Error details:', error);
            throw error;
        }
    },

    deletePromotion: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/promotions/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete promotion');
    },

    deleteProduct: async (id: number): Promise<void> => {
        console.log(`Attempting to delete product ${id}`);

        const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        console.log('Delete response status:', response.status);
        console.log('Delete response headers:', response.headers);

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            let errorDetails: Record<string, unknown> | null = null;

            try {
                // Try to get the error response body
                const responseText = await response.text();
                console.log('Delete error response:', responseText);

                if (responseText) {
                    try {
                        errorDetails = JSON.parse(responseText) as Record<string, unknown>;
                        console.log('Parsed delete error:', errorDetails);

                        // Extract meaningful error message
                        if (typeof errorDetails.message === 'string') {
                            errorMessage = errorDetails.message;
                        } else if (typeof errorDetails.error === 'string') {
                            errorMessage = errorDetails.error;
                        } else if (typeof errorDetails.title === 'string') {
                            errorMessage = errorDetails.title;
                        }
                    } catch {
                        // If JSON parsing fails, use the raw text
                        if (responseText.length < 200) {
                            errorMessage = responseText;
                        }
                    }
                }
            } catch (readError) {
                console.error('Could not read error response:', readError);
            }

            console.error('Delete product failed:', errorMessage);
            const error = new Error(errorMessage) as ExtendedError;
            error.details = errorDetails;
            error.status = response.status;
            throw error;
        }

        console.log('Product deleted successfully');
    },

    createProduct: async (formData: FormData): Promise<ProductDto> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
            method: 'POST',
            headers: {
                'Authorization': getAuthHeaders().Authorization
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    },

    updateProduct: async (id: number, formData: FormData): Promise<ProductDto> => {
        console.log(`Attempting to update product ${id}`);

        // Log all FormData entries
        console.log('=== FormData Contents ===');
        for (const [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }
        console.log('========================');

        const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': getAuthHeaders().Authorization
            },
            body: formData
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            let errorData: Record<string, unknown> | null = null;
            let errorText: string = '';

            try {
                // Try to get JSON error response
                const responseText = await response.text();
                console.log('Raw error response:', responseText);

                if (responseText) {
                    try {
                        errorData = JSON.parse(responseText) as Record<string, unknown>;
                        console.log('Parsed error data:', errorData);
                    } catch {
                        console.log('Could not parse error as JSON, using raw text');
                        errorText = responseText;
                    }
                }
            } catch (readError) {
                console.error('Could not read error response:', readError);
            }

            // Create detailed error message
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

            if (errorData) {
                // Handle different error response formats
                if (typeof errorData.message === 'string') {
                    errorMessage = errorData.message;
                } else if (typeof errorData.error === 'string') {
                    errorMessage = errorData.error;
                } else if (typeof errorData.title === 'string') {
                    errorMessage = errorData.title;
                } else if (errorData.errors && typeof errorData.errors === 'object') {
                    // Handle validation errors
                    const validationErrors: string[] = [];
                    const errors = errorData.errors as Record<string, unknown>;

                    for (const [field, fieldErrors] of Object.entries(errors)) {
                        if (Array.isArray(fieldErrors)) {
                            validationErrors.push(`${field}: ${fieldErrors.join(', ')}`);
                        } else if (typeof fieldErrors === 'string') {
                            validationErrors.push(`${field}: ${fieldErrors}`);
                        }
                    }
                    errorMessage = `Validation errors: ${validationErrors.join('; ')}`;
                } else {
                    errorMessage = JSON.stringify(errorData);
                }
            } else if (errorText) {
                errorMessage = errorText;
            }

            console.error('Update product failed:', errorMessage);

            // Create enhanced error with details
            const enhancedError = new Error(errorMessage) as ExtendedError;
            enhancedError.details = errorData;
            enhancedError.status = response.status;
            throw enhancedError;
        }

        const result = await response.json();
        console.log('Update successful:', result);
        return result;
    },

    getProduct: async (id: number): Promise<ProductDto> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    },

    // Coupon management methods
    getCoupons: async (): Promise<CouponDto[]> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/coupons`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    },

    getCoupon: async (id: number): Promise<CouponDto> => {
        const response = await fetch(`${API_BASE_URL}/api/admin/coupons/${id}`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    },

    createCoupon: async (couponData: {
        code: string;
        description: string;
        discountType: 'Percentage' | 'FixedAmount';
        discountAmount: number;
        minimumOrderAmount: number;
        startDate: string;
        endDate: string;
        usageLimit?: number;
        isActive: boolean;
    }): Promise<CouponDto> => {
        console.log('=== CREATING COUPON ===');
        console.log('Coupon data:', couponData);

        const response = await fetch(`${API_BASE_URL}/api/admin/coupons`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(couponData)
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

            try {
                const errorText = await response.text();
                console.log('Error response:', errorText);

                if (errorText) {
                    try {
                        const errorData = JSON.parse(errorText) as {
                            message?: string;
                            errors?: Record<string, string[] | string>;
                        };
                        if (errorData.message) {
                            errorMessage = errorData.message;
                        } else if (errorData.errors) {
                            const validationErrors = Object.entries(errorData.errors)
                                .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                                .join('; ');
                            errorMessage = `Validation errors: ${validationErrors}`;
                        }
                    } catch {
                        errorMessage = errorText;
                    }
                }
            } catch (readError) {
                console.error('Could not read error response:', readError);
            }

            throw new Error(errorMessage);
        }

        const result = await response.json() as CouponDto;
        console.log('Coupon created successfully:', result);
        return result;
    },

    updateCoupon: async (id: number, couponData: {
        code: string;
        description: string;
        discountType: 'Percentage' | 'FixedAmount';
        discountAmount: number;
        minimumOrderAmount: number;
        startDate: string;
        endDate: string;
        usageLimit?: number;
        isActive: boolean;
    }): Promise<CouponDto> => {
        console.log('=== UPDATING COUPON ===');
        console.log('Coupon ID:', id);
        console.log('Coupon data:', couponData);

        const response = await fetch(`${API_BASE_URL}/api/admin/coupons/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(couponData)
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

            try {
                const errorText = await response.text();
                console.log('Error response:', errorText);

                if (errorText) {
                    try {
                        const errorData = JSON.parse(errorText) as {
                            message?: string;
                            errors?: Record<string, string[] | string>;
                        };
                        if (errorData.message) {
                            errorMessage = errorData.message;
                        } else if (errorData.errors) {
                            const validationErrors = Object.entries(errorData.errors)
                                .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                                .join('; ');
                            errorMessage = `Validation errors: ${validationErrors}`;
                        }
                    } catch {
                        errorMessage = errorText;
                    }
                }
            } catch (readError) {
                console.error('Could not read error response:', readError);
            }

            throw new Error(errorMessage);
        }

        const result = await response.json() as CouponDto;
        console.log('Coupon updated successfully:', result);
        return result;
    },

    deleteCoupon: async (id: number): Promise<void> => {
        console.log(`Attempting to delete coupon ${id}`);

        const response = await fetch(`${API_BASE_URL}/api/admin/coupons/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        console.log('Delete response status:', response.status);

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            let errorDetails: Record<string, unknown> | null = null;

            try {
                const responseText = await response.text();
                console.log('Delete error response:', responseText);

                if (responseText) {
                    try {
                        errorDetails = JSON.parse(responseText) as Record<string, unknown>;
                        console.log('Parsed delete error:', errorDetails);

                        if (typeof errorDetails.message === 'string') {
                            errorMessage = errorDetails.message;
                        } else if (typeof errorDetails.error === 'string') {
                            errorMessage = errorDetails.error;
                        }
                    } catch {
                        if (responseText.length < 200) {
                            errorMessage = responseText;
                        }
                    }
                }
            } catch (readError) {
                console.error('Could not read error response:', readError);
            }

            console.error('Delete coupon failed:', errorMessage);
            const error = new Error(errorMessage) as ExtendedError;
            error.details = errorDetails;
            error.status = response.status;
            throw error;
        }

        console.log('Coupon deleted successfully');
    },

    toggleCouponVisibility: async (id: number): Promise<CouponDto> => {
        console.log(`Toggling visibility for coupon ${id}`);

        const response = await fetch(`${API_BASE_URL}/api/admin/coupons/${id}/toggle-visibility`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        console.log('Toggle response status:', response.status);

        if (!response.ok) {
            throw new Error(`Failed to toggle coupon visibility: ${response.status} ${response.statusText}`);
        }

        const result = await response.json() as CouponDto;
        console.log('Coupon visibility toggled successfully:', result);
        return result;
    }
};