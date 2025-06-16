// CategoryForm.tsx - Minimalist form with just name and description
'use client'

import React, { useState, useEffect } from 'react'
import { X, AlertCircle, Tag } from 'lucide-react'
import { CategoryDto } from '../types'

interface CategoryFormProps {
    isOpen: boolean
    onClose: () => void
    editingCategory: CategoryDto | null  // Changed from CategoryWithStatus
    onSubmit: (formData: FormData, isEdit: boolean, categoryId?: number) => Promise<void>
    loading: boolean
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
    isOpen,
    onClose,
    editingCategory,
    onSubmit,
    loading
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const isEdit = editingCategory !== null

    // Reset form when modal opens/closes or editing category changes
    useEffect(() => {
        if (isOpen) {
            if (editingCategory) {
                setFormData({
                    name: editingCategory.name,
                    description: editingCategory.description || ''
                })
            } else {
                setFormData({
                    name: '',
                    description: ''
                })
            }
            setErrors({})
        }
    }, [isOpen, editingCategory])

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target

        setFormData(prev => ({
            ...prev,
            [name]: value
        }))

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    // Validate form
    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Category name is required'
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Category name must be at least 2 characters'
        } else if (formData.name.trim().length > 100) {
            newErrors.name = 'Category name must be less than 100 characters'
        }

        if (formData.description && formData.description.length > 500) {
            newErrors.description = 'Description must be less than 500 characters'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            const submitFormData = new FormData()
            submitFormData.append('name', formData.name.trim())
            submitFormData.append('description', formData.description.trim())

            // Log form data for debugging
            console.log('Submitting category form data:')
            for (const [key, value] of submitFormData.entries()) {
                console.log(key, value)
            }

            await onSubmit(submitFormData, isEdit, editingCategory?.id)
        } catch (error) {
            console.error('Error submitting form:', error)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Tag className="h-6 w-6" />
                            {isEdit ? 'Edit Category' : 'Create New Category'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                            disabled={loading}
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Category Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.name ? 'border-red-500' : 'border-gray-600'}`}
                                placeholder="Enter category name"
                                disabled={loading}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Description Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-vertical ${errors.description ? 'border-red-500' : 'border-gray-600'}`}
                                placeholder="Enter category description (optional)"
                                disabled={loading}
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.description}
                                </p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                {formData.description.length}/500 characters
                            </p>
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-4 pt-6 border-t border-gray-700">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 px-4 rounded-lg font-semibold transition-colors border border-gray-600"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {isEdit ? 'Updating...' : 'Creating...'}
                                    </span>
                                ) : (
                                    isEdit ? 'Update Category' : 'Create Category'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}