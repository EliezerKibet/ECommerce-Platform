'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { destroyCookie } from 'nookies';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useReviews } from '@/hooks/useReviews';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

// Order item type for better type safety
type OrderItem = {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
};

interface Order {
    id: number;
    orderNumber: string;
    status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    total: number;
    subtotal?: number;
    tax?: number;
    shippingCost?: number;
    discountAmount?: number;
    orderDate: string;
    userId: string;
    customerEmail?: string;
    customerName?: string;
    shippingMethod?: string;
    paymentMethod?: string;
    couponCode?: string | null;
    shippingAddress?: {
        fullName: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state?: string;
        zipCode: string;
        country: string;
        phoneNumber?: string;
    };
    orderItems?: OrderItem[];
}

interface ReviewDto {
    id: number;
    productId: number;
    userId: string;
    userName: string;
    rating: number;
    title?: string;
    comment: string;
    createdAt: string;
    updatedAt?: string;
}

interface CreateReviewDto {
    rating: number;
    title: string;
    comment: string;
}

// Interface for raw API response data
interface ApiOrderResponse {
    id?: number;
    orderNumber?: string | null;
    status?: string;
    total?: number;
    totalAmount?: number;
    subtotal?: number;
    tax?: number;
    shippingCost?: number;
    discountAmount?: number;
    orderDate?: string;
    userId?: string;
    customerEmail?: string;
    customerName?: string;
    shippingName?: string;
    shippingAddressLine1?: string;
    shippingAddressLine2?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingZipCode?: string;
    shippingCountry?: string;
    shippingPhoneNumber?: string;
    shippingMethod?: string;
    paymentMethod?: string;
    couponCode?: string | null;
    orderItems?: ApiOrderItemResponse[] | { $values: ApiOrderItemResponse[] };
}

interface ApiOrderItemResponse {
    id?: number;
    productId?: number;
    productName?: string;
    quantity?: number;
    price?: number;
    unitPrice?: number;
    subtotal?: number;
    total?: number;
    lineTotal?: number;
    amount?: number;
}

