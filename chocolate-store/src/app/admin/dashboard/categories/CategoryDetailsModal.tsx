// Updated CategoryDetailsModal.tsx with client-side filtering, product count, and images
'use client'

// Fixed import line - removed unused ImageOff icon
import React, { useEffect, useState } from 'react'
import { X, Tag, Package, Edit, Loader } from 'lucide-react'
import { CategoryDto } from '../types'
import { formatDate } from '../utils'

// Add these two functions inside your CategoryDetailsModal component (right after imports)

// Function to convert relative image paths to absolute URLs
const getImageUrl = (imageUrl: string | undefined | null): string => {
    if (!imageUrl || imageUrl.trim() === '') {
        return '';
    }

    const cleanImageUrl = imageUrl.trim();

    // If it's already a full URL, return as-is
    if (cleanImageUrl.startsWith('http://') ||
        cleanImageUrl.startsWith('https://') ||
        cleanImageUrl.startsWith('data:') ||
        cleanImageUrl.startsWith('blob:')) {
        return cleanImageUrl;
    }

    // If path includes /uploads/, extract the filename
    if (cleanImageUrl.includes('/uploads/')) {
        const parts = cleanImageUrl.split('/uploads/');
        const filename = parts[parts.length - 1];
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/uploads/${filename}`;
    }

    // Handle paths that start with uploads/
    if (cleanImageUrl.startsWith('uploads/')) {
        const filename = cleanImageUrl.substring(8);
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/uploads/${filename}`;
    }

    // For just a filename, append to API URL
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/uploads/${cleanImageUrl}`;
};

// Function to fix issues with image URLs using port 3000
const fixImageUrl = (url: string): string => {
    if (!url) return '';

    // Fix the common port 3000 issue
    if (url.includes(':3000/uploads/')) {
        return url.replace(':3000/uploads/', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/uploads/`);
    }

    // Fix URLs that might use relative paths
    if (url.startsWith('/uploads/')) {
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}${url}`;
    }

    return url;
};

// Add this type for related products
interface Product {
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
    sku?: string;
    categoryId: number; // Important for filtering
}

interface CategoryDetailsModalProps {
    category: CategoryDto | null
    isOpen: boolean
    onClose: () => void
    onEdit?: (category: CategoryDto) => void
}

export const CategoryDetailsModal: React.FC<CategoryDetailsModalProps> = ({
    category,
    isOpen,
    onClose,
    onEdit
}) => {
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [totalProductCount, setTotalProductCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch related products when the modal opens with a category
    useEffect(() => {
        if (isOpen && category) {
            fetchRelatedProducts(category.id);
        }
    }, [isOpen, category]);

    // Function to fetch related products - client-side filtering approach
    // Improved image debugging in fetchRelatedProducts function
    // This helps log URL information to troubleshoot image issues

    // Replace your fetchRelatedProducts function with this enhanced version:

    const fetchRelatedProducts = async (categoryId: number) => {
        try {
            setLoading(true);
            console.log(`Fetching all products to filter for category ${categoryId}...`);

            // Use the existing products endpoint that we know works
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/api/admin/products`;
            console.log(`API URL: ${apiUrl}`);

            const response = await fetch(apiUrl);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API responded with status ${response.status}: ${errorText}`);
                throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API response received');

            // Handle $values wrapper if it exists
            const allProducts = data.$values ? data.$values : data;

            // Filter products by category ID
            const filteredProducts = Array.isArray(allProducts)
                ? allProducts.filter(product => product.categoryId === categoryId)
                : [];

            console.log(`Filtered ${filteredProducts.length} products for category ${categoryId}`);

            // Debug: Check first product's image URL if available
            if (filteredProducts.length > 0 && filteredProducts[0].imageUrl) {
                console.log('First product image URL:', filteredProducts[0].imageUrl);
                console.log('Processed URL:', fixImageUrl(getImageUrl(filteredProducts[0].imageUrl)));
            }

            // Set total product count for the category
            setTotalProductCount(filteredProducts.length);

            // Take only the first 5 products for display
            const limitedProducts = filteredProducts.slice(0, 5);
            setRelatedProducts(limitedProducts);
        } catch (error) {
            console.error('Error fetching related products:', error);
            setRelatedProducts([]);
            setTotalProductCount(0);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !category) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-600/20 rounded-lg">
                                <Tag className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {category.name}
                                </h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(category)}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Basic Info */}
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Basic Information</h3>
                                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Category ID:</span>
                                        <span className="text-white font-mono">#{category.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Status:</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Products:</span>
                                        <span className="text-white font-medium">{totalProductCount}</span>
                                    </div>
                                    {category.createdAt && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Created:</span>
                                            <span className="text-white">
                                                {formatDate(category.createdAt)}
                                            </span>
                                        </div>
                                    )}
                                    {category.updatedAt && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Last Updated:</span>
                                            <span className="text-white">
                                                {formatDate(category.updatedAt)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Description and Additional Details */}
                        <div className="space-y-6">
                            {/* Description */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                                <div className="bg-gray-800 rounded-lg p-4">
                                    {category.description ? (
                                        <p className="text-gray-300 leading-relaxed">
                                            {category.description}
                                        </p>
                                    ) : (
                                        <p className="text-gray-500 italic">No description provided</p>
                                    )}
                                </div>
                            </div>

                            {/* Related Products Preview - Now with actual products and images */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">
                                    Related Products
                                </h3>
                                <div className="bg-gray-800 rounded-lg p-4">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader className="h-8 w-8 text-emerald-400 animate-spin" />
                                        </div>
                                    ) : relatedProducts.length > 0 ? (
                                        <div className="space-y-3">
                                            {relatedProducts.map(product => (
                                                <div key={product.id} className="bg-gray-700 rounded p-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {/* Product Image */}
                                                        {/* Product Image */}
                                                        <div className="w-12 h-12 bg-gray-800 rounded overflow-hidden flex items-center justify-center">
                                                            {product.imageUrl ? (
                                                                <>
                                                                    <img
                                                                        src={fixImageUrl(getImageUrl(product.imageUrl))}
                                                                        alt={product.name}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            console.error(`Failed to load image for ${product.name}: ${product.imageUrl}`);
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.style.display = 'none';
                                                                            const fallbackEl = target.nextElementSibling;
                                                                            if (fallbackEl) {
                                                                                fallbackEl.classList.remove('hidden');
                                                                            }
                                                                        }}
                                                                        onLoad={() => console.log(`Product image loaded: ${product.name}`)}
                                                                    />
                                                                    <div className="hidden absolute">
                                                                        <Package className="h-8 w-8 text-gray-600" />
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <Package className="h-8 w-8 text-gray-600" />
                                                            )}
                                                        </div>                                                        <div>
                                                            <div className="text-white font-medium">{product.name}</div>
                                                            {product.sku && (
                                                                <div className="text-xs text-gray-400">SKU: {product.sku}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-emerald-400 font-semibold">
                                                        ${product.price.toFixed(2)}
                                                    </div>
                                                </div>
                                            ))}

                                            {totalProductCount > relatedProducts.length && (
                                                <div className="text-center text-sm text-gray-400 pt-2">
                                                    + {totalProductCount - relatedProducts.length} more products
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-center">
                                                <Package className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                                                <p className="text-gray-500">
                                                    No products in this category
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Additional Metadata */}
                            {(category.slug || category.seoTitle || category.seoDescription) && (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">SEO & Metadata</h3>
                                    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                                        {category.slug && (
                                            <div>
                                                <span className="text-gray-400 text-sm">Slug:</span>
                                                <p className="text-white font-mono">{category.slug}</p>
                                            </div>
                                        )}
                                        {category.seoTitle && (
                                            <div>
                                                <span className="text-gray-400 text-sm">SEO Title:</span>
                                                <p className="text-white">{category.seoTitle}</p>
                                            </div>
                                        )}
                                        {category.seoDescription && (
                                            <div>
                                                <span className="text-gray-400 text-sm">SEO Description:</span>
                                                <p className="text-gray-300 text-sm">{category.seoDescription}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-700">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(category)}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <Edit className="h-4 w-4" />
                                Edit Category
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-colors border border-gray-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}