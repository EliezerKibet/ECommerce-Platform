const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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

export const getImageUrl = (imageUrl: string | undefined | null): string => {
    if (!imageUrl || imageUrl.trim() === '') {
        return '';
    }
    const cleanImageUrl = imageUrl.trim();
    if (cleanImageUrl.startsWith('http://') ||
        cleanImageUrl.startsWith('https://') ||
        cleanImageUrl.startsWith('data:') ||
        cleanImageUrl.startsWith('blob:')) {
        return cleanImageUrl;
    }
    const baseUrl = API_BASE_URL || 'http://localhost:5202';
    if (cleanImageUrl.includes('/uploads/')) {
        const parts = cleanImageUrl.split('/uploads/');
        const filename = parts[parts.length - 1];
        return `${baseUrl}/uploads/${filename}`;
    }
    if (cleanImageUrl.startsWith('uploads/')) {
        const filename = cleanImageUrl.substring(8); 
        return `${baseUrl}/uploads/${filename}`;
    }
    return `${baseUrl}/uploads/${cleanImageUrl}`;
};

export const fixImageUrl = (url: string): string => {
    if (!url) return '';

    if (url.includes(':3000/uploads/')) {
        return url.replace(':3000/uploads/', `${API_BASE_URL}/uploads/`);
    }

    if (url.startsWith('/uploads/')) {
        return `${API_BASE_URL}${url}`;
    }

    return url;
};

export const getPlaceholderImageUrl = (): string => {
    return '/images/placeholder.jpg';
};

export const getImageUrlWithFallback = (imageUrl: string | undefined | null): string => {
    const url = getImageUrl(imageUrl);
    return url || getPlaceholderImageUrl();
};

export const isImageUrlValid = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
        if (!url) {
            resolve(false);
            return;
        }

        const img = new Image();

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

export const getValidImageUrl = async (imageUrl: string | undefined | null): Promise<string> => {
    const primaryUrl = getImageUrl(imageUrl);

    if (!primaryUrl) {
        return getPlaceholderImageUrl();
    }

    const isValid = await isImageUrlValid(primaryUrl);
    return isValid ? primaryUrl : getPlaceholderImageUrl();
};

export const exportData = (data: unknown[], filename: string): void => {
    const csv = convertToCSV(data);
    downloadCSV(csv, filename);
};

export const convertToCSV = (data: unknown[]): string => {
    if (data.length === 0) return '';

    const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, string> => {
        const flattened: Record<string, string> = {};

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                const newKey = prefix ? `${prefix}_${key}` : key;

                if (value === null || value === undefined) {
                    flattened[newKey] = '';
                } else if (Array.isArray(value)) {
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
                    const nested = flattenObject(value as Record<string, unknown>, newKey);
                    Object.assign(flattened, nested);
                } else {
                    flattened[newKey] = String(value);
                }
            }
        }
        return flattened;
    };

    const flattenedData = data.map(item => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
            return flattenObject(item as Record<string, unknown>);
        }
        return { value: String(item) };
    });

    if (flattenedData.length === 0) return '';

    const allHeaders = new Set<string>();
    flattenedData.forEach(item => {
        Object.keys(item).forEach(header => allHeaders.add(header));
    });

    const headers = Array.from(allHeaders).sort();
    const headerRow = headers.join(',');

    const rows = flattenedData.map(item =>
        headers.map(header => {
            const value = item[header] || '';
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