export default function OrderRedirectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Optimized review hook
    const {
        userReviews,
        loading: reviewsLoading,
        submitting: reviewSubmitting,
        checkUserReviews,
        submitReview,
        getUserReview
    } = useReviews();

    // Review modal states
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [currentReviewProduct, setCurrentReviewProduct] = useState<{
        productId: number;
        productName: string;
        orderId: number;
    } | null>(null);
    const [reviewForm, setReviewForm] = useState<CreateReviewDto>({
        rating: 5,
        title: '',
        comment: ''
    });
    const [editingReview, setEditingReview] = useState<ReviewDto | null>(null);

    // Get redirect parameters
    const orderId = searchParams.get('orderId');
    const action = searchParams.get('action');

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202';

    // Extract unique product IDs from orders
    const productIds = useMemo(() => {
        if (!orders.length) return [];

        const uniqueIds = new Set<number>();
        orders.forEach(order => {
            order.orderItems?.forEach(item => {
                if (item.productId) {
                    uniqueIds.add(item.productId);
                }
            });
        });

        return Array.from(uniqueIds);
    }, [orders]);

    // Check user reviews when orders are loaded (OPTIMIZED)
    useEffect(() => {
        if (productIds.length > 0 && user?.id) {
            console.log('🔍 Checking reviews for order products:', productIds);
            checkUserReviews(productIds);
        }
    }, [productIds, user?.id, checkUserReviews]);

    // Helper function to safely format currency
    const formatCurrency = (value: number | undefined | null): string => {
        if (value === null || value === undefined || isNaN(value)) {
            return '$0.00';
        }
        return `$${Number(value).toFixed(2)}`;
    };

    // Optimized review submission
    const handleSubmitReview = async () => {
        if (!currentReviewProduct) return;

        if (!user || !user.id) {
            toast.error('You must be logged in to submit a review');
            return;
        }

        if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
            toast.error('Please provide a rating between 1 and 5 stars');
            return;
        }

        if (!reviewForm.comment || reviewForm.comment.trim().length < 10) {
            toast.error('Please provide a comment with at least 10 characters');
            return;
        }

        if (!reviewForm.title || reviewForm.title.trim().length === 0) {
            toast.error('Please provide a title for your review');
            return;
        }

        if (reviewForm.title.length > 100) {
            toast.error('Title must be 100 characters or less');
            return;
        }

        if (reviewForm.comment.length > 1000) {
            toast.error('Comment must be 1000 characters or less');
            return;
        }

        try {
            const result = await submitReview(
                currentReviewProduct.productId,
                reviewForm,
                editingReview?.id
            );

            if (result.success) {
                toast.success(editingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
                closeReviewModal();

                // Refresh the specific product review
                setTimeout(() => {
                    getUserReview(currentReviewProduct.productId);
                }, 500);
            } else {
                toast.error(result.error || 'Failed to submit review');
            }
        } catch (error) {
            console.error('❌ Error submitting review:', error);
            toast.error('An error occurred while submitting your review');
        }
    };

    // Delete review
    const handleDeleteReview = async (productId: number, reviewId: number) => {
        if (!confirm('Are you sure you want to delete this review?')) return;

        try {
            const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('token='));
            const token = tokenCookie ? tokenCookie.split('=')[1] : '';

            const response = await fetch(
                `${API_BASE_URL}/api/products/${productId}/reviews/${reviewId}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                }
            );

            if (response.ok) {
                toast.success('Review deleted successfully!');

                // Refresh the specific product review
                setTimeout(() => {
                    getUserReview(productId);
                }, 500);
            } else {
                const errorText = await response.text();
                toast.error(errorText || 'Failed to delete review');
            }
        } catch (error) {
            console.error('❌ Error deleting review:', error);
            toast.error('An error occurred while deleting your review');
        }
    };

    // Open review modal for new review
    const openReviewModal = (productId: number, productName: string, orderId: number) => {
        setCurrentReviewProduct({ productId, productName, orderId });
        setEditingReview(null);
        setReviewForm({ rating: 5, title: '', comment: '' });
        setShowReviewModal(true);
    };

    // Open review modal for editing
    const openEditReviewModal = (review: ReviewDto, productName: string) => {
        setCurrentReviewProduct({
            productId: review.productId,
            productName,
            orderId: 0
        });
        setEditingReview(review);
        setReviewForm({
            rating: review.rating,
            title: review.title || '',
            comment: review.comment
        });
        setShowReviewModal(true);
    };

    // Close review modal
    const closeReviewModal = () => {
        setShowReviewModal(false);
        setCurrentReviewProduct(null);
        setEditingReview(null);
        setReviewForm({ rating: 5, title: '', comment: '' });
    };

    // Check if product can be reviewed
    const canReviewProduct = (): boolean => {
        return true; // For demo: allow reviews for all orders
    };

    // Get auth headers for API calls
    const getAuthHeaders = (): Record<string, string> => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (typeof document !== 'undefined') {
            const tokenCookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('token='));

            if (tokenCookie) {
                const token = tokenCookie.split('=')[1];
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    };

    // Fetch orders
    const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
            const headers = getAuthHeaders();

            const response = await fetch(`${API_BASE_URL}/api/Checkout/orders`, {
                method: 'GET',
                headers,
                credentials: 'include',
                mode: 'cors',
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Orders API response:', data);

                let ordersArray = [];

                if (Array.isArray(data)) {
                    ordersArray = data;
                } else if (data && Array.isArray(data.$values)) {
                    ordersArray = data.$values;
                } else if (data && data.orders && Array.isArray(data.orders)) {
                    ordersArray = data.orders;
                } else if (data && data.Orders && Array.isArray(data.Orders)) {
                    ordersArray = data.Orders;
                } else if (data && (data.message || data.Message)) {
                    ordersArray = [];
                } else if (data && typeof data === 'object' && data.id) {
                    ordersArray = [data];
                } else {
                    ordersArray = [];
                }

                const sanitizedOrders = ordersArray.map((order: ApiOrderResponse) => {
                    let orderItems: ApiOrderItemResponse[] = [];
                    if (order.orderItems) {
                        if (Array.isArray(order.orderItems)) {
                            orderItems = order.orderItems;
                        } else if (order.orderItems.$values && Array.isArray(order.orderItems.$values)) {
                            orderItems = order.orderItems.$values;
                        }
                    }

                    return {
                        id: order.id || 0,
                        orderNumber: order.orderNumber || `ORD-${order.id}`,
                        status: (order.status as Order['status']) || 'Pending',
                        total: order.totalAmount || order.total || 0,
                        subtotal: order.subtotal || 0,
                        tax: order.tax || 0,
                        shippingCost: order.shippingCost || 0,
                        discountAmount: order.discountAmount || 0,
                        orderDate: order.orderDate || new Date().toISOString(),
                        userId: order.userId || '',
                        customerEmail: order.customerEmail,
                        customerName: order.customerName || order.shippingName,
                        shippingMethod: order.shippingMethod,
                        paymentMethod: order.paymentMethod,
                        couponCode: order.couponCode,
                        shippingAddress: {
                            fullName: order.shippingName || '',
                            addressLine1: order.shippingAddressLine1 || '',
                            addressLine2: order.shippingAddressLine2 || '',
                            city: order.shippingCity || '',
                            state: order.shippingState || '',
                            zipCode: order.shippingZipCode || '',
                            country: order.shippingCountry || '',
                            phoneNumber: order.shippingPhoneNumber || ''
                        },
                        orderItems: orderItems.map((item: ApiOrderItemResponse): OrderItem => {
                            const quantity = item.quantity || 1;
                            const directPrice = item.price || item.unitPrice || 0;
                            const subtotalValue = item.subtotal || item.total || 0;
                            const calculatedPrice = quantity > 0 ? subtotalValue / quantity : 0;
                            const finalPrice = directPrice > 0 ? directPrice : calculatedPrice;

                            return {
                                id: item.id || 0,
                                productId: item.productId || 0,
                                productName: item.productName || 'Unknown Product',
                                quantity,
                                price: finalPrice,
                                subtotal: subtotalValue
                            };
                        })
                    };
                });

                setOrders(sanitizedOrders);
            } else if (response.status === 401) {
                toast.error('Please log in to view your orders');
                router.push('/auth/login');
            } else if (response.status === 404) {
                setOrders([]);
            } else {
                const errorText = await response.text();
                console.error('Failed to fetch orders:', response.status, errorText);
                toast.error('Failed to fetch orders');
                setOrders([]);
            }
        } catch (fetchError) {
            console.error('Error fetching orders:', fetchError);
            toast.error('Error loading orders');
            setOrders([]);
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleOrderAction = (order: Order, actionType: string | null) => {
        switch (actionType) {
            case 'track':
                toast.success(`Tracking order ${order.orderNumber}`);
                break;
            case 'reorder':
                toast.success(`Added items from order ${order.orderNumber} to cart`);
                router.push('/cart');
                break;
            case 'view':
            default:
                toast.success(`Viewing order ${order.orderNumber}`);
                break;
        }
    };

    const handleLogout = () => {
        destroyCookie(null, 'token');
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
        }
        toast.success('Logged out successfully');
        router.push('/');
        router.refresh();
    };

    const getStatusColor = (status: Order['status']) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'text-yellow-400 bg-yellow-400/20';
            case 'processing':
                return 'text-blue-400 bg-blue-400/20';
            case 'shipped':
                return 'text-purple-400 bg-purple-400/20';
            case 'delivered':
                return 'text-green-400 bg-green-400/20';
            case 'cancelled':
                return 'text-red-400 bg-red-400/20';
            default:
                return 'text-gray-400 bg-gray-400/20';
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const renderStars = (rating: number, interactive: boolean = false, onChange?: (rating: number) => void) => {
        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={!interactive}
                        onClick={() => interactive && onChange && onChange(star)}
                        className={`text-xl ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform ${star <= rating ? 'text-[#f8c15c]' : 'text-[#c89b6a]/30'
                            }`}
                    >
                        ★
                    </button>
                ))}
            </div>
        );
    };

    // Render order item with review functionality
    const renderOrderItem = (item: OrderItem, order: Order) => {
        if (!item) return null;

        const existingReview = userReviews[item.productId];
        const canReview = canReviewProduct();

        return (
            <div key={item.id} className="bg-[#2a211c]/30 rounded-lg p-3 border border-[#c89b6a]/20">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h4 className="text-[#f3d5a5] font-semibold text-base">
                            {item.productName || 'Unknown Product'}
                        </h4>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-[#c89b6a]">
                                <strong>Quantity:</strong> {item.quantity || 0}
                            </span>
                            <span className="text-[#c89b6a]">
                                <strong>Unit Price:</strong> {formatCurrency(item.price)}
                            </span>
                        </div>

                        {/* Review Section */}
                        <div className="mt-3 pt-3 border-t border-[#c89b6a]/20">
                            {existingReview ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#c89b6a] text-sm font-medium">Your Review:</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditReviewModal(existingReview, item.productName)}
                                                className="text-[#f8c15c] hover:text-[#c89b6a] text-xs transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteReview(item.productId, existingReview.id)}
                                                className="text-red-400 hover:text-red-300 text-xs transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {renderStars(existingReview.rating)}
                                        <span className="text-[#f3d5a5] text-sm">
                                            ({existingReview.rating}/5)
                                        </span>
                                    </div>
                                    {existingReview.title && (
                                        <p className="text-[#f8c15c] text-sm font-medium">
                                            &ldquo;{existingReview.title}&rdquo;
                                        </p>
                                    )}
                                    <p className="text-[#c89b6a] text-sm">
                                        &ldquo;{existingReview.comment}&rdquo;
                                    </p>
                                    <p className="text-[#c89b6a]/70 text-xs">
                                        Reviewed on {formatDate(existingReview.createdAt)}
                                    </p>
                                </div>
                            ) : canReview ? (
                                <button
                                    onClick={() => openReviewModal(item.productId, item.productName, order.id)}
                                    className="bg-[#c89b6a]/20 hover:bg-[#c89b6a]/30 text-[#f8c15c] px-3 py-1 rounded text-sm transition-colors border border-[#c89b6a]/40"
                                >
                                    Write a Review
                                </button>
                            ) : (
                                <span className="text-[#c89b6a]/70 text-sm italic">
                                    {!user ? 'Login required to review' : 'Reviews available for registered users'}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[#f3d5a5] font-bold">
                            {formatCurrency(item.subtotal || (item.price * item.quantity))}
                        </div>
                        <div className="text-xs text-[#c89b6a]">Subtotal</div>
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
                fetchOrders();
            } else {
                router.push('/auth/login');
            }
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        if (orderId && orders.length > 0) {
            const order = orders.find(o => o.id.toString() === orderId);
            if (order) {
                setSelectedOrder(order);
                handleOrderAction(order, action);
            } else {
                toast.error('Order not found');
            }
        }
    }, [orderId, orders, action]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1a1713]">
                <div className="w-8 h-8 border-2 border-[#c89b6a] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen dashboard-bg px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center space-x-2 text-[#c89b6a] hover:text-[#f8c15c] transition-colors group"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-medium">Back to Home</span>
                    </Link>
                </div>

                {/* Header */}
                <div className="bg-[#1a1713]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#c89b6a]/30 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#c89b6a] to-[#f8c15c] rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-[#1a1713] font-bold text-xl">
                                    {user.firstName?.[0]?.toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#f3d5a5]">My Orders</h1>
                                <p className="text-[#c89b6a]">Hi, {user.firstName}!</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                href="/profile"
                                className="bg-[#c89b6a] hover:bg-[#b48a5a] text-[#1a1713] font-bold py-2 px-4 rounded-md transition duration-300"
                            >
                                Profile
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Selected Order Details */}
                {selectedOrder && (
                    <div className="bg-[#1a1713]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#c89b6a]/30 p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[#f3d5a5]">Order Details</h2>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-[#c89b6a] hover:text-[#f3d5a5] transition duration-300"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[#c89b6a]">Order Number:</span>
                                <span className="text-[#f3d5a5] font-bold">{selectedOrder.orderNumber || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#c89b6a]">Status:</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                                    {selectedOrder.status ? selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1) : 'Unknown'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#c89b6a]">Total:</span>
                                <span className="text-[#f3d5a5] font-bold">{formatCurrency(selectedOrder.total)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#c89b6a]">Date:</span>
                                <span className="text-[#f3d5a5]">{formatDate(selectedOrder.orderDate)}</span>
                            </div>

                            <div className="border-t border-[#c89b6a]/30 pt-4">
                                <h3 className="text-[#f3d5a5] font-bold mb-3">Order Items</h3>
                                {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedOrder.orderItems.map((item) =>
                                            renderOrderItem(item, selectedOrder)
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <p className="text-[#c89b6a] mb-2">No items found in this order</p>
                                        <p className="text-[#c89b6a] text-sm">This might be an incomplete order or a data sync issue.</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => handleOrderAction(selectedOrder, 'track')}
                                    className="flex-1 bg-[#c89b6a] hover:bg-[#b48a5a] text-[#1a1713] font-bold py-2 px-4 rounded-md transition duration-300"
                                >
                                    Track Order
                                </button>
                                <button
                                    onClick={() => handleOrderAction(selectedOrder, 'reorder')}
                                    className="flex-1 bg-[#f8c15c] hover:bg-[#c89b6a] text-[#1a1713] font-bold py-2 px-4 rounded-md transition duration-300"
                                >
                                    Reorder
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Orders List */}
                <div className="bg-[#1a1713]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#c89b6a]/30 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-[#f3d5a5]">Order History</h2>
                        {reviewsLoading && (
                            <div className="flex items-center gap-2 text-[#c89b6a] text-sm">
                                <div className="w-4 h-4 border-2 border-[#c89b6a] border-t-transparent rounded-full animate-spin"></div>
                                Loading reviews...
                            </div>
                        )}
                    </div>

                    {ordersLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-6 h-6 border-2 border-[#c89b6a] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : Array.isArray(orders) && orders.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-[#c89b6a] mb-4">No orders yet</p>
                            <Link
                                href="/products"
                                className="bg-[#c89b6a] hover:bg-[#b48a5a] text-[#1a1713] font-bold py-2 px-6 rounded-md transition duration-300 inline-block"
                            >
                                Shop Products
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Array.isArray(orders) && orders.length > 0 ? orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="border border-[#c89b6a]/30 rounded-lg p-4 hover:bg-[#2a211c]/50 transition duration-300 cursor-pointer"
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-[#f3d5a5] font-bold">{order.orderNumber || 'N/A'}</h3>
                                            <p className="text-[#c89b6a] text-sm">{formatDate(order.orderDate)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                                {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                                            </span>
                                            <p className="text-[#f3d5a5] font-bold mt-1">{formatCurrency(order.total)}</p>
                                        </div>
                                    </div>
                                    <div className="text-[#c89b6a] text-sm space-y-1">
                                        <div>{order.orderItems?.length || 0} item{(order.orderItems?.length || 0) !== 1 ? 's' : ''}</div>
                                        {order.orderItems && order.orderItems.length > 0 && (
                                            <div className="text-xs">
                                                {order.orderItems.slice(0, 2).map((item, index) => (
                                                    <div key={index}>
                                                        {item.productName} (x{item.quantity})
                                                    </div>
                                                ))}
                                                {order.orderItems.length > 2 && (
                                                    <div>+ {order.orderItems.length - 2} more items</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12">
                                    <p className="text-[#c89b6a] mb-4">No orders yet</p>
                                    <Link
                                        href="/products"
                                        className="bg-[#c89b6a] hover:bg-[#b48a5a] text-[#1a1713] font-bold py-2 px-6 rounded-md transition duration-300 inline-block"
                                    >
                                        Shop Products
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Review Modal */}
                {showReviewModal && currentReviewProduct && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-[#1a1713] rounded-2xl shadow-2xl border border-[#c89b6a]/30 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-[#f3d5a5]">
                                    {editingReview ? 'Edit Review' : 'Write a Review'}
                                </h3>
                                <button
                                    onClick={closeReviewModal}
                                    className="text-[#c89b6a] hover:text-[#f3d5a5] transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="mb-4">
                                <h4 className="text-[#f3d5a5] font-semibold mb-2">
                                    {currentReviewProduct.productName}
                                </h4>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleSubmitReview(); }}>
                                {/* Rating */}
                                <div className="mb-6">
                                    <label className="block text-[#c89b6a] font-medium mb-2">
                                        Rating *
                                    </label>
                                    <div className="flex items-center gap-3">
                                        {renderStars(reviewForm.rating, true, (rating) =>
                                            setReviewForm(prev => ({ ...prev, rating }))
                                        )}
                                        <span className="text-[#f3d5a5] text-sm">
                                            ({reviewForm.rating}/5)
                                        </span>
                                    </div>
                                </div>

                                {/* Title Field */}
                                <div className="mb-6">
                                    <label className="block text-[#c89b6a] font-medium mb-2">
                                        Review Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={reviewForm.title}
                                        onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Give your review a title..."
                                        className="w-full bg-[#2a211c]/80 border border-[#c89b6a]/30 rounded-lg px-3 py-2 text-[#f3d5a5] placeholder-[#c89b6a]/70 focus:outline-none focus:ring-2 focus:ring-[#f8c15c] focus:border-transparent"
                                        required
                                        maxLength={100}
                                    />
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[#c89b6a]/70 text-xs">
                                            Required field
                                        </span>
                                        <span className="text-[#c89b6a]/70 text-xs">
                                            {reviewForm.title.length}/100
                                        </span>
                                    </div>
                                </div>

                                {/* Comment */}
                                <div className="mb-6">
                                    <label className="block text-[#c89b6a] font-medium mb-2">
                                        Review Comment *
                                    </label>
                                    <textarea
                                        value={reviewForm.comment}
                                        onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                        placeholder="Share your experience with this product..."
                                        className="w-full bg-[#2a211c]/80 border border-[#c89b6a]/30 rounded-lg px-3 py-2 text-[#f3d5a5] placeholder-[#c89b6a]/70 focus:outline-none focus:ring-2 focus:ring-[#f8c15c] focus:border-transparent resize-vertical min-h-[100px]"
                                        required
                                        minLength={10}
                                        maxLength={1000}
                                    />
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[#c89b6a]/70 text-xs">
                                            Minimum 10 characters
                                        </span>
                                        <span className="text-[#c89b6a]/70 text-xs">
                                            {reviewForm.comment.length}/1000
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={closeReviewModal}
                                        className="flex-1 bg-[#2a211c]/80 hover:bg-[#2a211c] text-[#c89b6a] font-medium py-2 px-4 rounded-lg transition duration-300 border border-[#c89b6a]/30"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!reviewForm.comment.trim() || reviewForm.comment.length < 10 || !reviewForm.title.trim() || reviewSubmitting}
                                        className="flex-1 bg-[#c89b6a] hover:bg-[#f8c15c] disabled:bg-[#c89b6a]/50 disabled:cursor-not-allowed text-[#1a1713] font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2"
                                    >
                                        {reviewSubmitting && (
                                            <div className="w-4 h-4 border-2 border-[#1a1713] border-t-transparent rounded-full animate-spin"></div>
                                        )}
                                        {editingReview ? 'Update Review' : 'Submit Review'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}