// src/services/shippingAddressService.ts - Fixed to handle ASP.NET JSON format
interface ShippingAddress {
    id?: number;
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
    phoneNumber?: string;
    email?: string;
    isDefault?: boolean;
    useCount?: number;
    userId?: string;
}

interface ApiResponse<T> {
    data?: T;
    error?: string;
    success: boolean;
}

interface DebugApiResponse {
    userId: string;
    isAuthenticated: boolean;
    cookies: Record<string, string>;
    claims: Record<string, string>;
}

// Interface to handle ASP.NET Core's JSON format with $id and $values
interface AspNetJsonResponse<T> {
    $id?: string;
    $values?: T[];
}

class ShippingAddressService {
    private readonly API_BASE_URL: string;

    constructor() {
        this.API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202';
        console.log('ShippingAddressService initialized with API_BASE_URL:', this.API_BASE_URL);
    }

    private getAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';');
            const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
            if (tokenCookie) {
                const token = tokenCookie.split('=')[1];
                headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            }
        }

        return headers;
    }

    private extractDataFromAspNetResponse<T>(data: T | AspNetJsonResponse<T>): T {
        // Check if this is ASP.NET's JSON format with $values
        if (data && typeof data === 'object' && '$values' in data) {
            console.log('Detected ASP.NET JSON format, extracting $values');
            return (data as AspNetJsonResponse<T>).$values as T;
        }

        // Otherwise return data as-is
        return data as T;
    }

    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        try {
            console.log(`API Response Status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                return {
                    success: false,
                    error: errorText || `HTTP error! status: ${response.status}`
                };
            }

            const rawData = await response.json();
            console.log('Raw API Response:', rawData);

            // Extract data from ASP.NET's JSON format if needed
            const processedData = this.extractDataFromAspNetResponse<T>(rawData);
            console.log('Processed API Response:', processedData);

            return {
                success: true,
                data: processedData
            };
        } catch (error) {
            console.error('Response handling error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async getAddresses(): Promise<ApiResponse<ShippingAddress[]>> {
        try {
            console.log('Fetching addresses from:', `${this.API_BASE_URL}/api/shipping-addresses`);

            const response = await fetch(`${this.API_BASE_URL}/api/shipping-addresses`, {
                method: 'GET',
                credentials: 'include',
                headers: this.getAuthHeaders()
            });

            return await this.handleResponse<ShippingAddress[]>(response);
        } catch (error) {
            console.error('Network error in getAddresses:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch addresses'
            };
        }
    }

    async getAddressById(id: number): Promise<ApiResponse<ShippingAddress>> {
        try {
            console.log('Fetching address by ID:', id);

            const response = await fetch(`${this.API_BASE_URL}/api/shipping-addresses/${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: this.getAuthHeaders()
            });

            return await this.handleResponse<ShippingAddress>(response);
        } catch (error) {
            console.error('Network error in getAddressById:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch address'
            };
        }
    }

    async createAddress(address: ShippingAddress): Promise<ApiResponse<ShippingAddress>> {
        try {
            console.log('Creating address:', address);

            const response = await fetch(`${this.API_BASE_URL}/api/shipping-addresses`, {
                method: 'POST',
                credentials: 'include',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(address)
            });

            return await this.handleResponse<ShippingAddress>(response);
        } catch (error) {
            console.error('Network error in createAddress:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create address'
            };
        }
    }

    async updateAddress(id: number, address: ShippingAddress): Promise<ApiResponse<ShippingAddress>> {
        try {
            console.log('Updating address:', id, address);

            const response = await fetch(`${this.API_BASE_URL}/api/shipping-addresses/${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(address)
            });

            return await this.handleResponse<ShippingAddress>(response);
        } catch (error) {
            console.error('Network error in updateAddress:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update address'
            };
        }
    }

    async deleteAddress(id: number): Promise<ApiResponse<boolean>> {
        try {
            console.log('Deleting address:', id);

            const response = await fetch(`${this.API_BASE_URL}/api/shipping-addresses/${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: this.getAuthHeaders()
            });

            console.log(`Delete response status: ${response.status}`);

            if (response.ok) {
                return { success: true, data: true };
            } else {
                const errorText = await response.text();
                console.error('Delete error response:', errorText);
                return {
                    success: false,
                    error: errorText || 'Failed to delete address'
                };
            }
        } catch (error) {
            console.error('Network error in deleteAddress:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete address'
            };
        }
    }

    async setDefaultAddress(id: number): Promise<ApiResponse<ShippingAddress>> {
        try {
            console.log('Setting default address:', id);

            const response = await fetch(`${this.API_BASE_URL}/api/shipping-addresses/${id}/default`, {
                method: 'POST',
                credentials: 'include',
                headers: this.getAuthHeaders()
            });

            return await this.handleResponse<ShippingAddress>(response);
        } catch (error) {
            console.error('Network error in setDefaultAddress:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to set default address'
            };
        }
    }

    // Debug method to test the API connection
    async debugApi(): Promise<ApiResponse<DebugApiResponse>> {
        try {
            console.log('Debug API call to:', `${this.API_BASE_URL}/api/shipping-addresses/debug`);

            const response = await fetch(`${this.API_BASE_URL}/api/shipping-addresses/debug`, {
                method: 'GET',
                credentials: 'include',
                headers: this.getAuthHeaders()
            });

            return await this.handleResponse<DebugApiResponse>(response);
        } catch (error) {
            console.error('Network error in debugApi:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Debug API call failed'
            };
        }
    }
}

export default new ShippingAddressService();
export type { ShippingAddress, ApiResponse, DebugApiResponse };