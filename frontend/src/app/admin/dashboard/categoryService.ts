// categoryService.ts - Updated version
import { CategoryDto, CategoryCreateUpdateDto, ExtendedError } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'

// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Enhanced helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        let errorDetails = null

        try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
            errorDetails = errorData.details || errorData
        } catch {
            // Ignore parsing error, use the status text
            errorMessage = response.statusText || errorMessage
        }

        const error = new Error(errorMessage) as ExtendedError
        error.status = response.status
        error.details = errorDetails
        throw error
    }

    try {
        const data = await response.json()

        // Handle the $values wrapper that might come from your API
        if (data && typeof data === 'object' && '$values' in data) {
            return data.$values as T
        }

        return data as T
    } catch {
        throw new Error('Failed to parse response as JSON')
    }
}

export const categoryService = {
    async getAllCategories(): Promise<CategoryDto[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
                method: 'GET',
                headers: getAuthHeaders()
            })

            return await handleApiResponse<CategoryDto[]>(response)
        } catch (error) {
            console.error('Error fetching categories:', error)
            throw error
        }
    },

    async getCategoryById(id: number): Promise<CategoryDto> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
                method: 'GET',
                headers: getAuthHeaders()
            })

            return await handleApiResponse<CategoryDto>(response)
        } catch (error) {
            console.error('Error fetching category:', error)
            throw error
        }
    },

    async createCategory(formData: FormData): Promise<CategoryDto> {
        try {
            // Convert FormData to CategoryCreateUpdateDto
            const categoryData: CategoryCreateUpdateDto = {
                name: formData.get('name') as string,
                description: formData.get('description') as string || undefined
                // Removed isActive
            }

            // For now, sending as JSON. You might need to send as FormData if image upload is involved
            const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(categoryData)
            })

            return await handleApiResponse<CategoryDto>(response)
        } catch (error) {
            console.error('Error creating category:', error)
            throw error
        }
    },

    async updateCategory(id: number, formData: FormData): Promise<CategoryDto> {
        try {
            // Convert FormData to CategoryCreateUpdateDto
            const categoryData: CategoryCreateUpdateDto = {
                name: formData.get('name') as string,
                description: formData.get('description') as string || undefined
                // Removed isActive
            }

            // For now, sending as JSON. You might need to send as FormData if image upload is involved
            const response = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(categoryData)
            })

            return await handleApiResponse<CategoryDto>(response)
        } catch (error) {
            console.error('Error updating category:', error)
            throw error
        }
    },

    async deleteCategory(id: number): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': getAuthHeaders().Authorization
                }
            })

            if (!response.ok) {
                let errorMessage = `Failed to delete category: ${response.status}`
                let errorDetails = null

                try {
                    const errorData = await response.json()
                    errorMessage = errorData.message || errorMessage
                    errorDetails = errorData.details || errorData
                } catch {
                    // Ignore parsing error
                    errorMessage = response.statusText || errorMessage
                }

                const error = new Error(errorMessage) as ExtendedError
                error.status = response.status
                error.details = errorDetails
                throw error
            }

            // Delete request successful (204 No Content expected)
        } catch (error) {
            console.error('Error deleting category:', error)
            throw error
        }
    },

    // Additional utility method to get categories for dropdowns
    async getActiveCategoriesForDropdown(): Promise<{ id: number; name: string }[]> {
        try {
            const categories = await this.getAllCategories()
            return categories
                // Removed isActive filter
                .map(cat => ({ id: cat.id, name: cat.name }))
                .sort((a, b) => a.name.localeCompare(b.name))
        } catch (error) {
            console.error('Error fetching categories for dropdown:', error)
            throw error
        }
    }
}