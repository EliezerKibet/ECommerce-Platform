import React from 'react';
import { Edit, Trash2, Eye, Plus, Download } from 'lucide-react';
import { PromotionDto } from '../types';

export interface PromotionListProps {
    promotions: PromotionDto[];
    onEdit: (promotion: PromotionDto) => void;
    onDelete: (id: number) => Promise<void>;
    onView: (id: number) => void;
    onAdd: () => void;
    onExport: () => void;
}

export const PromotionList: React.FC<PromotionListProps> = ({
    promotions,
    onEdit,
    onDelete,
    onView,
    onAdd,
    onExport
}) => {

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getPromotionStatus = (promotion: PromotionDto) => {
        if (!promotion.isActive) return { status: 'Inactive', color: 'text-gray-400', bg: 'bg-gray-800' };

        const now = new Date();
        const startDate = new Date(promotion.startDate);
        const endDate = new Date(promotion.endDate);

        if (now < startDate) return { status: 'Scheduled', color: 'text-blue-400', bg: 'bg-blue-900/20' };
        if (now > endDate) return { status: 'Expired', color: 'text-red-400', bg: 'bg-red-900/20' };

        return { status: 'Active', color: 'text-green-400', bg: 'bg-green-900/20' };
    };

    return (
        <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Promotions Management</h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        <Plus className="h-4 w-4" />
                        Add Promotion
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

            {promotions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <h3 className="text-lg font-semibold mb-2">No promotions found</h3>
                    <p className="mb-4">Start by creating your first promotion.</p>
                    <button
                        onClick={onAdd}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        Create First Promotion
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {promotions.map(promotion => {
                        const statusInfo = getPromotionStatus(promotion);

                        return (
                            <div key={promotion.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-1">{promotion.name}</h3>
                                        <p className="text-gray-300 text-sm mb-2 line-clamp-2">{promotion.description}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded ${statusInfo.bg} ${statusInfo.color}`}>
                                        {statusInfo.status}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm text-gray-300 mb-4">
                                    <div className="flex justify-between">
                                        <span>Discount:</span>
                                        <span className="font-medium text-blue-400">
                                            {promotion.discountPercentage}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Start:</span>
                                        <span>{formatDate(promotion.startDate)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>End:</span>
                                        <span>{formatDate(promotion.endDate)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                                    <button
                                        onClick={() => onView(promotion.id)}
                                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                                    >
                                        <Eye className="h-3 w-3" />
                                        View
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onEdit(promotion)}
                                            className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm"
                                        >
                                            <Edit className="h-3 w-3" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => onDelete(promotion.id)}
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
