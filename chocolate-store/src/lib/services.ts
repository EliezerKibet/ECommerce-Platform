import api from './api';
import { Product, ProductDtoPagedResult, Category, Cart } from '../types';
import axios from 'axios';

// Define interfaces for API responses
interface AuthResponse {
    token: string;
}

// Define interfaces for API responses
interface AuthResponse {
    token: string;
}

interface CartOperationResponse {
    success: boolean;
    message?: string;
    items?: Cart['items'];
    totalItems?: number;
    subtotal?: number;
}

// Helper type for product items in response
interface ProductResponse {
    Product?: Product;
    IsFavorite?: boolean;
    [key: string]: unknown;
}

// Helper function to extract data from ASP.NET Core JSON response
function extractDotNetResponseData<T>(response: unknown): T[] {
    // Check if response is an object and has the expected structure
    if (typeof response === 'object' && response !== null) {
        const responseObj = response as Record<string, unknown>;

        // Check if it's the ASP.NET Core format with $id and $values
        if ('$values' in responseObj && Array.isArray(responseObj.$values)) {
            return responseObj.$values as T[];
        }

        // If it has no $values but has values, try that
        if ('values' in responseObj && Array.isArray(responseObj.values)) {
            return responseObj.values as T[];
        }
    }

    // If it's already an array, return it
    if (Array.isArray(response)) {
        return response as T[];
    }

    // Return empty array as fallback
    return [];
}


// Auth services
export async function login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/api/Auth/login', { email, password });
    return response.data;
}

// Enhanced register function for lib/services.ts

export async function register(userData: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
}): Promise<AuthResponse> {
    console.log('=== REGISTER SERVICE DEBUG ===');
    console.log('API Base URL:', api.defaults.baseURL);
    console.log('Request data (sanitized):', {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordLength: userData.password?.length || 0,
        confirmPasswordLength: userData.confirmPassword?.length || 0,
        fieldsPresent: Object.keys(userData).reduce((acc, key) => {
            acc[key] = !!userData[key as keyof typeof userData];
            return acc;
        }, {} as Record<string, boolean>)
    });

    try {
        const response = await api.post('/api/Auth/register', userData);
        console.log('Registration success response:', response.data);
        return response.data;
    } catch (error: unknown) {
        console.error('=== REGISTRATION SERVICE ERROR ===');

        if (axios.isAxiosError(error)) {
            console.error('Axios Error Details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                headers: error.response?.headers,
                url: error.config?.url,
                method: error.config?.method,
                requestData: error.config?.data
            });

            // Log specific validation errors if they exist
            if (error.response?.data) {
                const responseData = error.response.data;

                if (typeof responseData === 'object' && responseData !== null) {
                    console.error('Response data structure:', Object.keys(responseData));

                    // Check for ModelState errors (ASP.NET Core validation)
                    if ('errors' in responseData) {
                        console.error('Validation errors found:', responseData.errors);

                        // Handle ASP.NET Core $values format
                        const errors = responseData.errors;
                        if (typeof errors === 'object' && errors !== null) {
                            if ('$values' in errors && Array.isArray(errors.$values)) {
                                // ASP.NET Core format with $values array
                                console.error('ASP.NET Core $values errors:', errors.$values);
                                // The $values array contains the actual error objects
                                const errorMessages: string[] = [];
                                errors.$values.forEach((errorObj: unknown) => {
                                    if (typeof errorObj === 'object' && errorObj !== null) {
                                        // Each error object might have description or other properties
                                        if ('description' in errorObj && typeof errorObj.description === 'string') {
                                            errorMessages.push(errorObj.description);
                                        } else if ('code' in errorObj && 'description' in errorObj) {
                                            const errObj = errorObj as { code: string; description: string };
                                            errorMessages.push(`${errObj.code}: ${errObj.description}`);
                                        } else {
                                            // Fallback: stringify the error object
                                            errorMessages.push(String(errorObj));
                                        }
                                    } else if (typeof errorObj === 'string') {
                                        errorMessages.push(errorObj);
                                    }
                                });

                                if (errorMessages.length > 0) {
                                    console.error('Extracted error messages:', errorMessages);
                                    throw new Error(errorMessages.join(', '));
                                }
                            } else {
                                // Standard object format
                                const errorMessages: string[] = [];
                                Object.entries(errors).forEach(([, messages]) => {
                                    if (Array.isArray(messages)) {
                                        errorMessages.push(...messages.map(String));
                                    } else {
                                        errorMessages.push(String(messages));
                                    }
                                });

                                if (errorMessages.length > 0) {
                                    throw new Error(errorMessages.join(', '));
                                }
                            }
                        }
                    }

                    if ('message' in responseData && typeof responseData.message === 'string') {
                        console.error('Error message:', responseData.message);
                    }
                }
            }
        } else if (error instanceof Error) {
            console.error('Error instance:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
        } else {
            console.error('Unknown error type:', error);
        }

        console.error('=== END SERVICE ERROR ===');
        throw error;
    }
}

