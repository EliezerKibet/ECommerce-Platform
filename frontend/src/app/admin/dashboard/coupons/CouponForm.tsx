// CouponForm.tsx
import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { CouponDto } from '../types';

type CouponPayload = {
    code: string;
    description: string;
    discountType: 'Percentage' | 'FixedAmount';
    discountAmount: number;
    minimumOrderAmount: number;
    startDate: string;
    endDate: string;
    usageLimit?: number;
    isActive: boolean;
};

interface CouponFormProps {
    isOpen: boolean;
    onClose: () => void;
    editingCoupon: CouponDto | null;
    onSubmit: (data: CouponPayload, isEdit: boolean, couponId?: number) => Promise<void>;
    loading: boolean;
}

export const CouponForm: React.FC<CouponFormProps> = ({
    isOpen,
    onClose,
    editingCoupon,
    onSubmit,
    loading: parentLoading
}) => {
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'Percentage' as 'Percentage' | 'FixedAmount',
        discountAmount: 10,
        minimumOrderAmount: 0,
        usageLimit: 100,
        startDate: '',
        endDate: '',
        isActive: true
    });
    const [alert, setAlert] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingCoupon) {
            const formatDateForInput = (dateString: string) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            };

            setFormData({
                code: editingCoupon.code || '',
                description: editingCoupon.description || '',
                discountType: editingCoupon.discountType as 'Percentage' | 'FixedAmount' || 'Percentage',
                discountAmount: Number(editingCoupon.discountAmount) || 10,
                minimumOrderAmount: Number(editingCoupon.minimumOrderAmount) || 0,
                usageLimit: editingCoupon.usageLimit || 100,
                startDate: formatDateForInput(editingCoupon.startDate),
                endDate: formatDateForInput(editingCoupon.endDate),
                isActive: Boolean(editingCoupon.isActive)
            });
        } else {
            // Set default dates
            const today = new Date().toISOString().split('T')[0];
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            const endDate = nextMonth.toISOString().split('T')[0];

            setFormData({
                code: '',
                description: '',
                discountType: 'Percentage',
                discountAmount: 10,
                minimumOrderAmount: 0,
                usageLimit: 100,
                startDate: today,
                endDate: endDate,
                isActive: true
            });
        }
        setAlert('');
        setIsSubmitting(false);
    }, [editingCoupon, isOpen]);

    const validateForm = (): string | null => {
        if (!formData.code.trim()) {
            return 'Coupon code is required';
        }

        if (formData.code.length < 3 || formData.code.length > 20) {
            return 'Coupon code must be between 3 and 20 characters';
        }

        if (formData.discountAmount <= 0 || formData.discountAmount > 1000) {
            return 'Discount amount must be between 0.01 and 1000';
        }

        if (formData.discountType === 'Percentage' && formData.discountAmount > 100) {
            return 'Percentage discount cannot exceed 100%';
        }

        if (formData.minimumOrderAmount < 0 || formData.minimumOrderAmount > 10000) {
            return 'Minimum order amount must be between 0 and 10000';
        }

        if (!formData.startDate || !formData.endDate) {
            return 'Start date and end date are required';
        }

        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);

        if (startDate >= endDate) {
            return 'End date must be after start date';
        }

        return null;
    };

    const generateCouponCode = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        setFormData({ ...formData, code: result });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return;

        setAlert('');
        setIsSubmitting(true);

        try {
            const validationError = validateForm();
            if (validationError) {
                setAlert(validationError);
                return;
            }

            const payload: CouponPayload = {
                code: formData.code.trim().toUpperCase(),
                description: formData.description.trim(),
                discountType: formData.discountType,
                discountAmount: Number(formData.discountAmount),
                minimumOrderAmount: Number(formData.minimumOrderAmount),
                startDate: formData.startDate,
                endDate: formData.endDate,
                usageLimit: formData.usageLimit > 0 ? Number(formData.usageLimit) : undefined,
                isActive: Boolean(formData.isActive)
            };

            await onSubmit(payload, !!editingCoupon, editingCoupon?.id);

        } catch (error) {
            console.error('Form submission error:', error);
            setAlert(error instanceof Error ? error.message : 'Failed to save coupon');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 max-w-3xl w-full mx-4 max-h-screen overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">
                        {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
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

                        {/* Coupon Code and Status */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Coupon Code *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="SAVE20"
                                        maxLength={20}
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        onClick={generateCouponCode}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm"
                                        disabled={isSubmitting}
                                    >
                                        Generate
                                    </button>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {formData.code.length}/20 characters
                                </div>
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
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Get 20% off your order"
                                disabled={isSubmitting}
                                maxLength={200}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                {formData.description.length}/200 characters
                            </div>
                        </div>

                        {/* Discount Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Discount Type *
                                </label>
                                <select
                                    value={formData.discountType}
                                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'Percentage' | 'FixedAmount' })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isSubmitting}
                                >
                                    <option value="Percentage">Percentage (%)</option>
                                    <option value="FixedAmount">Fixed Amount ($)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Discount Amount * (0.01 - 1000)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max="1000"
                                        value={formData.discountAmount}
                                        onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        {formData.discountType === 'Percentage' ? '%' : '$'}
                                    </span>
                                </div>
                                {formData.discountType === 'Percentage' && formData.discountAmount > 100 && (
                                    <div className="text-xs text-red-400 mt-1">
                                        Percentage cannot exceed 100%
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Minimum Order Amount (0 - 10,000)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="10000"
                                        value={formData.minimumOrderAmount}
                                        onChange={(e) => setFormData({ ...formData, minimumOrderAmount: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={isSubmitting}
                                    />
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Usage Limit (Optional)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.usageLimit}
                                    onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Leave empty for unlimited"
                                    disabled={isSubmitting}
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    Leave empty for unlimited usage
                                </div>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Start Date *
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
                                disabled={isSubmitting || parentLoading}
                            >
                                {(isSubmitting || parentLoading) ? 'Saving...' : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


