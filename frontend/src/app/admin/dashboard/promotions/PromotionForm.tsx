// Dark Theme PromotionForm.tsx
import React, { useState, useEffect } from 'react';
import { X, Check, Search, Upload, AlertCircle } from 'lucide-react';
import { PromotionDto, ProductDto } from '../types';

const getImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) return '';

    // If it's already a full URL (like blob: URLs from file uploads), return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('blob:')) {
        return imagePath;
    }

    // If it starts with /uploads/, prepend the API base URL
    if (imagePath.startsWith('/uploads/')) {
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}${imagePath}`;
    }

    // If it's just a filename, prepend the full uploads path
    if (!imagePath.startsWith('/')) {
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/uploads/${imagePath}`;
    }

    // Default case
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}${imagePath}`;
};

type PromotionPayload = {
    name: string;
    description: string;
    discountPercentage: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    colorScheme: string;
    type: number;
    productIds: number[];
    bannerImageUrl: string;
};

interface PromotionFormProps {
    isOpen: boolean;
    onClose: () => void;
    editingPromotion: PromotionDto | null;
    products: ProductDto[];
    onSubmit: (data: PromotionPayload, isEdit: boolean, promotionId?: number) => Promise<void>;
    loading: boolean;
}

type ProductsArrayFormat = ProductDto[] | { $values: ProductDto[] } | null | undefined;

export const PromotionForm: React.FC<PromotionFormProps> = ({
    isOpen,
    onClose,
    editingPromotion,
    products,
    onSubmit,
    loading: parentLoading
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        discountPercentage: 10,
        startDate: '',
        endDate: '',
        isActive: true,
        productIds: [] as number[],
        colorScheme: '',
        type: 1,
        bannerImage: null as File | null
    });
    const [alert, setAlert] = useState<string>('');
    const [bannerPreview, setBannerPreview] = useState<string>('');
    const [productSearch, setProductSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageError, setImageError] = useState(false);

    const getProductsArray = (products: ProductsArrayFormat): ProductDto[] => {
        if (!products) return [];
        if (products && typeof products === 'object' && '$values' in products) {
            return Array.isArray(products.$values) ? products.$values : [];
        }
        if (Array.isArray(products)) {
            return products;
        }
        console.warn('Products is not in expected format:', products);
        return [];
    };

    // Filter products based on search
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(productSearch.toLowerCase()))
    );

    useEffect(() => {
        if (editingPromotion) {
            const productsArray = getProductsArray(editingPromotion.products);

            // Handle date formatting - ensure we get just the date part
            const formatDateForInput = (dateString: string) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            };

            setFormData({
                name: editingPromotion.name || '',
                description: editingPromotion.description || '',
                discountPercentage: Number(editingPromotion.discountPercentage) || 10,
                startDate: formatDateForInput(editingPromotion.startDate),
                endDate: formatDateForInput(editingPromotion.endDate),
                isActive: Boolean(editingPromotion.isActive),
                productIds: productsArray.map((p: ProductDto) => Number(p.id)),
                colorScheme: editingPromotion.colorScheme || '',
                type: Number(editingPromotion.type) || 1,
                bannerImage: null
            });

            // Set preview from existing banner if available
            if (editingPromotion.bannerImageUrl) {
                setBannerPreview(editingPromotion.bannerImageUrl);
                setImageError(false);
            } else {
                setBannerPreview('');
                setImageError(false);
            }
        } else {
            // Set default start date to today
            const today = new Date().toISOString().split('T')[0];
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const endDate = nextWeek.toISOString().split('T')[0];

            setFormData({
                name: '',
                description: '',
                discountPercentage: 10,
                startDate: today,
                endDate: endDate,
                isActive: true,
                productIds: [],
                colorScheme: '',
                type: 1,
                bannerImage: null
            });
            setBannerPreview('');
            setImageError(false);
        }
        setAlert('');
        setProductSearch('');
        setIsSubmitting(false);
    }, [editingPromotion, isOpen]);

    const validateForm = (): string | null => {
        if (!formData.name.trim()) {
            return 'Promotion name is required';
        }

        if (formData.name.length > 100) {
            return 'Promotion name must be 100 characters or less';
        }

        if (formData.discountPercentage <= 0 || formData.discountPercentage > 100) {
            return 'Discount percentage must be between 1 and 100';
        }

        if (!formData.startDate) {
            return 'Start date is required';
        }

        if (!formData.endDate) {
            return 'End date is required';
        }

        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

        // ✅ Fix: Only validate past dates for NEW promotions, not edits
        if (!editingPromotion && startDate < today) {
            return 'Start date cannot be in the past';
        }

        if (startDate >= endDate) {
            return 'End date must be after start date';
        }

        if (formData.productIds.length === 0) {
            return 'Please select at least one product for the promotion';
        }

        return null;
    };

    const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setAlert('Banner image must be less than 5MB');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setAlert('Please select a valid image file');
                return;
            }

            // Create preview
            setBannerPreview(URL.createObjectURL(file));
            setImageError(false);
        } else {
            setBannerPreview('');
            setImageError(false);
        }

        setFormData({ ...formData, bannerImage: file });
    };

    const uploadBannerImage = async (file: File): Promise<string> => {
        try {
            const data = new FormData();
            data.append('file', file);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/api/admin/upload`, {
                method: 'POST',
                body: data,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!res.ok) {
                throw new Error('Failed to upload image');
            }

            const result = await res.json();
            const uploadedUrl = result.url || result.filePath || result.fileName;

            if (!uploadedUrl) {
                throw new Error('No URL returned from upload');
            }

            return uploadedUrl;
        } catch (error) {
            console.error('Upload error:', error);
            throw new Error('Failed to upload banner image');
        }
    };

    const toggleProductSelection = (productId: number) => {
        setFormData(prev => ({
            ...prev,
            productIds: prev.productIds.includes(productId)
                ? prev.productIds.filter(id => id !== productId)
                : [...prev.productIds, productId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return;

        setAlert('');
        setIsSubmitting(true);

        try {
            // Validate form
            const validationError = validateForm();
            if (validationError) {
                setAlert(validationError);
                return;
            }

            let bannerImageUrl = '';

            // Upload banner image if provided
            if (formData.bannerImage) {
                try {
                    bannerImageUrl = await uploadBannerImage(formData.bannerImage);
                } catch (uploadError) {
                    setAlert(uploadError instanceof Error ? uploadError.message : 'Failed to upload banner image');
                    return;
                }
            } else if (editingPromotion?.bannerImageUrl && !imageError) {
                // Keep existing banner URL if no new image is uploaded and no error
                bannerImageUrl = editingPromotion.bannerImageUrl;
            }

            // ✅ Fix: For editing, preserve original start date if it's in the past
            let startDate = formData.startDate;
            if (editingPromotion) {
                const originalStartDate = new Date(editingPromotion.startDate);
                const newStartDate = new Date(formData.startDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // If the original promotion started in the past and user hasn't changed the date,
                // keep the original date to avoid validation errors
                if (originalStartDate < today && newStartDate.getTime() === originalStartDate.getTime()) {
                    startDate = editingPromotion.startDate.split('T')[0];
                }
            }

            // Prepare payload with proper formatting
            const payload: PromotionPayload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                discountPercentage: Number(formData.discountPercentage),
                startDate: startDate,
                endDate: formData.endDate,
                isActive: Boolean(formData.isActive),
                colorScheme: formData.colorScheme.trim(),
                type: Number(formData.type),
                productIds: formData.productIds.map(id => Number(id)),
                bannerImageUrl: bannerImageUrl
            };

            console.log('Submitting promotion payload:', payload);

            await onSubmit(payload, !!editingPromotion, editingPromotion?.id);

        } catch (error) {
            console.error('Form submission error:', error);
            setAlert(error instanceof Error ? error.message : 'Failed to save promotion');
        } finally {
            setIsSubmitting(false);
        }
    };

    const clearBannerImage = () => {
        setFormData({ ...formData, bannerImage: null });
        setBannerPreview('');
        setImageError(false);
    };

    // ✅ Handle image loading errors
    const handleImageError = () => {
        setImageError(true);
        setBannerPreview('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 max-w-4xl w-full mx-4 max-h-screen overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">
                        {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                        disabled={isSubmitting}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {alert && (
                            <div className="bg-red-900/50 text-red-300 px-4 py-2 rounded-lg border border-red-700 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                {alert}
                            </div>
                        )}

                        {/* Date Validation Warning for Editing */}
                        {editingPromotion && new Date(editingPromotion.startDate) < new Date() && (
                            <div className="bg-yellow-900/50 text-yellow-300 px-4 py-2 rounded-lg border border-yellow-700 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                This promotion has already started. Changing the start date may cause validation errors.
                            </div>
                        )}

                        {/* Basic Information */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Promotion Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    maxLength={100}
                                    disabled={isSubmitting}
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    {formData.name.length}/100 characters
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Promotion Type *
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isSubmitting}
                                >
                                    <option value={1}>Flash Sale</option>
                                    <option value={2}>Seasonal</option>
                                    <option value={3}>Holiday</option>
                                    <option value={4}>Clearance</option>
                                    <option value={5}>New Product</option>
                                    <option value={6}>Bundle Deal</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isSubmitting}
                                maxLength={500}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                {formData.description.length}/500 characters
                            </div>
                        </div>

                        {/* Discount and Status */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Discount Percentage *
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="100"
                                    value={formData.discountPercentage}
                                    onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Status *
                                </label>
                                <select
                                    value={formData.isActive.toString()}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isSubmitting}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Color Scheme
                                </label>
                                <input
                                    type="text"
                                    value={formData.colorScheme}
                                    onChange={(e) => setFormData({ ...formData, colorScheme: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g. emerald, blue, red"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Start Date *
                                    {editingPromotion && new Date(editingPromotion.startDate) < new Date() && (
                                        <span className="text-xs text-yellow-400 ml-2">(Already started)</span>
                                    )}
                                </label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    End Date *
                                </label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    min={formData.startDate}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Banner Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Banner Image (Optional)
                            </label>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors bg-gray-800/50">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleBannerImageChange}
                                            className="hidden"
                                            id="banner-upload"
                                            disabled={isSubmitting}
                                        />
                                        <label
                                            htmlFor="banner-upload"
                                            className="cursor-pointer flex flex-col items-center"
                                        >
                                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-300">
                                                Click to upload banner image
                                            </span>
                                            <span className="text-xs text-gray-500 mt-1">
                                                PNG, JPG, GIF up to 5MB
                                            </span>
                                        </label>
                                    </div>

                                    {(formData.bannerImage || (bannerPreview && !imageError)) && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-sm text-gray-300">
                                                {formData.bannerImage ? formData.bannerImage.name : 'Current image'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={clearBannerImage}
                                                className="text-red-400 hover:text-red-300 text-sm"
                                                disabled={isSubmitting}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}

                                    {imageError && (
                                        <div className="mt-2 text-sm text-red-400 flex items-center gap-1">
                                            <AlertCircle className="h-4 w-4" />
                                            Failed to load existing banner image
                                        </div>
                                    )}
                                </div>

                                {bannerPreview && !imageError && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Preview
                                        </label>
                                        <img
                                            src={getImageUrl(bannerPreview)}
                                            alt="Banner Preview"
                                            className="w-full h-32 object-cover rounded-lg border border-gray-600"
                                            onError={handleImageError}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Enhanced Product Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Select Products * ({formData.productIds.length} selected)
                            </label>

                            {/* Search Products */}
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Product Grid */}
                            <div className="border border-gray-600 rounded-lg max-h-72 overflow-y-auto bg-gray-800/30">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
                                    {filteredProducts.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => !isSubmitting && toggleProductSelection(product.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''
                                                } ${formData.productIds.includes(product.id)
                                                    ? 'bg-blue-900/50 border-blue-500 ring-2 ring-blue-500/30'
                                                    : 'bg-gray-800 border-gray-600 hover:border-gray-500 hover:bg-gray-700'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-white truncate">
                                                        {product.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-400">
                                                        ${product.price.toFixed(2)}
                                                    </p>
                                                    {product.description && (
                                                        <p className="text-xs text-gray-500 truncate mt-1">
                                                            {product.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className={`ml-3 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${formData.productIds.includes(product.id)
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'border-gray-500 hover:border-gray-400'
                                                    }`}>
                                                    {formData.productIds.includes(product.id) && (
                                                        <Check className="h-3 w-3 text-white" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {filteredProducts.length === 0 && (
                                    <div className="text-center py-8 text-gray-400">
                                        {productSearch ? 'No products found matching your search.' : 'No products available.'}
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-gray-500 mt-2">
                                Click on products to select/deselect them for this promotion.
                            </p>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-700 bg-gray-800/30 -mx-6 px-6 -mb-6 pb-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                disabled={isSubmitting || parentLoading || formData.productIds.length === 0}
                            >
                                {(isSubmitting || parentLoading) ? 'Saving...' : (editingPromotion ? 'Update Promotion' : 'Create Promotion')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};