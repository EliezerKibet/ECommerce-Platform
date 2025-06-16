// Enhanced ProductForm and ProductList with improved image handling

'use client';

import React, { useState, useEffect } from 'react';
import { ProductDto, ProductFormData, CategoryDto } from './types';
import { getImageUrl, fixImageUrl } from './utils';
import { Plus, Edit, Trash2, Eye, Download, X, EyeOff } from 'lucide-react';

interface ProductFormProps {
    isOpen: boolean;
    onClose: () => void;
    editingProduct: ProductDto | null;
    categories: CategoryDto[]; // Changed from CategoryWithStatus
    onSubmit: (formData: FormData, isEdit: boolean, productId?: number) => Promise<void>;
    loading: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
    isOpen,
    onClose,
    editingProduct,
    categories,
    onSubmit,
    loading
}) => {
    // Form state
    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        price: 0,
        stockQuantity: 0,
        categoryId: 0,
        image: null,
        weightInGrams: 0,
        cocoaPercentage: '',
        origin: null,
        flavorNotes: null,
        isOrganic: false,
        isFairTrade: false,
        ingredients: null,
        allergenInfo: null,
        isVisible: true // Default to true
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Reset form when opening/closing or when editingProduct changes
    useEffect(() => {
        if (isOpen) {
            if (editingProduct) {
                // Populate form with existing product data
                setFormData({
                    name: editingProduct.name || '',
                    description: editingProduct.description || '',
                    price: editingProduct.price || 0,
                    stockQuantity: editingProduct.stockQuantity || 0,
                    categoryId: editingProduct.categoryId || 0,
                    image: null, // Always start with null for image
                    weightInGrams: editingProduct.weightInGrams || 0,
                    cocoaPercentage: editingProduct.cocoaPercentage || '',
                    origin: editingProduct.origin || null,
                    flavorNotes: editingProduct.flavorNotes || null,
                    isOrganic: editingProduct.isOrganic || false,
                    isFairTrade: editingProduct.isFairTrade || false,
                    ingredients: editingProduct.ingredients || null,
                    allergenInfo: editingProduct.allergenInfo || null,
                    isVisible: editingProduct.isVisible ?? true
                });
                // Set image preview using the existing image URL
                setImagePreview(editingProduct.imageUrl ? getImageUrl(editingProduct.imageUrl) : null);
            } else {
                // Reset form for new product
                resetForm();
            }
        }
    }, [isOpen, editingProduct]);

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: 0,
            stockQuantity: 0,
            categoryId: 0,
            image: null,
            weightInGrams: 0,
            cocoaPercentage: '',
            origin: null,
            flavorNotes: null,
            isOrganic: false,
            isFairTrade: false,
            ingredients: null,
            allergenInfo: null,
            isVisible: true // Default to true
        });
        setImagePreview(null);
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'file') {
            const file = (e.target as HTMLInputElement).files?.[0] || null;
            setFormData(prev => ({ ...prev, image: file }));

            // Create preview
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                // If no file selected, revert to existing image if in edit mode
                setImagePreview(editingProduct?.imageUrl ? getImageUrl(editingProduct.imageUrl) : null);
            }
        } else if (type === 'number') {
            // Handle number inputs
            const numValue = value === '' ? 0 : parseFloat(value);
            setFormData(prev => ({ ...prev, [name]: numValue }));
        } else {
            // Handle text inputs - convert empty strings to null for optional fields
            const optionalFields = ['cocoaPercentage', 'origin', 'flavorNotes', 'ingredients', 'allergenInfo'];
            const finalValue = optionalFields.includes(name) && value.trim() === '' ? null : value;
            setFormData(prev => ({ ...prev, [name]: finalValue }));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const submitFormData = new FormData();

            // Required fields
            submitFormData.append('name', formData.name.trim());
            submitFormData.append('description', formData.description.trim());
            submitFormData.append('price', formData.price.toString());
            submitFormData.append('stockQuantity', formData.stockQuantity.toString());
            submitFormData.append('categoryId', formData.categoryId.toString());
            submitFormData.append('weightInGrams', formData.weightInGrams.toString());

            // Boolean fields
            submitFormData.append('isOrganic', formData.isOrganic.toString());
            submitFormData.append('isFairTrade', formData.isFairTrade.toString());
            submitFormData.append('isVisible', formData.isVisible.toString());  // Add this line
            // Replace the existing cocoaPercentage handling code with this:

            // CocoaPercentage is required, so always append it
            const cocoaValue = formData.cocoaPercentage || '';
            // Convert to string if it's not already
            const cocoaString = typeof cocoaValue === 'string'
                ? cocoaValue.trim()
                : cocoaValue.toString().trim();

            // Always append cocoaPercentage - it's a required field
            submitFormData.append('cocoaPercentage', cocoaString);


            if (formData.origin && formData.origin.trim() !== '') {
                submitFormData.append('origin', formData.origin.trim());
            }

            if (formData.flavorNotes && formData.flavorNotes.trim() !== '') {
                submitFormData.append('flavorNotes', formData.flavorNotes.trim());
            }

            if (formData.ingredients && formData.ingredients.trim() !== '') {
                submitFormData.append('ingredients', formData.ingredients.trim());
            }

            if (formData.allergenInfo && formData.allergenInfo.trim() !== '') {
                submitFormData.append('allergenInfo', formData.allergenInfo.trim());
            }

            // Image file - only append if a new file was selected
            if (formData.image && formData.image instanceof File && formData.image.size > 0) {
                submitFormData.append('image', formData.image);
            }

            // Debug logging
            console.log('=== FormData being sent ===');
            for (const [key, value] of submitFormData.entries()) {
                if (value instanceof File) {
                    console.log(`${key}: [File: ${value.name}, Size: ${value.size}]`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }
            console.log('=========================');

            await onSubmit(submitFormData, !!editingProduct, editingProduct?.id);

            // Reset form on successful creation (not edit)
            if (!editingProduct) {
                resetForm();
            }

        } catch (error) {
            console.error('Form submission error:', error);
            // Error handling is done in parent component
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">
                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                        disabled={isSubmitting}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Product Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Category *
                            </label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={isSubmitting}
                            >
                                <option value={0}>Select a category</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Pricing and Inventory */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Price ($) *
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0"
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Stock Quantity *
                            </label>
                            <input
                                type="number"
                                name="stockQuantity"
                                value={formData.stockQuantity}
                                onChange={handleInputChange}
                                min="0"
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Weight (grams) *
                            </label>
                            <input
                                type="number"
                                name="weightInGrams"
                                value={formData.weightInGrams}
                                onChange={handleInputChange}
                                min="1"
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {/* Chocolate-specific fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Cocoa Percentage *
                            </label>
                            <input
                                type="text"
                                name="cocoaPercentage"
                                value={formData.cocoaPercentage || ''}
                                onChange={handleInputChange}
                                placeholder="e.g., 70%"
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Origin
                            </label>
                            <input
                                type="text"
                                name="origin"
                                value={formData.origin || ''}
                                onChange={handleInputChange}
                                placeholder="e.g., Ecuador"
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Flavor Notes
                        </label>
                        <input
                            type="text"
                            name="flavorNotes"
                            value={formData.flavorNotes || ''}
                            onChange={handleInputChange}
                            placeholder="e.g., Rich, bold, with hints of vanilla"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Ingredients
                            </label>
                            <textarea
                                name="ingredients"
                                value={formData.ingredients || ''}
                                onChange={handleInputChange}
                                rows={2}
                                placeholder="List all ingredients"
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Allergen Information
                            </label>
                            <textarea
                                name="allergenInfo"
                                value={formData.allergenInfo || ''}
                                onChange={handleInputChange}
                                rows={2}
                                placeholder="e.g., Contains nuts, may contain traces of dairy"
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {/* Certifications */}
                    <div className="flex gap-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="isOrganic"
                                checked={formData.isOrganic}
                                onChange={handleInputChange}
                                className="mr-2"
                                disabled={isSubmitting}
                            />
                            <span className="text-gray-300">Organic</span>
                        </label>

                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="isFairTrade"
                                checked={formData.isFairTrade}
                                onChange={handleInputChange}
                                className="mr-2"
                                disabled={isSubmitting}
                            />
                            <span className="text-gray-300">Fair Trade</span>
                        </label>
                    </div>

                    {/* Product Visibility */}
                    <div className="flex items-center mt-4">
                        <input
                            type="checkbox"
                            id="isVisible"
                            name="isVisible"
                            checked={formData.isVisible}
                            onChange={handleInputChange}
                            className="mr-2"
                            disabled={isSubmitting}
                        />
                        <label htmlFor="isVisible" className="text-sm font-medium text-gray-300">
                            Visible in store
                        </label>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Product Image
                        </label>
                        <input
                            type="file"
                            name="image"
                            onChange={handleInputChange}
                            accept="image/*"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isSubmitting}
                        />

                        {/* Enhanced Image Preview */}

                        {imagePreview && (
                            <div className="mt-3">
                                <p className="text-sm text-gray-400 mb-2">
                                    {formData.image ? 'New Image Preview:' : 'Current Image:'}
                                </p>
                                <div className="relative">
                                    <img
                                        // For data URLs (new uploads), use as-is
                                        // For existing URLs from database, apply both functions
                                        src={formData.image ? imagePreview : fixImageUrl(getImageUrl(imagePreview))}
                                        alt={editingProduct?.name || 'Product preview'}
                                        className="w-full h-48 object-cover rounded-lg border border-gray-600"
                                        onError={(e) => {
                                            console.error('Image failed to load:', imagePreview);
                                            // Show placeholder if image fails to load
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';

                                            // Show the placeholder div
                                            const placeholder = target.nextElementSibling as HTMLElement;
                                            if (placeholder && placeholder.classList.contains('image-placeholder')) {
                                                placeholder.style.display = 'flex';
                                            }
                                        }}
                                        onLoad={() => {
                                            console.log('Image loaded successfully:', imagePreview);
                                        }}
                                    />
                                    <div
                                        className="image-placeholder hidden w-full h-48 bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center text-gray-400"
                                    >
                                        <div className="text-center">
                                            <div className="text-4xl mb-2">📷</div>
                                            <span>Image not available</span>
                                            <div className="text-xs mt-1">Path: {imagePreview}</div>
                                        </div>
                                    </div>

                                    {/* Clear image button - only show for new uploads */}
                                    {formData.image && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImagePreview(editingProduct?.imageUrl ? getImageUrl(editingProduct.imageUrl) : null);
                                                setFormData(prev => ({ ...prev, image: null }));
                                                // Reset file input
                                                const fileInput = document.querySelector('input[name="image"]') as HTMLInputElement;
                                                if (fileInput) {
                                                    fileInput.value = '';
                                                }
                                            }}
                                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full"
                                            title="Remove new image"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            disabled={isSubmitting || loading}
                        >
                            {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Enhanced ProductList component with better image handling
// In your products/index.tsx or wherever ProductListProps is defined:
interface ProductListProps {
    products: ProductDto[];
    onEdit: (product: ProductDto) => void;
    onDelete: (id: number) => void;
    onView: (id: number) => void;
    onAdd: () => void;
    onExport: () => void;
    onToggleVisibility: (id: number) => void; // Add this line
}

export const ProductList: React.FC<ProductListProps> = ({
    products,
    onEdit,
    onDelete,
    onView,
    onAdd,
    onExport,
    onToggleVisibility // Add this line
}) => {
    return (
        <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Products Management</h2>
                <div className="flex gap-4">
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg border border-gray-600"
                        disabled={!products.length}
                    >
                        <Download className="h-4 w-4" />
                        Export Products
                    </button>
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        <Plus className="h-4 w-4" />
                        Add Product
                    </button>
                </div>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <div className="mb-4">📦</div>
                    <h3 className="text-lg font-semibold mb-2">No products found</h3>
                    <p className="mb-4">Start by adding your first product to the inventory.</p>
                    <button
                        onClick={onAdd}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        Add Your First Product
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (
                        <div
                            key={product.id}
                            className="bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-semibold text-white truncate">
                                    {product.name}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onView(product.id)}
                                        className="p-1 text-blue-400 hover:text-blue-300"
                                        title="View Details"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => onEdit(product)}
                                        className="p-1 text-emerald-400 hover:text-emerald-300"
                                        title="Edit Product"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    {/* Add toggle visibility button */}
                                    <button
                                        onClick={() => onToggleVisibility(product.id)}
                                        className={`p-1 ${product.isVisible ? 'text-gray-400 hover:text-gray-300' : 'text-amber-400 hover:text-amber-300'}`}
                                        title={product.isVisible ? "Hide Product" : "Show Product"}
                                    >
                                        {product.isVisible ?
                                            <Eye className="h-4 w-4" /> :  // Now using Eye icon for visible products
                                            <EyeOff className="h-4 w-4" /> // Now using EyeOff icon for hidden products
                                        }
                                    </button>
                                    <button
                                        onClick={() => onDelete(product.id)}
                                        className="p-1 text-red-400 hover:text-red-300"
                                        title="Delete Product"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Enhanced Image Display */}
                            {product.imageUrl && (
                                <div className="mb-3 relative">
                                    <img
                                        // Apply both functions for maximum protection
                                        src={fixImageUrl(getImageUrl(product.imageUrl))}
                                        alt={product.name}
                                        className="w-full h-32 object-cover rounded-lg"
                                        onError={(e) => {
                                            console.error('Product image failed to load:', product.imageUrl);
                                            // Hide image if it fails to load and show placeholder
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';

                                            // Show placeholder
                                            const placeholder = target.nextElementSibling as HTMLElement;
                                            if (placeholder && placeholder.classList.contains('image-placeholder')) {
                                                placeholder.style.display = 'flex';
                                            }
                                        }}
                                        onLoad={() => {
                                            console.log('Product image loaded successfully:', product.name);
                                        }}
                                    />
                                    <div
                                        className="image-placeholder hidden w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400"
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl mb-1">📷</div>
                                            <span className="text-xs">No Image</span>
                                            <div className="text-xs mt-1">Path: {product.imageUrl}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 text-sm text-gray-300">
                                <div className="flex justify-between">
                                    <span>Price:</span>
                                    <span className="font-semibold text-green-400">
                                        ${product.price.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Stock:</span>
                                    <span className={`font-semibold ${product.stockQuantity > 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {product.stockQuantity}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Category:</span>
                                    <span>{product.categoryName}</span>
                                </div>
                                {product.weightInGrams && (
                                    <div className="flex justify-between">
                                        <span>Weight:</span>
                                        <span>{product.weightInGrams}g</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-700">
                                <p className="text-xs text-gray-400 line-clamp-2">
                                    {product.description}
                                </p>
                            </div>

                            {/* Product tags - moved outside conditional for visibility status */}
                            <div className="mt-2 flex flex-wrap gap-2">
                                {product.isOrganic && (
                                    <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">
                                        Organic
                                    </span>
                                )}
                                {product.isFairTrade && (
                                    <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">
                                        Fair Trade
                                    </span>
                                )}
                                {/* Visibility indicator - always visible */}
                                <span className={`text-xs px-2 py-1 rounded ${product.isVisible
                                    ? 'bg-green-900 text-green-300'
                                    : 'bg-gray-700 text-gray-300'
                                    }`}>
                                    {product.isVisible ? 'Published' : 'Hidden'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};