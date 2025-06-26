// ProductDetailsModal.tsx - Clean component without example usage


import React from 'react';
import { X, Package, Warehouse, Calendar, Globe, Coffee, Leaf, Award, AlertTriangle } from 'lucide-react';
import { ProductDto } from '../types';
import { formatCurrency } from '../utils';

interface ProductDetailsModalProps {
    product: ProductDto | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
    product,
    isOpen,
    onClose
}) => {
    if (!isOpen || !product) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStockStatus = (quantity: number) => {
        if (quantity === 0) return { color: 'text-red-400', bg: 'bg-red-900/20', text: 'Out of Stock' };
        if (quantity < 10) return { color: 'text-yellow-400', bg: 'bg-yellow-900/20', text: 'Low Stock' };
        return { color: 'text-green-400', bg: 'bg-green-900/20', text: 'In Stock' };
    };

    const getImageUrl = (imageUrl: string | undefined): string | undefined => {
        if (!imageUrl) return undefined;

        // If it's already a full URL, return as-is
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }

        // If it's a relative path, prepend the API base URL
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202';
        return `${API_BASE_URL}${imageUrl}`;
    };

    const stockStatus = getStockStatus(product.stockQuantity);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <Package className="h-6 w-6 text-blue-400" />
                        <h2 className="text-2xl font-bold text-white">Product Details</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Image and Basic Info */}
                        <div className="space-y-6">
                            {/* Product Image */}
                            <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                                {product.imageUrl ? (
                                    <img
                                        src={getImageUrl(product.imageUrl)}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Show placeholder if image fails to load
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            // Show the placeholder div
                                            const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement;
                                            if (placeholder) {
                                                placeholder.style.display = 'flex';
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center image-placeholder">
                                        <Package className="h-24 w-24 text-gray-600" />
                                    </div>
                                )}
                            </div>

                            {/* Basic Information */}
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Product ID</span>
                                        <span className="text-white font-mono">#{product.id}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Category</span>
                                        <span className="text-white">{product.categoryName}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Weight</span>
                                        <span className="text-white">{product.weightInGrams}g</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Detailed Info */}
                        <div className="space-y-6">
                            {/* Product Title and Price */}
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="text-2xl font-bold text-green-400">
                                        {formatCurrency(product.price)}
                                    </span>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                                        {stockStatus.text}
                                    </div>
                                </div>
                                <p className="text-gray-300 text-lg leading-relaxed">{product.description}</p>
                            </div>

                            {/* Stock and Inventory */}
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Warehouse className="h-5 w-5" />
                                    Inventory
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-gray-400 text-sm">Stock Quantity</span>
                                        <div className="text-2xl font-bold text-white">{product.stockQuantity}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-sm">Price per Unit</span>
                                        <div className="text-2xl font-bold text-green-400">{formatCurrency(product.price)}</div>
                                    </div>
                                </div>
                                {product.stockQuantity < 10 && product.stockQuantity > 0 && (
                                    <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                                        <div className="flex items-center gap-2 text-yellow-400">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-sm font-medium">Low Stock Warning</span>
                                        </div>
                                        <p className="text-yellow-300 text-sm mt-1">
                                            Only {product.stockQuantity} units remaining. Consider restocking soon.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Chocolate-Specific Details */}
                            {(product.cocoaPercentage || product.origin || product.flavorNotes) && (
                                <div className="bg-gray-800/50 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Coffee className="h-5 w-5" />
                                        Chocolate Details
                                    </h3>
                                    <div className="space-y-3">
                                        {product.cocoaPercentage && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Cocoa Percentage</span>
                                                <span className="text-white font-semibold">{product.cocoaPercentage}</span>
                                            </div>
                                        )}
                                        {product.origin && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400 flex items-center gap-1">
                                                    <Globe className="h-4 w-4" />
                                                    Origin
                                                </span>
                                                <span className="text-white">{product.origin}</span>
                                            </div>
                                        )}
                                        {product.flavorNotes && (
                                            <div>
                                                <span className="text-gray-400 text-sm">Flavor Notes</span>
                                                <p className="text-white mt-1">{product.flavorNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Certifications */}
                            {(product.isOrganic || product.isFairTrade) && (
                                <div className="bg-gray-800/50 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Award className="h-5 w-5" />
                                        Certifications
                                    </h3>
                                    <div className="flex gap-3">
                                        {product.isOrganic && (
                                            <div className="flex items-center gap-2 bg-green-900/20 border border-green-700/50 px-3 py-2 rounded-lg">
                                                <Leaf className="h-4 w-4 text-green-400" />
                                                <span className="text-green-300 font-medium">Organic</span>
                                            </div>
                                        )}
                                        {product.isFairTrade && (
                                            <div className="flex items-center gap-2 bg-blue-900/20 border border-blue-700/50 px-3 py-2 rounded-lg">
                                                <Award className="h-4 w-4 text-blue-400" />
                                                <span className="text-blue-300 font-medium">Fair Trade</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Ingredients and Allergens */}
                            {(product.ingredients || product.allergenInfo) && (
                                <div className="bg-gray-800/50 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-white mb-4">Ingredients & Allergens</h3>
                                    <div className="space-y-3">
                                        {product.ingredients && (
                                            <div>
                                                <span className="text-gray-400 text-sm">Ingredients</span>
                                                <p className="text-white mt-1">{product.ingredients}</p>
                                            </div>
                                        )}
                                        {product.allergenInfo && (
                                            <div>
                                                <span className="text-gray-400 text-sm flex items-center gap-1">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    Allergen Information
                                                </span>
                                                <p className="text-yellow-300 mt-1 bg-yellow-900/10 p-2 rounded border border-yellow-700/30">
                                                    {product.allergenInfo}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Reviews and Ratings */}
                            {(product.averageRating || product.reviewCount) && (
                                <div className="bg-gray-800/50 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-white mb-4">Customer Reviews</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {product.averageRating && (
                                            <div>
                                                <span className="text-gray-400 text-sm">Average Rating</span>
                                                <div className="text-2xl font-bold text-yellow-400">
                                                    {product.averageRating.toFixed(1)} ⭐
                                                </div>
                                            </div>
                                        )}
                                        {product.reviewCount && (
                                            <div>
                                                <span className="text-gray-400 text-sm">Total Reviews</span>
                                                <div className="text-2xl font-bold text-white">{product.reviewCount}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    History
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-gray-400 text-sm">Created</span>
                                        <p className="text-white">{formatDate(product.createdAt)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-sm">Last Updated</span>
                                        <p className="text-white">{formatDate(product.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-700 p-6">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};