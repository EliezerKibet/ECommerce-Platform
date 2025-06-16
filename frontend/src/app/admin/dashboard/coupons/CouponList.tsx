// CouponList.tsx
import React from 'react';
import { Edit, Trash2, Eye, Plus, Download, Copy, Percent, DollarSign, Users, Calendar, Power, PowerOff } from 'lucide-react';
import { CouponDto } from '../types';

export interface CouponListProps {
    coupons: CouponDto[];
    onEdit: (coupon: CouponDto) => void;
    onDelete: (id: number) => Promise<void>;
    onView: (id: number) => void;
    onAdd: () => void;
    onExport: () => void;
    onToggleVisibility?: (id: number) => Promise<void>;
}

export const CouponList: React.FC<CouponListProps> = ({
    coupons,
    onEdit,
    onDelete,
    onView,
    onAdd,
    onExport,
    onToggleVisibility
}) => {

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getCouponStatus = (coupon: CouponDto) => {
        if (!coupon.isActive) return { status: 'Inactive', color: 'text-gray-400', bg: 'bg-gray-800' };

        const now = new Date();
        const startDate = new Date(coupon.startDate);
        const endDate = new Date(coupon.endDate);

        if (now < startDate) return { status: 'Scheduled', color: 'text-blue-400', bg: 'bg-blue-900/20' };
        if (now > endDate) return { status: 'Expired', color: 'text-red-400', bg: 'bg-red-900/20' };
        if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) return { status: 'Used Up', color: 'text-orange-400', bg: 'bg-orange-900/20' };

        return { status: 'Active', color: 'text-green-400', bg: 'bg-green-900/20' };
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You might want to show a toast notification here
    };

    const getDiscountDisplay = (coupon: CouponDto) => {
        if (coupon.discountType === 'Percentage') {
            return `${coupon.discountAmount}%`;
        } else {
            return `$${coupon.discountAmount.toFixed(2)}`;
        }
    };

    const getUsageDisplay = (coupon: CouponDto) => {
        if (coupon.usageLimit) {
            return `${coupon.timesUsed}/${coupon.usageLimit}`;
        }
        return `${coupon.timesUsed}/∞`;
    };

    return (
        <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Coupons Management</h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        <Plus className="h-4 w-4" />
                        Add Coupon
                    </button>
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg border border-gray-600"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                </div>
            </div>

            {coupons.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <h3 className="text-lg font-semibold mb-2">No coupons found</h3>
                    <p className="mb-4">Start by creating your first coupon.</p>
                    <button
                        onClick={onAdd}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        Create First Coupon
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coupons.map(coupon => {
                        const statusInfo = getCouponStatus(coupon);

                        return (
                            <div key={coupon.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold text-white font-mono">
                                                {coupon.code}
                                            </h3>
                                            <button
                                                onClick={() => copyToClipboard(coupon.code)}
                                                className="text-gray-400 hover:text-white transition-colors"
                                                title="Copy coupon code"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <p className="text-gray-300 text-sm mb-2 line-clamp-2">{coupon.description}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded ${statusInfo.bg} ${statusInfo.color}`}>
                                        {statusInfo.status}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm text-gray-300 mb-4">
                                    <div className="flex justify-between items-center">
                                        <span>Discount:</span>
                                        <div className="flex items-center gap-1">
                                            {coupon.discountType === 'Percentage' ? (
                                                <Percent className="h-3 w-3 text-blue-400" />
                                            ) : (
                                                <DollarSign className="h-3 w-3 text-green-400" />
                                            )}
                                            <span className="font-medium text-blue-400">
                                                {getDiscountDisplay(coupon)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Min Order:</span>
                                        <span>${coupon.minimumOrderAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Usage:</span>
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3 text-purple-400" />
                                            <span className="font-medium text-purple-400">
                                                {getUsageDisplay(coupon)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Valid:</span>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs">
                                                {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onView(coupon.id)}
                                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                                            title="View Details"
                                        >
                                            <Eye className="h-3 w-3" />
                                            View
                                        </button>
                                        {onToggleVisibility && (
                                            <button
                                                onClick={() => onToggleVisibility(coupon.id)}
                                                className={`flex items-center gap-1 text-sm ${coupon.isActive
                                                        ? 'text-orange-400 hover:text-orange-300'
                                                        : 'text-green-400 hover:text-green-300'
                                                    }`}
                                                title={coupon.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {coupon.isActive ? (
                                                    <>
                                                        <PowerOff className="h-3 w-3" />
                                                        Deactivate
                                                    </>
                                                ) : (
                                                    <>
                                                        <Power className="h-3 w-3" />
                                                        Activate
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onEdit(coupon)}
                                            className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm"
                                        >
                                            <Edit className="h-3 w-3" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => onDelete(coupon.id)}
                                            className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};