// Product services
export async function getProducts(page = 1, pageSize = 12): Promise<ProductDtoPagedResult> {
    try {
        const response = await api.get(`/api/products?page=${page}&pageSize=${pageSize}`);

        // Create a default paged result object with all required properties
        const defaultPagedResult: ProductDtoPagedResult = {
            items: [],
            totalPages: 1,
            totalItems: 0,
            pageNumber: page,
            pageSize: pageSize,
            hasPreviousPage: page > 1,
            hasNextPage: false
        };

        // Handle .NET response format with $id and $values
        if (response.data && response.data.$values) {
            const products = extractDotNetResponseData<Product>(response.data);

            return {
                ...defaultPagedResult,
                items: products,
                totalItems: products.length,
                hasNextPage: false
            };
        }
        // Check if response is an array of enhanced products
        else if (Array.isArray(response.data)) {
            // Transform data from { Product: {...}, IsFavorite: boolean } format to expected format
            const products = response.data.map((item: ProductResponse) => {
                // Ensure we're returning a Product, not a ProductResponse
                return (item.Product as Product) || (item as unknown as Product);
            });

            return {
                ...defaultPagedResult,
                items: products,
                totalItems: products.length,
                hasNextPage: false
            };
        }
        // Check if response has the enhanced product array in a property
        else if (response.data && Array.isArray(response.data.enhancedProducts)) {
            const products = response.data.enhancedProducts.map((item: ProductResponse) => {
                // Ensure we're returning a Product, not a ProductResponse
                return (item.Product as Product) || (item as unknown as Product);
            });

            return {
                ...defaultPagedResult,
                items: products,
                totalItems: products.length,
                totalPages: response.data.totalPages || 1,
                pageNumber: response.data.currentPage || page,
                hasNextPage: (response.data.currentPage || page) < (response.data.totalPages || 1)
            };
        }
        // Check if response already has items property with array
        else if (response.data && Array.isArray(response.data.items)) {
            // Use the response values if available, or fall back to defaults
            return {
                ...defaultPagedResult,
                items: response.data.items,
                totalItems: response.data.totalItems || response.data.items.length,
                totalPages: response.data.totalPages || 1,
                pageNumber: response.data.pageNumber || response.data.currentPage || page,
                pageSize: response.data.pageSize || pageSize,
                hasPreviousPage: response.data.hasPreviousPage !== undefined
                    ? response.data.hasPreviousPage
                    : (response.data.pageNumber || page) > 1,
                hasNextPage: response.data.hasNextPage !== undefined
                    ? response.data.hasNextPage
                    : (response.data.pageNumber || page) < (response.data.totalPages || 1)
            };
        }
        // Fallback to original response
        else {
            console.warn('Unexpected API response format from getProducts:', response.data);
            return defaultPagedResult;
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        // Return empty paged result with all required properties
        return {
            items: [],
            totalPages: 1,
            totalItems: 0,
            pageNumber: page,
            pageSize: pageSize,
            hasPreviousPage: false,
            hasNextPage: false
        };
    }
}

export async function getProductById(id: number): Promise<Product> {
    try {
        const response = await api.get(`/api/products/${id}`);

        // If response is wrapped in a Product property
        if (response.data && response.data.Product) {
            return response.data.Product;
        }

        return response.data;
    } catch (error) {
        console.error(`Error fetching product ${id}:`, error);
        throw error;
    }
}

export async function getProductsByCategory(categoryId: number, page = 1, pageSize = 12): Promise<ProductDtoPagedResult> {
    try {
        const response = await api.get(`/api/products/category/${categoryId}?page=${page}&pageSize=${pageSize}`);

        // Create a default paged result object with all required properties
        const defaultPagedResult: ProductDtoPagedResult = {
            items: [],
            totalPages: 1,
            totalItems: 0,
            pageNumber: page,
            pageSize: pageSize,
            hasPreviousPage: page > 1,
            hasNextPage: false
        };

        // Handle .NET response format with $id and $values
        if (response.data && response.data.$values) {
            const products = extractDotNetResponseData<Product>(response.data);

            return {
                ...defaultPagedResult,
                items: products,
                totalItems: products.length,
                hasNextPage: false
            };
        }
        // Check if response is an array of enhanced products
        else if (Array.isArray(response.data)) {
            // Transform data from { Product: {...}, IsFavorite: boolean } format to expected format
            const products = response.data.map((item: ProductResponse) => {
                // Ensure we're returning a Product, not a ProductResponse
                return (item.Product as Product) || (item as unknown as Product);
            });

            return {
                ...defaultPagedResult,
                items: products,
                totalItems: products.length,
                hasNextPage: false
            };
        }
        // Check if response has the expected format
        else if (response.data && Array.isArray(response.data.items)) {
            // Use the response values if available, or fall back to defaults
            return {
                ...defaultPagedResult,
                items: response.data.items,
                totalItems: response.data.totalItems || response.data.items.length,
                totalPages: response.data.totalPages || 1,
                pageNumber: response.data.pageNumber || response.data.currentPage || page,
                pageSize: response.data.pageSize || pageSize,
                hasPreviousPage: response.data.hasPreviousPage !== undefined
                    ? response.data.hasPreviousPage
                    : (response.data.pageNumber || page) > 1,
                hasNextPage: response.data.hasNextPage !== undefined
                    ? response.data.hasNextPage
                    : (response.data.pageNumber || page) < (response.data.totalPages || 1)
            };
        }
        // Fallback to empty result
        else {
            console.warn('Unexpected API response format from getProductsByCategory:', response.data);
            return defaultPagedResult;
        }
    } catch (error) {
        console.error(`Error fetching products for category ${categoryId}:`, error);
        return {
            items: [],
            totalPages: 1,
            totalItems: 0,
            pageNumber: page,
            pageSize: pageSize,
            hasPreviousPage: false,
            hasNextPage: false
        };
    }
}

// Category services
export async function getCategories(): Promise<Category[]> {
    try {
        const response = await api.get('/api/admin/categories');

        // Handle .NET response format with $id and $values
        if (response.data && response.data.$values) {
            return extractDotNetResponseData<Category>(response.data);
        }
        // Ensure the response is an array
        else if (Array.isArray(response.data)) {
            return response.data;
        } else if (response.data && Array.isArray(response.data.categories)) {
            return response.data.categories;
        } else {
            console.warn('Unexpected API response format from getCategories:', response.data);
            return [];
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

// Cart services
export async function getCart(): Promise<Cart> {
    const response = await api.get('/api/Carts');
    return response.data;
}

export async function addToCart(productId: number, quantity: number): Promise<CartOperationResponse> {
    const response = await api.post('/api/Carts/items', { productId, quantity });
    return response.data;
}

export async function updateCartItem(itemId: number, quantity: number): Promise<CartOperationResponse> {
    const response = await api.put(`/api/Carts/items/${itemId}`, { quantity });
    return response.data;
}

export async function removeFromCart(itemId: number): Promise<CartOperationResponse> {
    const response = await api.delete(`/api/Carts/items/${itemId}`);
    return response.data;
}