
// CouponDetailsModal.tsx
import React from 'react';
import { X, Copy, Percent, DollarSign, Calendar, Users, Shield } from 'lucide-react';
import { CouponDto } from '../types';

interface CouponDetailsModalProps {
    coupon: CouponDto | null;
    isOpen: boolean;
    onClose: () => void;
}

export const CouponDetailsModal: React.FC<CouponDetailsModalProps> = ({
    coupon,
    isOpen,
    onClose
}) => {
    if (!isOpen || !coupon) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You might want to show a toast notification here
    };

    const getDiscountDisplay = () => {
        if (coupon.discountType === 'Percentage') {
            return `${coupon.discountAmount}%`;
        } else {
            return `$${coupon.discountAmount.toFixed(2)}`;
        }
    };

    const getUsagePercentage = () => {
        if (!coupon.usageLimit) return 0;
        return (coupon.timesUsed / coupon.usageLimit) * 100;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Coupon Details</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Coupon Code Section */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 font-mono">{coupon.code}</h3>
                                <p className="text-gray-600 mt-1">{coupon.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => copyToClipboard(coupon.code)}
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Copy className="h-4 w-4" />
                                    Copy Code
                                </button>
                                <span className={`px-3 py-2 rounded-lg text-sm font-medium ${coupon.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {coupon.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Discount Information */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-600" />
                                Discount Details
                            </h4>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                    <span className="font-medium text-gray-700">Discount Type:</span>
                                    <div className="flex items-center gap-2">
                                        {coupon.discountType === 'Percentage' ? (
                                            <Percent className="h-4 w-4 text-blue-600" />
                                        ) : (
                                            <DollarSign className="h-4 w-4 text-green-600" />
                                        )}
                                        <span className="font-semibold text-gray-900">
                                            {coupon.discountType === 'Percentage' ? 'Percentage' : 'Fixed Amount'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                    <span className="font-medium text-gray-700">Discount Value:</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        {getDiscountDisplay()}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium text-gray-700">Minimum Order:</span>
                                    <span className="font-semibold text-gray-900">
                                        ${coupon.minimumOrderAmount.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Usage Information */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Users className="h-5 w-5 text-purple-600" />
                                Usage Information
                            </h4>

                            <div className="space-y-3">
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-gray-700">Times Used:</span>
                                        <span className="font-bold text-purple-600 text-xl">
                                            {coupon.timesUsed}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-700">Usage Limit:</span>
                                        <span className="font-semibold text-gray-900">
                                            {coupon.usageLimit ? coupon.usageLimit.toLocaleString() : 'Unlimited'}
                                        </span>
                                    </div>
                                </div>

                                {/* Usage Progress Bar */}
                                {coupon.usageLimit && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Usage Progress</span>
                                            <span>{Math.round(getUsagePercentage())}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-300 ${getUsagePercentage() >= 100
                                                    ? 'bg-red-500'
                                                    : getUsagePercentage() >= 80
                                                        ? 'bg-yellow-500'
                                                        : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {coupon.usageLimit - coupon.timesUsed} uses remaining
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Validity Period */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-green-600" />
                            Validity Period
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-green-50 rounded-lg">
                                <div className="text-sm font-medium text-gray-700 mb-1">Start Date</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {formatDate(coupon.startDate)}
                                </div>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg">
                                <div className="text-sm font-medium text-gray-700 mb-1">End Date</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {formatDate(coupon.endDate)}
                                </div>
                            </div>
                        </div>

                        {/* Time remaining indicator */}
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-700">Status</div>
                            {(() => {
                                const now = new Date();
                                const startDate = new Date(coupon.startDate);
                                const endDate = new Date(coupon.endDate);

                                if (!coupon.isActive) {
                                    return <div className="text-gray-600 font-semibold">Inactive</div>;
                                } else if (now < startDate) {
                                    const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                    return <div className="text-blue-600 font-semibold">Starts in {daysUntilStart} day(s)</div>;
                                } else if (now > endDate) {
                                    return <div className="text-red-600 font-semibold">Expired</div>;
                                } else {
                                    const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                    return <div className="text-green-600 font-semibold">Active - {daysUntilEnd} day(s) remaining</div>;
                                }
                            })()}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};