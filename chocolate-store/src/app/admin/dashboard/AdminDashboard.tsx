// Enhanced Admin Dashboard Component with Section Refresh
'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Users, ShoppingCart, DollarSign, BarChart3, Activity, Download, MessageSquare } from 'lucide-react'

// Import your existing components
import { ProductList, ProductForm } from './products'
import { ProductDetailsModal } from '../dashboard/products/ProductDetailsModal'
import { CategoryList, CategoryForm, CategoryDetailsModal } from './categories'
import { PromotionForm } from './promotions/PromotionForm'
import { PromotionList } from './promotions/PromotionList'
import { PromotionDetailsModal } from './promotions/PromotionDetailsModal'

//coupons
import { CouponForm, CouponList, CouponDetailsModal } from './coupons';

// Import types
import {
    ProductDto,
    CouponDto,
    PromotionDto,
    SalesSummaryDto,
    AllTimeSalesDto,
    SalesOrderDto,
    AdminReviewDto,
    CategoryDto,
    ExtendedError
} from './types'

// Import services
import { adminService, adminAnalyticsService } from './services'
import { categoryService } from './categoryService'

// Import utilities
import { formatCurrency, exportData } from './utils'

// Import components
import {
    LoadingSpinner,
    ErrorDisplay,
    SuccessMessage,
    PeriodSelector,
    MetricCard,
    QuickStat,
    EmptyState,
    DashboardHeader,
    DebugInfo
} from './components'

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

