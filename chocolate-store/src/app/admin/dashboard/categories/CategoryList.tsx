// CategoryList.tsx - CORRECT VERSION (Replace your current CategoryList.tsx with this)
import React from 'react';
import { Edit, Trash2, Eye, Plus, Download, Tag } from 'lucide-react';
import { CategoryDto } from '../types';

export interface CategoryListProps {
    categories: CategoryDto[];
    onEdit: (category: CategoryDto) => void;
    onDelete: (id: number) => Promise<void>;
    onView: (id: number) => void;
    onAdd: () => void;
    onExport: () => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
    categories,
    onEdit,
    onDelete,
    onView,
    onAdd,
    onExport
}) => {

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Categories Management</h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
                    >
                        <Plus className="h-4 w-4" />
                        Add Category
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

            {categories.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                    <p className="mb-4">Start by creating your first category.</p>
                    <button
                        onClick={onAdd}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
                    >
                        Create First Category
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map(category => (
                        <div key={category.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Tag className="h-5 w-5 text-emerald-400" />
                                        <h3 className="text-lg font-semibold text-white">
                                            {category.name}
                                        </h3>
                                    </div>
                                    <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                                        {category.description || 'No description provided'}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded ${category.isActive
                                        ? 'bg-green-900/20 text-green-400'
                                        : 'bg-gray-800 text-gray-400'
                                    }`}>
                                    {category.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-300 mb-4">
                                <div className="flex justify-between">
                                    <span>Category ID:</span>
                                    <span className="font-mono">#{category.id}</span>
                                </div>
                                {category.productCount !== undefined && (
                                    <div className="flex justify-between">
                                        <span>Products:</span>
                                        <span className="font-medium text-emerald-400">
                                            {category.productCount}
                                        </span>
                                    </div>
                                )}
                                {category.createdAt && (
                                    <div className="flex justify-between">
                                        <span>Created:</span>
                                        <span className="text-xs">
                                            {formatDate(category.createdAt)}
                                        </span>
                                    </div>
                                )}
                                {category.slug && (
                                    <div className="flex justify-between">
                                        <span>Slug:</span>
                                        <span className="font-mono text-xs text-blue-400">
                                            {category.slug}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                                <button
                                    onClick={() => onView(category.id)}
                                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                                    title="View Details"
                                >
                                    <Eye className="h-3 w-3" />
                                    View
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onEdit(category)}
                                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm"
                                    >
                                        <Edit className="h-3 w-3" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onDelete(category.id)}
                                        className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};