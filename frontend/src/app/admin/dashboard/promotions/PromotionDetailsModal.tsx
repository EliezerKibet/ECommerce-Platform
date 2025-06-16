import React from 'react';
import { X } from 'lucide-react';
import { PromotionDto } from '../types';

interface PromotionDetailsModalProps {
    promotion: PromotionDto | null;
    isOpen: boolean;
    onClose: () => void;
}

export const PromotionDetailsModal: React.FC<PromotionDetailsModalProps> = ({
    promotion,
    isOpen,
    onClose
}) => {
    if (!isOpen || !promotion) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Promotion Details</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{promotion.name}</h3>
                        <p className="text-gray-600">{promotion.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Promotion Details</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-medium">Discount:</span>
                                    <span>{promotion.discountPercentage}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Status:</span>
                                    <span className={`px-2 py-1 rounded text-sm ${promotion.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                        {promotion.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Duration</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-medium">Start Date:</span>
                                    <span>{formatDate(promotion.startDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">End Date:</span>
                                    <span>{formatDate(promotion.endDate)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {promotion.products && promotion.products.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Applicable Products</h4>
                            <div className="space-y-2">
                                {promotion.products.map(product => (
                                    <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <span>{product.name}</span>
                                        <span className="text-green-600 font-medium">{promotion.discountPercentage}% OFF</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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