const AdminDashboard: React.FC = () => {
    
    // Main data state
    const [products, setProducts] = useState<ProductDto[]>([])
    const [categories, setCategories] = useState<CategoryDto[]>([])
    const [promotions, setPromotions] = useState<PromotionDto[]>([])
    const [salesSummary, setSalesSummary] = useState<SalesSummaryDto | null>(null)
    const [salesOrders, setSalesOrders] = useState<SalesOrderDto | null>(null)
    const [reviews, setReviews] = useState<AdminReviewDto[]>([])

    // UI state
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [debugMode, setDebugMode] = useState<boolean>(false)
    const [selectedPeriod, setSelectedPeriod] = useState<string>('last30days')
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Product form state
    const [showProductForm, setShowProductForm] = useState(false)
    const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null)
    const [productFormLoading] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null)
    const [showProductDetails, setShowProductDetails] = useState(false)
    const [productSearchTerm, setProductSearchTerm] = useState<string>('')
    const [productSortBy, setProductSortBy] = useState<'name' | 'price' | 'stock'>('name')
    const [productSortOrder, setProductSortOrder] = useState<'asc' | 'desc'>('asc')

    // Category form state
    const [showCategoryForm, setShowCategoryForm] = useState(false)
    const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null)
    const [categoryFormLoading, setCategoryFormLoading] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(null)
    const [showCategoryDetails, setShowCategoryDetails] = useState(false)

    // Promotion state (placeholder for now since promotions aren't fully implemented)
    const [showPromotionForm, setShowPromotionForm] = useState(false)
    const [editingPromotion, setEditingPromotion] = useState<PromotionDto | null>(null)
    const [selectedPromotion, setSelectedPromotion] = useState<PromotionDto | null>(null)
    const [showPromotionDetails, setShowPromotionDetails] = useState(false)
    const [viewingPromotion, setViewingPromotion] = useState<PromotionDto | null>(null)

    //coupon const [showCouponForm, setShowCouponForm] = useState(false);
    const [coupons, setCoupons] = useState<CouponDto[]>([]);
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<CouponDto | null>(null);
    const [selectedCoupon, setSelectedCoupon] = useState<CouponDto | null>(null);
    const [showCouponDetails, setShowCouponDetails] = useState(false);
    const [couponFormLoading, setCouponFormLoading] = useState(false);



    // Fix String.repeat issues on component mount
    useEffect(() => {
        const originalRepeat = String.prototype.repeat
        String.prototype.repeat = function (count) {
            if (count < 0) {
                console.error('Negative repeat detected:', count)
                return originalRepeat.call(this, 0)
            }
            return originalRepeat.call(this, count)
        }

        return () => {
            String.prototype.repeat = originalRepeat
        }
    }, [])


    // Fixed fetchSalesData function in AdminDashboard.tsx
    // Fixed fetchSalesData function in AdminDashboard.tsx - No 'any' types
    const fetchSalesData = async (period: string) => {
        try {
            console.log('Fetching sales data for period:', period);

            if (period === 'alltime') {
                const allTimeData = await adminAnalyticsService.getAllTimeSales();
                const convertedSummary: SalesSummaryDto = {
                    totalRevenue: allTimeData.allTimeSales.summary.totalRevenue,
                    totalOrders: allTimeData.allTimeSales.summary.totalOrders,
                    totalCustomers: allTimeData.totalCustomers,
                    averageOrderValue: allTimeData.allTimeSales.summary.averageOrderValue,
                    periodStart: allTimeData.allTimeSales.summary.firstOrderDate || '',
                    periodEnd: allTimeData.allTimeSales.summary.lastOrderDate || '',
                    dailyData: [] // Always initialize as empty array for alltime
                };
                setSalesSummary(convertedSummary);
            } else {
                const flexibleData = await adminAnalyticsService.getFlexibleSalesSummary(period);

                if ('allTimeSales' in flexibleData) {
                    // Handle AllTimeSalesDto format
                    const allTimeData = flexibleData as AllTimeSalesDto;
                    const convertedSummary: SalesSummaryDto = {
                        totalRevenue: allTimeData.allTimeSales.summary.totalRevenue,
                        totalOrders: allTimeData.allTimeSales.summary.totalOrders,
                        totalCustomers: allTimeData.totalCustomers,
                        averageOrderValue: allTimeData.allTimeSales.summary.averageOrderValue,
                        periodStart: allTimeData.allTimeSales.summary.firstOrderDate || '',
                        periodEnd: allTimeData.allTimeSales.summary.lastOrderDate || '',
                        dailyData: [] // Always initialize as empty array
                    };
                    setSalesSummary(convertedSummary);
                } else {
                    // Handle SalesSummaryDto format
                    const summaryData = flexibleData as SalesSummaryDto;

                    // Fix the dailyData issue - ensure it's always an array with proper typing
                    let dailyData: Array<{ date: string; revenue: number; orders: number }> = [];

                    if (summaryData.dailyData) {
                        if (Array.isArray(summaryData.dailyData)) {
                            dailyData = summaryData.dailyData;
                        } else if (summaryData.dailyData && typeof summaryData.dailyData === 'object') {
                            // Check if it's in $values format with proper typing
                            const dailyDataObj = summaryData.dailyData as { $values?: Array<{ date: string; revenue: number; orders: number }> };
                            if (dailyDataObj && '$values' in dailyDataObj && Array.isArray(dailyDataObj.$values)) {
                                dailyData = dailyDataObj.$values;
                            } else {
                                console.warn('DailyData is not an array, converting to empty array');
                                dailyData = [];
                            }
                        } else {
                            console.warn('DailyData is not in expected format, converting to empty array');
                            dailyData = [];
                        }
                    }

                    const fixedSummary: SalesSummaryDto = {
                        ...summaryData,
                        dailyData: dailyData
                    };

                    setSalesSummary(fixedSummary);
                }
            }
        } catch (err) {
            console.error('Error fetching sales data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch sales data');

            // Set fallback empty state
            setSalesSummary({
                totalRevenue: 0,
                totalOrders: 0,
                totalCustomers: 0,
                averageOrderValue: 0,
                periodStart: '',
                periodEnd: '',
                dailyData: [] // Always ensure this is an array
            });
        }
    };
    // Fetch sales orders
    const fetchSalesOrders = async (page: number = 1) => {
        try {
            const ordersData = await adminAnalyticsService.getSalesOrders(page, 10);
            setSalesOrders(ordersData);
        } catch (err) {
            console.error('Error fetching sales orders:', err);
            setSalesOrders({
                orders: [],
                pagination: {
                    currentPage: page,
                    pageSize: 10,
                    totalOrders: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            });
        }
    };


    // Add this function to handle sorting
    const handleProductSort = (field: 'name' | 'price' | 'stock') => {
        if (productSortBy === field) {
            setProductSortOrder(productSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setProductSortBy(field);
            setProductSortOrder('asc');
        }
    };
    // Fetch reviews
    // Update the fetchReviews function to use the API endpoint
    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/api/admin/analytics/sales/reviews?page=1&pageSize=20`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data && typeof data === "object" && "$values" in data && Array.isArray(data.$values)) {
                setReviews(data.$values);
            } else if (Array.isArray(data)) {
                setReviews(data);
            } else {
                setReviews([]);
            }
        } catch (err) {
            console.error("Error fetching reviews:", err);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    // Update the handleApproveReview function to use the toggle endpoint
    const handleApproveReview = async (reviewId: number, currentStatus: boolean) => {
        try {
            // Optimistically update UI
            setReviews(reviews.map(review =>
                review.id === reviewId
                    ? {
                        ...review,
                        isApproved: !currentStatus,
                        approvalStatus: !currentStatus ? 'Approved' : 'Pending'
                    }
                    : review
            ));

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/api/admin/analytics/sales/reviews/${reviewId}/toggle-approval`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to update review status');
            }

           await response.json();

            setSuccessMessage(`Review ${currentStatus ? 'disapproved' : 'approved'} successfully`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error updating review status:', error);

            // Revert the optimistic update if there was an error
            setReviews(reviews.map(review =>
                review.id === reviewId ?
                    {
                        ...review,
                        isApproved: currentStatus,
                        approvalStatus: currentStatus ? 'Approved' : 'Pending'
                    } :
                    review
            ));

            setError('Failed to update review status');
            setTimeout(() => setError(null), 5000);
        }
    };

    // Update the handleDeleteReview function to use the correct endpoint
    const handleDeleteReview = async (reviewId: number) => {
        // Find the review for the confirmation message
        const review = reviews.find(r => r.id === reviewId);

        // Confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to delete this review?${review?.title ? `\n\nReview: "${review.title}"` : ''}\n\nThis action cannot be undone.`
        );

        if (!confirmed) return;

        // Keep the original reviews in case we need to restore them on error
        const originalReviews = [...reviews];

        try {
            // Optimistically update UI
            setReviews(reviews.filter(review => review.id !== reviewId));

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/api/admin/analytics/sales/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete review');
            }

            setSuccessMessage('Review deleted successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error deleting review:', error);

            // Restore original reviews on error
            setReviews(originalReviews);

            setError('Failed to delete review');
            setTimeout(() => setError(null), 5000);
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)

                const [
                    productsData,
                    categoriesData,
                    promotionsData,
                    couponsData  // ADD THIS LINE
                ] = await Promise.all([
                    adminService.getProducts().catch(() => []),
                    adminService.getCategories().catch(() => []),
                    adminService.getPromotions().catch(() => []),
                    adminService.getCoupons().catch(() => [])  // ADD THIS LINE
                ])

                setProducts(productsData)
                setCategories(categoriesData)
                setPromotions(promotionsData);
                setCoupons(couponsData);  // ADD THIS LINE

                // Fetch sales data for the default period
                await fetchSalesData(selectedPeriod);
                await fetchReviews();
                await fetchSalesOrders(1);

            } catch (err: unknown) {
                console.error('Error in fetchData:', err)
                setError(err instanceof Error ? err.message : 'Failed to fetch data')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [selectedPeriod])

    // Add this at the top of your AdminDashboard component
    useEffect(() => {
        // Create style element
        const styleElement = document.createElement('style');
        styleElement.setAttribute('id', 'admin-dashboard-style');

        // Define styles with !important to override global CSS
        styleElement.textContent = `
    body {
      background-image: none !important;
    }
    
    body::before {
      display: none !important;
    }
    
    .admin-dashboard-wrapper {
      position: relative;
      min-height: 100vh;
      width: 100%;
      z-index: 1;
    }
    
    .admin-dashboard-bg {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url('${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/uploads/dashboard-background.jpg');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: -2;
    }
    
    .admin-dashboard-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      z-index: -1;
    }
  `;

        // Add to document head
        document.head.appendChild(styleElement);

        // Clean up on component unmount
        return () => {
            const existingStyle = document.getElementById('admin-dashboard-style');
            if (existingStyle) {
                document.head.removeChild(existingStyle);
            }
        };
    }, []);

    // Handle period change
    const handlePeriodChange = async (period: string) => {
        setSelectedPeriod(period);
        setLoading(true);
        try {
            await fetchSalesData(period);
        } finally {
            setLoading(false);
        }
    };

    // Product management handlers
    const handleEditProduct = (product: ProductDto) => {
        setEditingProduct(product);
        setShowProductForm(true);
    };

    const handleViewProduct = async (productId: number) => {
        try {
            setLoading(true);
            const product = await adminService.getProduct(productId);
            console.log('Product details:', product);
            setSelectedProduct(product);
            setShowProductDetails(true);
        } catch (error) {
            console.error('Error fetching product details:', error);
            setError('Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    // Enhanced handleDeleteProduct in AdminDashboard.tsx
    const handleDeleteProduct = async (id: number) => {
        // Find the product to get its name for the confirmation dialog
        const product = products.find(p => p.id === id);
        const productName = product ? product.name : `Product #${id}`;

        // Enhanced confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to delete "${productName}"?\n\n` +
            `This action cannot be undone. The product will be permanently removed from your inventory.`
        );

        if (!confirmed) return;

        // Show loading state
        const originalProducts = [...products];

        try {
            // Optimistically remove from UI
            setProducts(products.filter(product => product.id !== id));

            // Attempt to delete on server
            await adminService.deleteProduct(id);

            // Show success message
            setSuccessMessage(`"${productName}" has been deleted successfully!`);
            setTimeout(() => setSuccessMessage(null), 3000);

            console.log(`Product ${id} deleted successfully`);

        } catch (error) {
            // Restore the original products list on error
            setProducts(originalProducts);

            console.error('Error deleting product:', error);

            // Enhanced error message
            let errorMessage = 'Failed to delete product';

            if (error instanceof Error) {
                const extendedError = error as ExtendedError;

                if (extendedError.status === 404) {
                    errorMessage = 'Product not found. It may have already been deleted.';
                } else if (extendedError.status === 403) {
                    errorMessage = 'You do not have permission to delete this product.';
                } else if (extendedError.status === 409) {
                    errorMessage = 'Cannot delete product. It may be associated with existing orders.';
                } else if (extendedError.status === 500) {
                    errorMessage = 'Server error occurred while deleting the product. Please try again.';
                } else {
                    errorMessage = error.message || 'An unexpected error occurred';
                }

                // Log detailed error information
                if (extendedError.details) {
                    console.error('Delete error details:', extendedError.details);
                }
            }

            setError(`${errorMessage} (${productName})`);

            // Clear error after 5 seconds
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleCloseProductDetails = () => {
        setShowProductDetails(false);
        setSelectedProduct(null);
    };

    // Fixed AdminDashboard.tsx handleProductSubmit with proper types
    // Fixed handlePromotionSubmit function in AdminDashboard.tsx
    // FINAL FIX: This works specifically with your PromotionService
    // Replace your handlePromotionSubmit function with this

    const handlePromotionSubmit = async (
        data: PromotionPayload,
        isEdit: boolean,
        promotionId?: number
    ) => {
        try {
            setLoading(true);
            setError(null);

            // Validate required fields
            if (!data.name || !data.startDate || !data.endDate) {
                throw new Error('Name, start date, and end date are required');
            }

            if (data.productIds.length === 0) {
                throw new Error('At least one product must be selected');
            }

            // Validate date range
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            if (startDate >= endDate) {
                throw new Error('End date must be after start date');
            }

            console.log('=== PROMOTION SERVICE COMPATIBLE SUBMISSION ===');
            console.log('Is editing?', isEdit);
            console.log('Promotion ID:', promotionId);
            console.log('Original promotion:', editingPromotion);
            console.log('Form data:', data);

            // Your PromotionService doesn't validate past dates, so the issue is in DTO validation
            // We need to format dates in a way that matches your server's expectations

            const finalPayload = {
                name: data.name.trim(),
                description: data.description.trim(),
                discountPercentage: Number(data.discountPercentage),
                // ✅ Key fix: Use the exact same date format as your server
                startDate: isEdit && editingPromotion ?
                    editingPromotion.startDate : // Use original server format for edits
                    new Date(data.startDate).toISOString(), // Format for new promotions
                endDate: new Date(data.endDate).toISOString(),
                isActive: Boolean(data.isActive),
                colorScheme: data.colorScheme?.trim() || '',
                type: Number(data.type),
                productIds: data.productIds.map(id => Number(id)),
                bannerImageUrl: data.bannerImageUrl || ''
            };

            console.log('Final payload for your PromotionService:', finalPayload);
            console.log('StartDate being sent:', finalPayload.startDate);
            console.log('EndDate being sent:', finalPayload.endDate);

            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/api/admin/promotions${isEdit && promotionId ? `/${promotionId}` : ''}`;
            const method = isEdit && promotionId ? 'PUT' : 'POST';

            console.log(`Making ${method} request to:`, url);

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(finalPayload)
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                let errorMessage = isEdit ? 'Failed to update promotion' : 'Failed to create promotion';

                try {
                    const errorData = await response.text();
                    console.log('Error response from your controller:', errorData);

                    try {
                        const errorJson = JSON.parse(errorData);

                        // Handle your controller's error format
                        if (errorJson.message) {
                            errorMessage = errorJson.message;
                        } else if (errorJson.errors) {
                            if (Array.isArray(errorJson.errors)) {
                                errorMessage = `Validation errors: ${errorJson.errors.join('; ')}`;
                            } else {
                                const validationErrors = Object.entries(errorJson.errors)
                                    .filter(([key]) => key !== '$id')
                                    .map(([field, errors]) => {
                                        if (Array.isArray(errors)) {
                                            return `${field}: ${errors.join(', ')}`;
                                        }
                                        return `${field}: ${errors}`;
                                    })
                                    .join('; ');
                                errorMessage = `Validation errors: ${validationErrors}`;
                            }
                        }
                    } catch {
                        errorMessage = errorData || errorMessage;
                    }
                } catch {
                    errorMessage = `${errorMessage} (HTTP ${response.status})`;
                }

                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Success! Your PromotionService returned:', result);

            setSuccessMessage(isEdit ? 'Promotion updated successfully!' : 'Promotion created successfully!');

            // Refresh promotions list
            try {
                const updatedPromotions = await adminService.getPromotions();
                setPromotions(updatedPromotions);
            } catch (refreshError) {
                console.warn('Failed to refresh promotions list:', refreshError);
            }

            setShowPromotionForm(false);
            setEditingPromotion(null);
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (error) {
            console.error('Error in promotion submission:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to save promotion';
            setError(errorMessage);
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };
    // Add these category management handlers after handleProductSubmit:

    // Category management handlers
    const handleEditCategory = (category: CategoryDto) => {
        setEditingCategory(category);
        setShowCategoryForm(true);
    };

    const toggleProductVisibility = async (id: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/api/products/${id}/toggle-visibility`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to toggle product visibility');
            }

            // Refresh the products list
            handleRefreshData();
        } catch (error) {
            console.error('Error toggling product visibility:', error);
            setError('Failed to toggle product visibility');
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleViewCategory = async (categoryId: number) => {
        try {
            setLoading(true);
            const category = await categoryService.getCategoryById(categoryId);
            console.log('Category details:', category);
            setSelectedCategory(category);
            setShowCategoryDetails(true);
        } catch (error) {
            console.error('Error fetching category details:', error);
            setError('Failed to load category details');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        // Find the category to get its name for the confirmation dialog
        const category = categories.find(c => c.id === id);
        const categoryName = category ? category.name : `Category #${id}`;

        // Enhanced confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to delete "${categoryName}"?\n\n` +
            `This action cannot be undone. The category will be permanently removed.`
        );

        if (!confirmed) return;

        // Show loading state
        const originalCategories = [...categories];

        try {
            // Optimistically remove from UI
            setCategories(categories.filter(category => category.id !== id));

            // Attempt to delete on server
            await categoryService.deleteCategory(id);

            // Show success message
            setSuccessMessage(`"${categoryName}" has been deleted successfully!`);
            setTimeout(() => setSuccessMessage(null), 3000);

            console.log(`Category ${id} deleted successfully`);

        } catch (error) {
            // Restore the original categories list on error
            setCategories(originalCategories);

            console.error('Error deleting category:', error);

            // Enhanced error message
            let errorMessage = 'Failed to delete category';

            if (error instanceof Error) {
                const extendedError = error as ExtendedError;

                if (extendedError.status === 404) {
                    errorMessage = 'Category not found. It may have already been deleted.';
                } else if (extendedError.status === 403) {
                    errorMessage = 'You do not have permission to delete this category.';
                } else if (extendedError.status === 409) {
                    errorMessage = 'Cannot delete category. It may have products associated with it.';
                } else if (extendedError.status === 500) {
                    errorMessage = 'Server error occurred while deleting the category. Please try again.';
                } else {
                    errorMessage = error.message || 'An unexpected error occurred';
                }

                // Log detailed error information
                if (extendedError.details) {
                    console.error('Delete error details:', extendedError.details);
                }
            }

            setError(`${errorMessage} (${categoryName})`);

            // Clear error after 5 seconds
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleCloseCategoryDetails = () => {
        setShowCategoryDetails(false);
        setSelectedCategory(null);
    };

    const handleCategorySubmit = async (formData: FormData, isEdit: boolean, categoryId?: number) => {
        setCategoryFormLoading(true);

        // Log all FormData entries before sending to backend
        console.log('=== SENDING CATEGORY TO BACKEND ===');
        for (const [key, value] of formData.entries()) {
            console.log('FormData:', key, value);
        }
        console.log('=====================================');

        try {
            let result: CategoryDto;

            if (isEdit && categoryId) {
                result = await categoryService.updateCategory(categoryId, formData);
                setCategories(categories.map(c => c.id === categoryId ? result : c));
                setSuccessMessage('Category updated successfully!');
            } else {
                result = await categoryService.createCategory(formData);
                setCategories([...categories, result]);
                setSuccessMessage('Category created successfully!');
            }

            setShowCategoryForm(false);
            setEditingCategory(null);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error saving category:', error);

            // Enhanced error logging and display
            let errorMessage = 'Failed to save category';

            if (error instanceof Error) {
                console.error('Error message:', error.message);
                errorMessage = error.message;

                // Check if it's our enhanced error with details
                const extendedError = error as ExtendedError;
                if (extendedError.details) {
                    console.error('Error details:', extendedError.details);
                    const details = extendedError.details;

                    // If we have validation errors, show them specifically
                    if (details && typeof details === 'object' && 'errors' in details) {
                        const errors = details.errors as Record<string, unknown>;
                        const validationErrors = Object.entries(errors)
                            .map(([field, fieldErrors]) => {
                                if (Array.isArray(fieldErrors)) {
                                    return `${field}: ${fieldErrors.join(', ')}`;
                                } else if (typeof fieldErrors === 'string') {
                                    return `${field}: ${fieldErrors}`;
                                }
                                return `${field}: ${String(fieldErrors)}`;
                            })
                            .join('; ');
                        errorMessage = `Validation errors: ${validationErrors}`;
                    }
                }

                if (extendedError.status) {
                    console.error('HTTP status:', extendedError.status);
                }
            }

            setError(errorMessage);

            // Keep the form open so user can fix the issues
        } finally {
            setCategoryFormLoading(false);
        }
    };

    const handleRefreshData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [
                productsData,
                categoriesData,
                couponsData  // ADD THIS LINE
            ] = await Promise.all([
                adminService.getProducts(),
                adminService.getCategories().catch(() => []),
                adminService.getCoupons().catch(() => [])  // ADD THIS LINE
            ]);

            setProducts(productsData);
            setCategories(categoriesData);
            setCoupons(couponsData);  // ADD THIS LINE

            await fetchSalesData(selectedPeriod);
            await fetchSalesOrders(1);

            setSuccessMessage('Data refreshed successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error: unknown) {
            console.error('Error refreshing data:', error);
            setError(error instanceof Error ? error.message : 'Failed to refresh data');
        } finally {
            setLoading(false);
        }
    };

    // Handle export data
    const handleExportData = (dataType: string) => {
        switch (dataType) {
            case 'products':
                exportData(products, 'products_export');
                break;
            case 'orders':
                if (salesOrders?.orders) {
                    exportData(salesOrders.orders, 'orders_export');
                }
                break;
            case 'categories':
                exportData(categories, 'categories_export');
                break;
            case 'coupons':                    // ADD THIS CASE
                handleExportCoupons();
                break;
            case 'promotions':
                exportData(promotions, 'promotions_export');
                break;
            case 'reviews':
                exportData(reviews, 'reviews_export');
                break;
            default:
                console.log('Export type not implemented:', dataType);
        }
        setSuccessMessage(`${dataType} exported successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    // Promotion handlers
    const handleAddPromotion = () => {
        setEditingPromotion(null);
        setShowPromotionForm(true); // Fix: Use correct state variable name
    };

    const handleEditPromotion = (promotion: PromotionDto) => { // Fix: Use proper typing instead of 'any'
        setEditingPromotion(promotion);
        setShowPromotionForm(true);
    };

    const handleViewPromotion = (id: number) => { // Fix: Change to number to match component expectations
        const promotion = promotions.find(p => p.id === id); // Convert number to string for comparison if needed
        setViewingPromotion(promotion || null); // Fix: Handle undefined case
    };

    const handleDeletePromotion = async (id: number) => { // Fix: Change to number to match component expectations
        try {
            setLoading(true);

            // Fix: Add the missing deletePromotion method to your adminService
            // For now, let's create a temporary implementation
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/api/admin/promotions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete promotion');
            }

            // Refresh promotions list
            const updatedPromotions = await adminService.getPromotions();
            setPromotions(updatedPromotions);

            setSuccessMessage('Promotion deleted successfully'); // Fix: Use your existing success message system
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error deleting promotion:', error);
            setError('Failed to delete promotion'); // Fix: Use your existing error system
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    // Add the missing handlePromotionSubmit function
    const handleProductSubmit = async (formData: FormData, isEdit: boolean, productId?: number) => {
        // Example implementation, adjust as needed for your backend/service
        try {
            // Set loading state if needed
            // setProductFormLoading(true);

            let result: ProductDto;
            if (isEdit && productId) {
                result = await adminService.updateProduct(productId, formData);
                setProducts(products.map(p => p.id === productId ? result : p));
                setSuccessMessage('Product updated successfully!');
            } else {
                result = await adminService.createProduct(formData);
                setProducts([...products, result]);
                setSuccessMessage('Product created successfully!');
            }

            setShowProductForm(false);
            setEditingProduct(null);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch{

        } finally {
            // setProductFormLoading(false);
        }
    };

    const handleExportPromotions = () => {
        try {
            // Convert promotions to CSV format
            const headers = ['ID', 'Name', 'Description', 'Discount %', 'Start Date', 'End Date', 'Status', 'Type'];
            const csvData = promotions.map(promotion => [
                promotion.id,
                promotion.name,
                promotion.description || '',
                promotion.discountPercentage,
                new Date(promotion.startDate).toLocaleDateString(),
                new Date(promotion.endDate).toLocaleDateString(),
                promotion.isActive ? 'Active' : 'Inactive',
                promotion.type || 'N/A'
            ]);

            // Create CSV content
            const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.map(field => `"${field}"`).join(','))
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `promotions_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('Promotions exported successfully');
        } catch (error) {
            console.error('Error exporting promotions:', error);
            // You might want to show a toast notification here
        }
    };


    const handleAddCoupon = () => {
        setEditingCoupon(null);
        setShowCouponForm(true);
    };

    const handleEditCoupon = (coupon: CouponDto) => {
        setEditingCoupon(coupon);
        setShowCouponForm(true);
    };

    const handleViewCoupon = async (couponId: number) => {
        try {
            setLoading(true);
            const coupon = await adminService.getCoupon(couponId);
            console.log('Coupon details:', coupon);
            setSelectedCoupon(coupon);
            setShowCouponDetails(true);
        } catch (error) {
            console.error('Error fetching coupon details:', error);
            setError('Failed to load coupon details');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCoupon = async (id: number) => {
        // Find the coupon to get its code for the confirmation dialog
        const coupon = coupons.find(c => c.id === id);
        const couponName = coupon ? coupon.code : `Coupon #${id}`;

        // Enhanced confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to delete "${couponName}"?\n\n` +
            `This action cannot be undone. The coupon will be permanently removed.`
        );

        if (!confirmed) return;

        // Show loading state
        const originalCoupons = [...coupons];

        try {
            // Optimistically remove from UI
            setCoupons(coupons.filter(coupon => coupon.id !== id));

            // Attempt to delete on server
            await adminService.deleteCoupon(id);

            // Show success message
            setSuccessMessage(`"${couponName}" has been deleted successfully!`);
            setTimeout(() => setSuccessMessage(null), 3000);

            console.log(`Coupon ${id} deleted successfully`);

        } catch (error) {
            // Restore the original coupons list on error
            setCoupons(originalCoupons);

            console.error('Error deleting coupon:', error);

            // Enhanced error message
            let errorMessage = 'Failed to delete coupon';

            if (error instanceof Error) {
                const extendedError = error as ExtendedError;

                if (extendedError.status === 404) {
                    errorMessage = 'Coupon not found. It may have already been deleted.';
                } else if (extendedError.status === 403) {
                    errorMessage = 'You do not have permission to delete this coupon.';
                } else if (extendedError.status === 409) {
                    errorMessage = 'Cannot delete coupon. It may be associated with existing orders.';
                } else if (extendedError.status === 500) {
                    errorMessage = 'Server error occurred while deleting the coupon. Please try again.';
                } else {
                    errorMessage = error.message || 'An unexpected error occurred';
                }

                // Log detailed error information
                if (extendedError.details) {
                    console.error('Delete error details:', extendedError.details);
                }
            }

            setError(`${errorMessage} (${couponName})`);

            // Clear error after 5 seconds
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleToggleCouponVisibility = async (id: number) => {
        try {
            const updatedCoupon = await adminService.toggleCouponVisibility(id);

            // Update the coupon in the list
            setCoupons(coupons.map(coupon =>
                coupon.id === id ? updatedCoupon : coupon
            ));

            setSuccessMessage(`Coupon ${updatedCoupon.isActive ? 'activated' : 'deactivated'} successfully`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error toggling coupon visibility:', error);
            setError('Failed to toggle coupon visibility');
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleCouponSubmit = async (
        data: {
            code: string;
            description: string;
            discountType: 'Percentage' | 'FixedAmount';
            discountAmount: number;
            minimumOrderAmount: number;
            startDate: string;
            endDate: string;
            usageLimit?: number;
            isActive: boolean;
        },
        isEdit: boolean,
        couponId?: number
    ) => {
        setCouponFormLoading(true);

        try {
            // Validate required fields
            if (!data.code || !data.code.trim()) {
                throw new Error('Coupon code is required');
            }

            if (!data.startDate || !data.endDate) {
                throw new Error('Start date and end date are required');
            }

            // Validate date range
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            if (startDate >= endDate) {
                throw new Error('End date must be after start date');
            }

            console.log('=== COUPON SUBMISSION ===');
            console.log('Is editing?', isEdit);
            console.log('Coupon ID:', couponId);
            console.log('Form data:', data);

            // Create the payload that matches your DTO
            const payload = {
                code: data.code.trim().toUpperCase(),
                description: data.description?.trim() || '',
                discountType: data.discountType,
                discountAmount: Number(data.discountAmount),
                minimumOrderAmount: Number(data.minimumOrderAmount),
                startDate: data.startDate,
                endDate: data.endDate,
                usageLimit: data.usageLimit && data.usageLimit > 0 ? Number(data.usageLimit) : undefined,
                isActive: Boolean(data.isActive)
            };

            console.log('Final payload for your CouponService:', payload);

            let result: CouponDto;

            if (isEdit && couponId) {
                result = await adminService.updateCoupon(couponId, payload);
                setCoupons(coupons.map(c => c.id === couponId ? result : c));
                setSuccessMessage('Coupon updated successfully!');
            } else {
                result = await adminService.createCoupon(payload);
                setCoupons([...coupons, result]);
                setSuccessMessage('Coupon created successfully!');
            }

            setShowCouponForm(false);
            setEditingCoupon(null);
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (error) {
            console.error('Error saving coupon:', error);

            // Enhanced error logging and display
            let errorMessage = 'Failed to save coupon';

            if (error instanceof Error) {
                console.error('Error message:', error.message);
                errorMessage = error.message;

                // Check if it's our enhanced error with details
                const extendedError = error as ExtendedError;
                if (extendedError.details) {
                    console.error('Error details:', extendedError.details);
                    const details = extendedError.details;

                    // If we have validation errors, show them specifically
                    if (details && typeof details === 'object' && 'errors' in details) {
                        const errors = details.errors as Record<string, unknown>;
                        const validationErrors = Object.entries(errors)
                            .map(([field, fieldErrors]) => {
                                if (Array.isArray(fieldErrors)) {
                                    return `${field}: ${fieldErrors.join(', ')}`;
                                } else if (typeof fieldErrors === 'string') {
                                    return `${field}: ${fieldErrors}`;
                                }
                                return `${field}: ${String(fieldErrors)}`;
                            })
                            .join('; ');
                        errorMessage = `Validation errors: ${validationErrors}`;
                    }
                }

                if (extendedError.status) {
                    console.error('HTTP status:', extendedError.status);
                }
            }

            setError(errorMessage);

            // Keep the form open so user can fix the issues
        } finally {
            setCouponFormLoading(false);
        }
    };

    const handleCloseCouponDetails = () => {
        setShowCouponDetails(false);
        setSelectedCoupon(null);
    };

    const handleExportCoupons = () => {
        try {
            // Convert coupons to CSV format
            const headers = ['ID', 'Code', 'Description', 'Discount Type', 'Discount Amount', 'Min Order', 'Start Date', 'End Date', 'Usage Limit', 'Times Used', 'Status'];
            const csvData = coupons.map(coupon => [
                coupon.id,
                coupon.code,
                coupon.description || '',
                coupon.discountType,
                coupon.discountAmount,
                coupon.minimumOrderAmount,
                new Date(coupon.startDate).toLocaleDateString(),
                new Date(coupon.endDate).toLocaleDateString(),
                coupon.usageLimit || 'Unlimited',
                coupon.timesUsed,
                coupon.isActive ? 'Active' : 'Inactive'
            ]);

            // Create CSV content
            const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.map(field => `"${field}"`).join(','))
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `coupons_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setSuccessMessage('Coupons exported successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
            console.log('Coupons exported successfully');
        } catch (error) {
            console.error('Error exporting coupons:', error);
            setError('Failed to export coupons');
            setTimeout(() => setError(null), 5000);
        }
    };

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)

                const [
                    productsData,
                    categoriesData,
                    promotionsData,
                    couponsData  // ADD THIS LINE
                ] = await Promise.all([
                    adminService.getProducts().catch(() => []),
                    adminService.getCategories().catch(() => []),
                    adminService.getPromotions().catch(() => []),
                    adminService.getCoupons().catch(() => [])  // ADD THIS LINE
                ])

                setProducts(productsData)
                setCategories(categoriesData)
                setPromotions(promotionsData);
                setCoupons(couponsData);  // ADD THIS LINE

                // Fetch sales data for the default period
                await fetchSalesData(selectedPeriod);
                await fetchReviews();
                await fetchSalesOrders(1);

            } catch (err: unknown) {
                console.error('Error in fetchData:', err)
                setError(err instanceof Error ? err.message : 'Failed to fetch data')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [selectedPeriod])

    // Add dashboard background styles
    useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.setAttribute('id', 'admin-dashboard-style');

        styleElement.textContent = `
            body {
                background-image: none !important;
            }
            
            body::before {
                display: none !important;
            }
            
            .admin-dashboard-wrapper {
                position: relative;
                min-height: 100vh;
                width: 100%;
                z-index: 1;
            }
            
            .admin-dashboard-bg {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-image: url('${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202'}/uploads/dashboard-background.jpg');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                z-index: -2;
            }
            
            .admin-dashboard-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: -1;
            }
        `;

        document.head.appendChild(styleElement);

        return () => {
            const existingStyle = document.getElementById('admin-dashboard-style');
            if (existingStyle) {
                document.head.removeChild(existingStyle);
            }
        };
    }, []);




    // Loading state
    if (loading) {
        return <LoadingSpinner message="Loading admin dashboard..." />;
    }

    // Error state
    if (error) {
        return <ErrorDisplay error={error} onRetry={() => window.location.reload()} />;
    }

    return (
        <div className="admin-dashboard-wrapper">
            {/* Background image container with overlay */}

            <div className="admin-dashboard-bg"></div>
            <div className="admin-dashboard-overlay"></div>
            {/* Content container with relative positioning to appear above the background */}
            <div className="container mx-auto p-6 max-w-7xl">
                <DashboardHeader
                    title="Admin Dashboard"
                    subtitle="Manage your chocolate store with ease"
                    debugMode={debugMode}
                    onToggleDebug={() => setDebugMode(!debugMode)}
                    onRefresh={handleRefreshData}
                />

                {/* Success Message */}
                {successMessage && (
                    <SuccessMessage
                        message={successMessage}
                        onClose={() => setSuccessMessage(null)}
                    />
                )}

                {/* Period Selector */}
                <PeriodSelector
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={handlePeriodChange}
                    loading={loading}
                />

                {/* Debug Information */}
                {debugMode && salesSummary?.customerBreakdown && (
                    <DebugInfo customerBreakdown={salesSummary.customerBreakdown} />
                )}

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Orders
                        </TabsTrigger>
                        <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
                        <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
                        <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                        <TabsTrigger value="promotions">Promotions ({promotions.length})</TabsTrigger>
                        <TabsTrigger value="coupons">Coupons ({coupons.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8">
                        {/* Main Metrics Cards */}
                        {salesSummary && (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                <MetricCard
                                    title="Total Revenue"
                                    value={formatCurrency(salesSummary.totalRevenue)}
                                    icon={DollarSign}
                                    description={selectedPeriod === 'alltime' ? 'All time' : 'Current period'}
                                    className="bg-gradient-to-br from-blue-500 to-blue-600"
                                />
                                <MetricCard
                                    title="Total Orders"
                                    value={salesSummary.totalOrders.toLocaleString()}
                                    icon={ShoppingCart}
                                    description="Orders processed"
                                    className="bg-gradient-to-br from-emerald-500 to-emerald-600"
                                />
                                <MetricCard
                                    title="Total Customers"
                                    value={salesSummary.totalCustomers.toLocaleString()}
                                    icon={Users}
                                    description={selectedPeriod === 'alltime' ? 'All registered customers' : 'Active customers'}
                                    className="bg-gradient-to-br from-purple-500 to-purple-600"
                                    badge={salesSummary.customerBreakdown && (
                                        <div className="mt-3 pt-3 border-t border-purple-400/30">
                                            <div className="flex justify-between text-xs text-purple-200">
                                                <span>Total Users:</span>
                                                <span>{salesSummary.customerBreakdown.totalUsers}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-purple-200">
                                                <span>Admins:</span>
                                                <span>{salesSummary.customerBreakdown.adminUsers}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-purple-200 font-semibold border-t border-purple-400/20 pt-1 mt-1">
                                                <span>Customers:</span>
                                                <span>{salesSummary.customerBreakdown.customerUsers}</span>
                                            </div>
                                        </div>
                                    )}
                                />
                                <MetricCard
                                    title="Avg Order Value"
                                    value={formatCurrency(salesSummary.averageOrderValue)}
                                    icon={Activity}
                                    description="Per order average"
                                    className="bg-gradient-to-br from-rose-500 to-rose-600"
                                />
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <QuickStat value={products.length} label="total inventory" color="emerald" />
                            <QuickStat value={categories.length} label="product categories" color="purple" />
                            <QuickStat value={coupons.filter(c => c.isActive).length} label="product coupons" color="amber" />
                            <QuickStat value={promotions.filter(p => p.isActive).length} label="product promotions" color="rose" />
                        </div>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-6">
                        <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-6">
                            <h2 className="text-2xl font-bold text-white mb-4">Sales Analytics</h2>

                            {/* Sales metrics summary */}
                            {salesSummary && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-gray-800/50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-400">
                                            {formatCurrency(salesSummary.totalRevenue)}
                                        </div>
                                        <div className="text-sm text-gray-400">Total Revenue</div>
                                    </div>
                                    <div className="bg-gray-800/50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-green-400">
                                            {salesSummary.totalOrders.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-400">Total Orders</div>
                                    </div>
                                    <div className="bg-gray-800/50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-400">
                                            {salesSummary.totalCustomers.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-400">Customers</div>
                                    </div>
                                    <div className="bg-gray-800/50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-rose-400">
                                            {formatCurrency(salesSummary.averageOrderValue)}
                                        </div>
                                        <div className="text-sm text-gray-400">Avg Order Value</div>
                                    </div>
                                </div>
                            )}

                            {/* Charts would go here */}
                            <div className="text-center py-8 text-gray-400">
                                Charts and detailed analytics would be implemented here
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="orders" className="space-y-6">
                        <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-6">
                            {/* Header Controls */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Recent Orders</h2>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleExportData('orders')}
                                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg border border-gray-600"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export Orders
                                    </button>
                                    <div className="text-sm text-gray-400">
                                        {salesOrders
                                            ? `Page ${salesOrders.pagination.currentPage} of ${salesOrders.pagination.totalPages}`
                                            : ''}
                                    </div>
                                </div>
                            </div>

                            {/* Orders List */}
                            {salesOrders && salesOrders.orders.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {salesOrders.orders.map(order => (
                                        <div key={order.orderId} className="bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-lg font-semibold text-white">Order #{order.orderNumber || order.orderId}</h3>
                                                <span className={`text-xs px-2 py-1 rounded ${order.status === 'Completed'
                                                        ? 'bg-emerald-700 text-emerald-200'
                                                        : order.status === 'Pending'
                                                            ? 'bg-yellow-700 text-yellow-200'
                                                            : 'bg-gray-700 text-gray-300'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-400 mb-2">
                                                {new Date(order.orderDate).toLocaleDateString()} • {order.customerName}
                                            </div>

                                            <div className="space-y-1 text-sm text-gray-300 border-t border-gray-700 pt-2">
                                                <div><span className="text-gray-400">Subtotal:</span> {formatCurrency(order.subtotal || 0)}</div>
                                                <div><span className="text-gray-400">Tax:</span> {formatCurrency(order.tax || 0)}</div>
                                                <div><span className="text-gray-400">Shipping:</span> {formatCurrency(order.shippingCost || 0)}</div>
                                                {typeof order.discountAmount === 'number' && order.discountAmount > 0 && (
                                                    <div>
                                                        <span className="text-gray-400">Discount:</span> -{formatCurrency(order.discountAmount ?? 0)}
                                                    </div>
                                                )}
                                                <div className="text-white font-semibold">Total: {formatCurrency(order.totalAmount)}</div>
                                            </div>

                                            <div className="mt-3 text-xs text-gray-400">
                                                Payment: <strong className="text-gray-200">{order.paymentMethod || 'N/A'}</strong> ({order.paymentStatus || 'N/A'})
                                            </div>

                                            <details className="mt-3">
                                                <summary className="cursor-pointer text-emerald-400 text-sm">Items ({order.orderItems.length})</summary>
                                                <ul className="mt-1 pl-4 text-xs text-gray-300 list-disc">
                                                    {order.orderItems.map(item => (
                                                        <li key={item.orderItemId || item.productId}>
                                                            <span className="font-medium">{item.productName}</span> × {item.quantity} @ {formatCurrency(item.unitPrice)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </details>

                                            {order.orderNotes && (
                                                <div className="mt-3 text-xs text-gray-400 bg-gray-700/30 p-2 rounded">
                                                    <strong>Notes:</strong> {order.orderNotes}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={ShoppingCart}
                                    title="No orders found"
                                    description="Orders will appear here once customers start purchasing"
                                />
                            )}
                        </div>
                    </TabsContent>


                    <TabsContent value="products" className="space-y-6">
                        <ProductForm
                            isOpen={showProductForm}
                            onClose={() => {
                                setShowProductForm(false);
                                setEditingProduct(null);
                            }}
                            editingProduct={editingProduct}
                            categories={categories}
                            onSubmit={handleProductSubmit}
                            loading={productFormLoading}
                        />

                        {/* Add Product Search & Filter Bar */}
                        <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-4 mb-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search products by name or description..."
                                        value={productSearchTerm}
                                        onChange={(e) => setProductSearchTerm(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleProductSort('name')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${productSortBy === 'name'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        Name {productSortBy === 'name' && (productSortOrder === 'asc' ? '↑' : '↓')}
                                    </button>
                                    <button
                                        onClick={() => handleProductSort('price')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${productSortBy === 'price'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        Price {productSortBy === 'price' && (productSortOrder === 'asc' ? '↑' : '↓')}
                                    </button>
                                    <button
                                        onClick={() => handleProductSort('stock')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${productSortBy === 'stock'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        Stock {productSortBy === 'stock' && (productSortOrder === 'asc' ? '↑' : '↓')}
                                    </button>
                                    <button
                                        onClick={() => setProductSearchTerm('')}
                                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                                        disabled={!productSearchTerm}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>


                        <ProductList
                            products={products
                                .filter(product =>
                                    productSearchTerm === '' ||
                                    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                                    (product.description && product.description.toLowerCase().includes(productSearchTerm.toLowerCase()))
                                )
                                .sort((a, b) => {
                                    let comparison = 0;

                                    if (productSortBy === 'name') {
                                        comparison = a.name.localeCompare(b.name);
                                    } else if (productSortBy === 'price') {
                                        comparison = a.price - b.price;
                                    } else if (productSortBy === 'stock') {
                                        comparison = a.stockQuantity - b.stockQuantity;
                                    }

                                    return productSortOrder === 'asc' ? comparison : -comparison;
                                })
                            }
                            onEdit={handleEditProduct}
                            onDelete={handleDeleteProduct}
                            onView={handleViewProduct}
                            onAdd={() => setShowProductForm(true)}
                            onExport={() => handleExportData('products')}
                            onToggleVisibility={toggleProductVisibility}
                        />
                    </TabsContent>

                    <TabsContent value="categories" className="space-y-6">
                        <CategoryForm
                            isOpen={showCategoryForm}
                            onClose={() => {
                                setShowCategoryForm(false);
                                setEditingCategory(null);
                            }}
                            editingCategory={editingCategory}
                            onSubmit={handleCategorySubmit}
                            loading={categoryFormLoading}
                        />

                        <CategoryList
                            categories={categories}
                            onEdit={handleEditCategory}
                            onDelete={handleDeleteCategory}
                            onView={handleViewCategory}
                            onAdd={() => setShowCategoryForm(true)}
                            onExport={() => handleExportData('categories')}
                        />
                    </TabsContent>

                    <TabsContent value="reviews" className="space-y-6">
                        <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Reviews Management</h2>
                                <button
                                    onClick={() => handleExportData('reviews')}
                                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg border border-gray-600"
                                >
                                    <Download className="h-4 w-4" />
                                    Export Reviews
                                </button>
                            </div>

                            {reviews.length > 0 ? (
                                <div className="space-y-6">
                                    {/* Reviews Filter/Search Controls would go here */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {reviews.map(review => (
                                            <div
                                                key={review.id}
                                                className="bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-sm"
                                            >
                                                {/* Your existing review card content */}
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-white truncate">
                                                            {review.title || "Review #" + review.id}
                                                        </h3>
                                                        <div className="flex items-center mt-1">
                                                            <div className="flex">
                                                                {[0, 1, 2, 3, 4].map(i => (
                                                                    <span
                                                                        key={i}
                                                                        className={`text-lg ${i < Math.max(0, (review.rating || 0)) ? 'text-yellow-400' : 'text-gray-600'}`}
                                                                    >
                                                                        ★
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <span className="ml-2 text-sm text-gray-400">
                                                                ({review.rating}/5)
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded-full ${review.isApproved
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {review.approvalStatus}
                                                    </span>
                                                </div>

                                                <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                                                    {review.comment}
                                                </p>

                                                <div className="space-y-2 text-xs text-gray-400">
                                                    <div className="flex justify-between">
                                                        <span>Product:</span>
                                                        <span className="font-medium text-blue-400">{review.productName}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Customer:</span>
                                                        <span>{review.userName}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Date:</span>
                                                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Verified Purchase:</span>
                                                        <span>{review.isVerifiedPurchase ? "Yes" : "No"}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between">
                                                    <button
                                                        onClick={() => handleApproveReview(review.id, review.isApproved)}
                                                        className={`px-3 py-1 text-xs rounded-md ${review.isApproved
                                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                                            }`}
                                                    >
                                                        {review.isApproved ? 'Disapprove' : 'Approve'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteReview(review.id)}
                                                        className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                // ✅ Fixed EmptyState - Replace with simple div
                                <div className="text-center py-8 text-gray-400">
                                    <div className="mb-4 flex justify-center">
                                        <MessageSquare className="h-12 w-12 text-gray-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
                                    <p>Reviews will appear here as customers submit them</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="promotions" className="space-y-6">
                        <PromotionForm
                            isOpen={showPromotionForm}
                            onClose={() => {
                                setShowPromotionForm(false);
                                setEditingPromotion(null);
                            }}
                            editingPromotion={editingPromotion}
                            products={products}
                            onSubmit={handlePromotionSubmit}
                            loading={loading}
                        />

                        <PromotionList
                            promotions={promotions}
                            onEdit={handleEditPromotion}
                            onDelete={handleDeletePromotion}
                            onView={handleViewPromotion}
                            onAdd={handleAddPromotion}
                            onExport={handleExportPromotions}
                        />

                        {viewingPromotion && (
                            <PromotionDetailsModal
                                promotion={viewingPromotion}
                                isOpen={!!viewingPromotion}
                                onClose={() => setViewingPromotion(null)}
                            />
                        )}
                    </TabsContent>
                    <TabsContent value="coupons" className="space-y-6">
                        <CouponForm
                            isOpen={showCouponForm}
                            onClose={() => {
                                setShowCouponForm(false);
                                setEditingCoupon(null);
                            }}
                            editingCoupon={editingCoupon}
                            onSubmit={handleCouponSubmit}
                            loading={couponFormLoading}
                        />

                        <CouponList
                            coupons={coupons}
                            onEdit={handleEditCoupon}
                            onDelete={handleDeleteCoupon}
                            onView={handleViewCoupon}
                            onAdd={handleAddCoupon}
                            onExport={handleExportCoupons}
                            onToggleVisibility={handleToggleCouponVisibility}
                        />
                    </TabsContent>
                </Tabs>
                {/* ADD THE MODAL HERE - This is where you're missing it! */}
                <ProductDetailsModal
                    product={selectedProduct}
                    isOpen={showProductDetails}
                    onClose={handleCloseProductDetails}
                />

                <CategoryDetailsModal
                    category={selectedCategory}
                    isOpen={showCategoryDetails}
                    onClose={handleCloseCategoryDetails}
                />

                <PromotionDetailsModal
                    promotion={selectedPromotion}
                    isOpen={showPromotionDetails}
                    onClose={() => {
                        setShowPromotionDetails(false);
                        setSelectedPromotion(null);
                    }}
                />
                <CouponDetailsModal
                    coupon={selectedCoupon}
                    isOpen={showCouponDetails}
                    onClose={handleCloseCouponDetails}
                />
            </div>
        </div>
    )
}

export default AdminDashboard