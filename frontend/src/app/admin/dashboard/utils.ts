// Complete utils.ts with all required functions

// Make sure to use NEXT_PUBLIC_API_URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Formatting functions
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const formatDatetime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const copyToClipboard = async (text: string): Promise<void> => {
    try {
        await navigator.clipboard.writeText(text);
        console.log('Copied to clipboard:', text);
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
    }
};

// Improved image URL handling function
export const getImageUrl = (imageUrl: string | undefined | null): string => {
    // Guard clause for empty/null URLs
    if (!imageUrl || imageUrl.trim() === '') {
        return '';
    }
    // Clean up the URL
    const cleanImageUrl = imageUrl.trim();
    // If it's already a full URL, return as-is
    if (cleanImageUrl.startsWith('http://') ||
        cleanImageUrl.startsWith('https://') ||
        cleanImageUrl.startsWith('data:') ||
        cleanImageUrl.startsWith('blob:')) {
        return cleanImageUrl;
    }
    // If API_BASE_URL isn't defined (which shouldn't happen), use a default
    const baseUrl = API_BASE_URL || 'http://localhost:5202';
    // Handle paths that might already have /uploads/
    if (cleanImageUrl.includes('/uploads/')) {
        // Extract just the filename from the path
        const parts = cleanImageUrl.split('/uploads/');
        const filename = parts[parts.length - 1];
        return `${baseUrl}/uploads/${filename}`;
    }
    // Handle paths that might start with uploads/
    if (cleanImageUrl.startsWith('uploads/')) {
        const filename = cleanImageUrl.substring(8); // Remove 'uploads/'
        return `${baseUrl}/uploads/${filename}`;
    }
    // For just a filename, append to base URL with /uploads/
    return `${baseUrl}/uploads/${cleanImageUrl}`;
};

/**
 * Detects and fixes common image URL issues
 * Particularly useful for fixing port 3000 errors
 */
export const fixImageUrl = (url: string): string => {
    if (!url) return '';

    // Fix the common port 3000 issue
    if (url.includes(':3000/uploads/')) {
        // Replace port 3000 with the correct API port
        return url.replace(':3000/uploads/', `${API_BASE_URL}/uploads/`);
    }

    // Fix URLs that might use relative paths
    if (url.startsWith('/uploads/')) {
        return `${API_BASE_URL}${url}`;
    }

    return url;
};

// Helper function to get a fallback/placeholder image URL
export const getPlaceholderImageUrl = (): string => {
    // This should point to a placeholder image in your Next.js public folder
    return '/images/placeholder.jpg';
};

// Enhanced function that provides fallback handling
export const getImageUrlWithFallback = (imageUrl: string | undefined | null): string => {
    const url = getImageUrl(imageUrl);
    return url || getPlaceholderImageUrl();
};

// Helper function to check if an image URL is valid
export const isImageUrlValid = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
        if (!url) {
            resolve(false);
            return;
        }

        const img = new Image();

        // Set a timeout to avoid hanging on slow networks
        const timeout = setTimeout(() => {
            resolve(false);
        }, 5000);

        img.onload = () => {
            clearTimeout(timeout);
            resolve(true);
        };

        img.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
        };

        // Handle CORS issues
        img.crossOrigin = 'anonymous';
        img.src = url;
    });
};

// Function to validate and get the best available image URL
export const getValidImageUrl = async (imageUrl: string | undefined | null): Promise<string> => {
    const primaryUrl = getImageUrl(imageUrl);

    if (!primaryUrl) {
        return getPlaceholderImageUrl();
    }

    const isValid = await isImageUrlValid(primaryUrl);
    return isValid ? primaryUrl : getPlaceholderImageUrl();
};

// Generic export function that handles any data structure
export const exportData = (data: unknown[], filename: string): void => {
    const csv = convertToCSV(data);
    downloadCSV(csv, filename);
};

export const convertToCSV = (data: unknown[]): string => {
    if (data.length === 0) return '';

    // Helper function to flatten objects for CSV export
    const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, string> => {
        const flattened: Record<string, string> = {};

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                const newKey = prefix ? `${prefix}_${key}` : key;

                if (value === null || value === undefined) {
                    flattened[newKey] = '';
                } else if (Array.isArray(value)) {
                    // For arrays, just show the count or join simple values
                    if (value.length === 0) {
                        flattened[newKey] = '';
                    } else if (typeof value[0] === 'object') {
                        flattened[newKey] = `${value.length} items`;
                    } else {
                        flattened[newKey] = value.join('; ');
                    }
                } else if (value instanceof Date) {
                    flattened[newKey] = value.toISOString();
                } else if (typeof value === 'object') {
                    // For nested objects, flatten them
                    const nested = flattenObject(value as Record<string, unknown>, newKey);
                    Object.assign(flattened, nested);
                } else {
                    flattened[newKey] = String(value);
                }
            }
        }
        return flattened;
    };

    // Flatten all objects in the array
    const flattenedData = data.map(item => {
        // Type guard to ensure item is an object before flattening
        if (item && typeof item === 'object' && !Array.isArray(item)) {
            return flattenObject(item as Record<string, unknown>);
        }
        // Handle primitive values
        return { value: String(item) };
    });

    if (flattenedData.length === 0) return '';

    // Get all unique headers
    const allHeaders = new Set<string>();
    flattenedData.forEach(item => {
        Object.keys(item).forEach(header => allHeaders.add(header));
    });

    const headers = Array.from(allHeaders).sort();
    const headerRow = headers.join(',');

    // Create CSV rows
    const rows = flattenedData.map(item =>
        headers.map(header => {
            const value = item[header] || '';
            // Escape quotes and wrap in quotes if contains comma or quotes
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',')
    );

    return [headerRow, ...rows].join('\n');
};

export const downloadCSV = (csv: string, filename: string): void => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};

// Period options for sales analysis
export const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'thismonth', label: 'This Month' },
    { value: 'lastmonth', label: 'Last Month' },
    { value: 'thisyear', label: 'This Year' },
    { value: 'lastyear', label: 'Last Year' },
    { value: 'alltime', label: 'All Time' }
];