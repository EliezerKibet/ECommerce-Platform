/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, Gift, ShoppingBag, ArrowRight, Heart, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { ProductDto } from '../../services/adminServices';
import { useRouter } from 'next/navigation';
interface CartItem {
    id: number;
    productId: number;
    productName: string;
    productImageUrl: string;
    productPrice: number;
    quantity: number;
    lineTotal: number;
    isGiftWrapped: boolean;
    giftMessage: string;
    cocoaPercentage?: number;
    origin?: string;
}

interface Cart {
    id: number;
    userId: string;
    items: CartItem[];
    totalAmount: number;
    totalItems: number;
    createdAt: string;
    lastModified: string;
    subtotalAmount?: number;
    taxAmount?: number;
}

interface UpdatingState {
    [key: number]: boolean;
}

interface AspNetResponse {
    $id?: string;
    id: number;
    userId: string;
    createdAt: string;
    updatedAt: string;
    items: {
        $id: string;
        $values: CartItem[];
    } | CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    itemCount: number;
}

interface ShippingAddress {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
    email?: string;
    phoneNumber?: string;
}

interface SavedAddress extends ShippingAddress {
    id: number;
    userId: string;
    isDefault: boolean;
    nickname?: string;
    lastUsed?: string;
}

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

interface CheckoutFormData {
    shippingAddress: ShippingAddress;
    savedAddressId?: number;
    saveAddress: boolean;
    orderNotes: string;
    couponCode: string;
    customerEmail: string;
}

interface CouponValidationResult {
    isValid: boolean;
    discountAmount: number;
    finalAmount: number;
    message: string;
    coupon?: {
        id: number;
        code: string;
        description: string;
        discountType: string;
        discountAmount: number;
        minimumOrderAmount: number;
        startDate: string;
        endDate: string;
        usageLimit?: number;
        timesUsed: number;
        isActive: boolean;
    };
}

interface Promotion {
    id: number;
    name: string;
    description: string;
    discountPercentage: number; 
    startDate: string;
    endDate: string;
    isActive: boolean;
    bannerImageUrl?: string;
    type: string; 
    colorScheme?: string;
    timeRemaining: number;
    products: ProductDto[];
}

interface ServerPromotionResponse {
    id: number;
    name: string;
    description: string;
    discountPercentage: number;
    type: string;
    appliedDiscount: number;
    productId: number;
    productName: string;
}

declare global {
    interface Window {
        debugPromotions?: () => void;
        testPromotions?: () => Promise<void>; 
    }
}

interface AppliedPromotion {
    id: number;
    name: string;
    description: string;
    discountPercentage: number;
    type: string;
    appliedDiscount: number;
}

const EnhancedChocolateCartPage = () => {

    const router = useRouter();

    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [updating, setUpdating] = useState<UpdatingState>({});


    const [showCheckoutForm, setShowCheckoutForm] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [checkoutFormData, setCheckoutFormData] = useState<CheckoutFormData>({
        shippingAddress: {
            fullName: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US',
            email: '',
            phoneNumber: ''
        },
        saveAddress: false,
        orderNotes: '',
        couponCode: '',
        customerEmail: ''
    });
    const [addressTab, setAddressTab] = useState<'saved' | 'new'>('new');
    const [checkoutStep, setCheckoutStep] = useState<'address' | 'success'>('address');
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);
    const [userInfo, setUserInfo] = useState<User | null>(null);

    const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
    const [, setLoadingPromotions] = useState(false);

    const [promotionDiscount, setPromotionDiscount] = useState<number>(0);
    const [appliedPromotions, setAppliedPromotions] = useState<AppliedPromotion[]>([]);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202';

    const getUserInfo = (): User | null => {
        if (typeof window !== 'undefined') {
            try {
                const userStr = localStorage.getItem('user');
                return userStr ? JSON.parse(userStr) as User : null;
            } catch (error) {
                console.error('Error parsing user data:', error);
                return null;
            }
        }
        return null;
    };

    const checkAuthStatus = (): boolean => {
        const user = getUserInfo();
        setUserInfo(user);
        console.log('👤 Current user:', user);
        return !!user;
    };

    const getAuthHeaders = async () => {

        let token = null;

        if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';');
            console.log('🍪 All cookies:', cookies.map(c => c.trim()));

            const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
            if (tokenCookie) {
                token = tokenCookie.split('=')[1];
                console.log('🍪 Found token in cookies:', token ? `${token.substring(0, 20)}...` : 'No token found');
            }
        }

        if (!token && typeof window !== 'undefined') {
            const tokenSources = [
                localStorage.getItem('token'),
                sessionStorage.getItem('token'),
                localStorage.getItem('authToken'),
                sessionStorage.getItem('authToken'),
                localStorage.getItem('jwt'),
                sessionStorage.getItem('jwt'),
                localStorage.getItem('accessToken'),
                sessionStorage.getItem('accessToken'),
            ];

            token = tokenSources.find(t => t !== null);
        }


        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        } else {
            const guestId = await ensureGuestSession();
            headers['X-Guest-Id'] = guestId;
        }

        return headers;
    };

    const getImageUrl = (imageUrl: string | null | undefined): string => {
        if (!imageUrl) {
            return `data:image/svg+xml,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="#c89b6a20">
                    <rect width="96" height="96" fill="#2a211c"/>
                    <text x="48" y="48" text-anchor="middle" dy="0.3em" font-size="24">🍫</text>
                </svg>
            `)}`;
        }

        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }

        if (imageUrl.startsWith('/uploads/')) {
            return `${API_BASE_URL}${imageUrl}`;
        }

        if (!imageUrl.includes('/')) {
            return `${API_BASE_URL}/uploads/${imageUrl}`;
        }

        return `${API_BASE_URL}/${imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl}`;
    };

    const fetchCart = async (): Promise<void> => {
        try {
            

            const headers = await getAuthHeaders(); // ✅ Await the headers first
            const response = await fetch(`${API_BASE_URL}/api/Carts`, {
                method: 'GET',
                credentials: 'include',
                headers: headers, // ✅ Then use them
            });


            if (response.ok) {
                const cartData: AspNetResponse = await response.json();

                const getItemsArray = (items: AspNetResponse['items']): CartItem[] => {
                    if (Array.isArray(items)) return items;
                    if (items && typeof items === 'object' && '$values' in items && Array.isArray(items.$values)) {
                        return items.$values;
                    }
                    return [];
                };

                const guestId = document.cookie.split('; ').find(row => row.startsWith('GuestId='));


                const itemsArray = getItemsArray(cartData.items);

                const normalizedCart: Cart = {
                    id: cartData.id || 0,
                    userId: cartData.userId || '',
                    items: itemsArray,
                    totalAmount: cartData.total || 0,
                    totalItems: cartData.itemCount || itemsArray.length,
                    createdAt: cartData.createdAt || new Date().toISOString(),
                    lastModified: cartData.updatedAt || new Date().toISOString(),
                    subtotalAmount: cartData.subtotal || 0,
                    taxAmount: cartData.tax || 0
                };

                setCart(normalizedCart);
            } else if (response.status === 404) {
                setCart({
                    id: 0,
                    userId: '',
                    items: [],
                    totalAmount: 0,
                    totalItems: 0,
                    createdAt: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                });
            } else {
                const errorText = await response.text();
                setCart({
                    id: 0,
                    userId: '',
                    items: [],
                    totalAmount: 0,
                    totalItems: 0,
                    createdAt: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                });
            }
        } catch (fetchError) {
            setCart({
                id: 0,
                userId: '',
                items: [],
                totalAmount: 0,
                totalItems: 0,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId: number, newQuantity: number): Promise<void> => {
        if (newQuantity < 1 || !cart) return;

        setUpdating(prev => ({ ...prev, [itemId]: true }));

        try {
            const headers = await getAuthHeaders(); 

            const response = await fetch(`${API_BASE_URL}/api/Carts`, {
                method: 'GET',
                credentials: 'include',
                headers: headers,
            });

            if (response.ok) {
                await fetchCart();
            } else {
                console.error('Failed to update quantity:', response.statusText);
            }
        } catch (updateError) {
            console.error('Error updating quantity:', updateError);
        } finally {
            setUpdating(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const removeItem = async (itemId: number): Promise<void> => {
        if (!cart) return;

        setUpdating(prev => ({ ...prev, [itemId]: true }));

        try {
            const headers = await getAuthHeaders(); 

            const response = await fetch(`${API_BASE_URL}/api/Carts`, {
                method: 'GET',
                credentials: 'include',
                headers: headers, 
            });

            if (response.ok) {
                await fetchCart();
            } else {
            }
        } catch (removeError) {
        } finally {
            setUpdating(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const toggleGiftWrap = async (itemId: number): Promise<void> => {
        if (!cart) return;

        const item = cart.items.find(item => item.id === itemId);
        if (!item) return;

        setUpdating(prev => ({ ...prev, [itemId]: true }));

        try {
            const headers = await getAuthHeaders(); 

            const response = await fetch(`${API_BASE_URL}/api/Carts/items/${itemId}`, {
                method: 'PUT',
                credentials: 'include',

                headers: headers,
                body: JSON.stringify({
                    quantity: item.quantity,
                    isGiftWrapped: !item.isGiftWrapped,
                    giftMessage: item.giftMessage
                }),
            });

            if (response.ok) {
                await fetchCart();
            } else {
            }
        } catch (giftWrapError) {
        } finally {
            setUpdating(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const clearCart = async (): Promise<void> => {
        if (!cart) return;

        setLoading(true);
        const headers = await getAuthHeaders();
        try {
            const response = await fetch(`${API_BASE_URL}/api/Carts`, {
                method: 'DELETE',
                credentials: 'include',
                headers: headers,
            });

            if (response.ok) {
                await fetchCart();
            } else {
            }
        } catch (clearError) {
        } finally {
            setLoading(false);
        }
    };

    const fetchActivePromotions = async (): Promise<void> => {
        const headers = await getAuthHeaders();

        try {
            setLoadingPromotions(true);

            const response = await fetch(`${API_BASE_URL}/api/promotions/active`, {
                credentials: 'include',
                headers: headers,
            });


            if (response.ok) {
                const promotions = await response.json();

                let processedPromotions = promotions;
                if (promotions && typeof promotions === 'object' && '$values' in promotions) {
                    processedPromotions = promotions.$values;
                }

                setActivePromotions(processedPromotions);
            } else {
                const errorText = await response.text();
                setActivePromotions([]);
            }
        } catch (error) {
            setActivePromotions([]);
        } finally {
            setLoadingPromotions(false);
        }
    };

    const validateCoupon = async (code: string): Promise<void> => {
        if (!code.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }
        const headers = await getAuthHeaders();

        try {
            setValidatingCoupon(true);
            setCouponError(null);

            const originalSubtotal = cart?.subtotalAmount || cart?.totalAmount || 0;

            const requestBody = {
                code: code.trim().toUpperCase(),
                orderAmount: originalSubtotal, // Original amount for minimum validation
                promotionDiscount: promotionDiscount || 0 // Current promotion discount
            };

            const response = await fetch(`${API_BASE_URL}/api/coupons/validate`, {
                method: 'POST',
                credentials: 'include',
                headers: headers,
                body: JSON.stringify(requestBody),
            });


            if (response.ok) {
                const result = await response.json();

                if (result.isValid) {
                    // Map backend response to frontend interface
                    const appliedCouponData: CouponValidationResult = {
                        isValid: result.isValid,
                        discountAmount: result.discountAmount,
                        finalAmount: result.finalAmount,
                        message: result.message,
                        coupon: result.coupon
                    };

                    setAppliedCoupon(appliedCouponData);
                    setCouponCode(''); // Clear input after successful application

                    // Update checkout form data with the coupon
                    setCheckoutFormData(prev => ({
                        ...prev,
                        couponCode: result.coupon?.code || code.trim().toUpperCase()
                    }));

                } else {
                    setCouponError(result.message || 'Invalid coupon code');
                }
            } else {
                let errorMessage = 'Failed to validate coupon';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.title || errorMessage;
                } catch {
                    errorMessage = `Server error: ${response.status}`;
                }
                setCouponError(errorMessage);
            }
        } catch (error) {
            console.error('Error validating coupon:', error);
            setCouponError('Network error occurred while validating coupon');
        } finally {
            setValidatingCoupon(false);
        }
    };

    const removeCoupon = (): void => {
        setAppliedCoupon(null);
        setCheckoutFormData(prev => ({
            ...prev,
            couponCode: ''
        }));
    };

    const calculateOrderTotals = () => {
        const subtotal = cart?.subtotalAmount || cart?.totalAmount || 0;
        const tax = cart?.taxAmount || (subtotal * 0.08);
        const shipping = 0; // Free shipping

        const subtotalAfterPromotions = Math.max(0, subtotal - promotionDiscount);
        let adjustedCouponDiscount = 0;

        if (appliedCoupon && appliedCoupon.coupon) {
            if (appliedCoupon.coupon.discountType === 'Percentage') {
                const percentage = appliedCoupon.coupon.discountAmount / 100;
                adjustedCouponDiscount = Math.min(
                    subtotalAfterPromotions * percentage,
                    subtotalAfterPromotions
                );
            }
            else if (appliedCoupon.coupon.discountType === 'FixedAmount') {
                adjustedCouponDiscount = Math.min(
                    appliedCoupon.discountAmount,
                    subtotalAfterPromotions
                );
            } else {
                adjustedCouponDiscount = Math.min(
                    appliedCoupon.discountAmount,
                    subtotalAfterPromotions
                );
            }
        }

        const totalDiscount = promotionDiscount + adjustedCouponDiscount;
        const total = Math.max(0, subtotal + tax + shipping - totalDiscount);

        return {
            subtotal,
            tax,
            shipping,
            promotionDiscount,
            couponDiscount: adjustedCouponDiscount,
            totalDiscount,
            total
        };
    };

    const fetchSavedAddresses = async (): Promise<void> => {
        const headers = await getAuthHeaders();
        try {

            const response = await fetch(`${API_BASE_URL}/api/shipping-addresses`, {
                credentials: 'include',
                headers: headers,
            });


            if (response.ok) {
                const addresses = await response.json();

                const getAddressesArray = (addressData: unknown): SavedAddress[] => {
                    if (Array.isArray(addressData)) return addressData as SavedAddress[];
                    if (addressData && typeof addressData === 'object' && addressData !== null) {
                        const obj = addressData as { $values?: unknown };
                        if ('$values' in obj && Array.isArray(obj.$values)) {
                            return obj.$values as SavedAddress[];
                        }
                    }
                    return [];
                };

                const addressArray = getAddressesArray(addresses);
                setSavedAddresses(addressArray);

                if (addressArray.length > 0) {
                    setAddressTab('saved');
                } else {
                    setAddressTab('new');
                }
            } else if (response.status === 404) {
                setSavedAddresses([]);
                setAddressTab('new'); // Default to new address form
            } else {
                const errorText = await response.text();
                setSavedAddresses([]);
                setAddressTab('new');
            }
        } catch (addressError) {
            setSavedAddresses([]);
            setAddressTab('new');
        }
    };

    const verifyCartBeforeCheckout = async (): Promise<boolean> => {
        const headers = await getAuthHeaders();
        try {
            const response = await fetch(`${API_BASE_URL}/api/Checkout/verify-cart`, {
                credentials: 'include',
                headers: headers
            });


            if (response.ok) {
                const verification = await response.json();

                if (cart && cart.items && cart.items.length > 0) {
                    return true; // Override the API verification if frontend cart has items
                }

                const isValid = verification.CartStatus === 'Valid';

                if (!isValid) {
                    // Show more helpful error message
                    if (verification.CartStatus === 'Empty') {
                        setCheckoutError('Your cart appears to be empty. Please add items to your cart before checkout.');
                    } else {
                        setCheckoutError(verification.Message || 'Cart verification failed');
                    }
                }

                return isValid;
            } else {
                const errorData = await response.json();
                console.log('❌ Cart verification failed:', errorData);
                setCheckoutError(errorData.Message || 'Cart verification failed');
                return false;
            }
        } catch (verifyError) {
            console.error('❌ Cart verification error:', verifyError);
            setCheckoutError('Failed to verify cart');
            return false;
        }
    };

    const handleStartCheckout = async (): Promise<void> => {
        setCheckoutError(null);

        try {

            const isCartValid = await verifyCartBeforeCheckout();

            if (!isCartValid) {
                return;
            }

            await fetchSavedAddresses();

            if (savedAddresses.length === 0) {
                setAddressTab('new');
            } else {
                setAddressTab('saved');
            }

            await fetchActivePromotions();

            setShowCheckoutForm(true);
            setCheckoutStep('address');
        } catch (error) {
            setCheckoutError('Failed to start checkout process');
        }
    };

    const validateCheckoutForm = (): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (addressTab === 'saved') {
            if (!checkoutFormData.savedAddressId) {
                errors.push('Please select a shipping address');
            }
        } else if (addressTab === 'new') {
            if (!checkoutFormData.shippingAddress.fullName.trim()) {
                errors.push('Full name is required');
            }
            if (!checkoutFormData.shippingAddress.email?.trim()) {
                errors.push('Email is required');
            }
            if (!checkoutFormData.shippingAddress.addressLine1.trim()) {
                errors.push('Address line 1 is required');
            }
            if (!checkoutFormData.shippingAddress.city.trim()) {
                errors.push('City is required');
            }
            if (!checkoutFormData.shippingAddress.zipCode.trim()) {
                errors.push('ZIP code is required');
            }
        }

        return { isValid: errors.length === 0, errors };
    };

    const debugPromotions = () => {

        if (activePromotions && activePromotions.length > 0) {
        }
    };

    const calculatePromotionDiscounts = async (): Promise<void> => {
        if (!cart?.items || cart.items.length === 0) {
            setPromotionDiscount(0);
            setAppliedPromotions([]);
            return;
        }

        const headers = await getAuthHeaders();

        try {

            const response = await fetch(`${API_BASE_URL}/api/Checkout/calculate-cart-promotions`, {
                method: 'POST',
                credentials: 'include',
                headers: headers,
            });

            if (response.ok) {
                const result = await response.json();

                setPromotionDiscount(result.promotionDiscount || 0);

                let promotionsArray = result.appliedPromotions || [];

                if (promotionsArray && typeof promotionsArray === 'object' && '$values' in promotionsArray) {
                    promotionsArray = promotionsArray.$values;
                }

                if (!Array.isArray(promotionsArray)) {
                    promotionsArray = [];
                }

                const mappedPromotions = promotionsArray.map((promo: ServerPromotionResponse) => ({
                    id: promo.id,
                    name: promo.name,
                    description: promo.description,
                    discountPercentage: promo.discountPercentage,
                    type: promo.type,
                    appliedDiscount: promo.appliedDiscount
                }));

                setAppliedPromotions(mappedPromotions);

                if (result.promotionDiscount > 0) {
                } else {
                }
            } else {
                // Fallback to client-side calculation
                await calculatePromotionDiscountsFallback();
            }
        } catch (error) {
            await calculatePromotionDiscountsFallback();
        }
    };

    const calculatePromotionDiscountsFallback = async (): Promise<void> => {
        if (!cart?.items || cart.items.length === 0) {
            setPromotionDiscount(0);
            setAppliedPromotions([]);
            return;
        }

        let totalDiscount = 0;
        const appliedPromos: AppliedPromotion[] = [];

        for (const item of cart.items) {
            const headers = await getAuthHeaders();
            try {
                const response = await fetch(`${API_BASE_URL}/api/promotions/products/${item.productId}`, {
                    credentials: 'include',
                    headers: headers,
                });

                if (response.ok) {
                    const promotion = await response.json() as Promotion;
                    const discountPerItem = item.productPrice * (promotion.discountPercentage / 100);
                    const itemDiscount = discountPerItem * item.quantity;
                    totalDiscount += itemDiscount;

                    appliedPromos.push({
                        id: promotion.id,
                        name: promotion.name,
                        description: promotion.description,
                        discountPercentage: promotion.discountPercentage,
                        type: promotion.type,
                        appliedDiscount: itemDiscount
                    });
                }
            } catch (error) {
            }
        }

        setPromotionDiscount(totalDiscount);
        setAppliedPromotions(appliedPromos);
    };

    const testPromotions = async (): Promise<void> => {
        if (!cart?.items || cart.items.length === 0) {
            return;
        }

        for (const item of cart.items) {
            const headers = await getAuthHeaders();
            try {
                const response = await fetch(`${API_BASE_URL}/api/promotions/products/${item.productId}`, {
                    credentials: 'include',
                    headers: headers,
                });

                if (response.ok) {
                    const promotion = await response.json() as Promotion; // ✅ Properly typed
                    const originalPrice = item.productPrice;
                    const discountAmount = originalPrice * (promotion.discountPercentage / 100);
                    const discountedPrice = originalPrice - discountAmount;
                    const totalSavings = discountAmount * item.quantity;

                } else {
                }
            } catch (error) {
            }
        }
    };

    const getGuestId = (): string | null => {
        if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';');
            const guestCookie = cookies.find(cookie => cookie.trim().startsWith('GuestId='));
            if (guestCookie) {
                const guestId = guestCookie.split('=')[1];
                console.log('🔍 Found GuestId cookie:', guestId);
                return guestId;
            }
        }
        return null;
    };

    const createGuestSession = async (): Promise<string> => {
        try {

            const response = await fetch(`${API_BASE_URL}/api/Checkout/create-guest-session`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                const guestId = data.guestId;

                setTimeout(() => {
                    const verifyGuestId = getGuestId();
                }, 100);

                return guestId;
            } else {
                const errorText = await response.text();
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }
        } catch (error) {

            const fallbackGuestId = `guest-${Date.now().toString().slice(-6)}_${Math.random().toString(36).substr(2, 6)}`;

            try {
                document.cookie = `GuestId=${fallbackGuestId}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
                return fallbackGuestId;
            } catch (cookieError) {
                return fallbackGuestId;
            }
        }
    };

    const ensureGuestSession = async (): Promise<string> => {
        let guestId = getGuestId();

        if (!guestId) {
           guestId = await createGuestSession();
        } else {
        }

        return guestId;
    };

    useEffect(() => {
        if (cart?.items && cart.items.length > 0) {
            calculatePromotionDiscounts();
        } else {
            setPromotionDiscount(0);
            setAppliedPromotions([]);
        }
    }, [cart]); 

    const EnhancedOrderSummary = () => {
        const totals = calculateOrderTotals();

        return (
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10 sticky top-8">
                <h2 className="text-2xl font-semibold text-[#f3d5a5] mb-6">Order Summary</h2>

                {/* Show Applied Promotions FIRST */}
                {appliedPromotions.length > 0 && (
                    <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                        <h3 className="text-green-300 font-semibold mb-2 flex items-center gap-2">
                            <span>🎉</span> Applied Promotions ({appliedPromotions.length})
                        </h3>
                        <div className="space-y-2">
                            {appliedPromotions.map((promotion, index) => (
                                <div key={`applied-promo-${promotion.id}-${index}`} className="flex justify-between items-center text-green-200 text-sm">
                                    <div>
                                        <div className="font-semibold">{promotion.name}</div>
                                        <div className="text-xs">{promotion.discountPercentage}% off</div>
                                    </div>
                                    <div className="text-green-300 font-bold">
                                        -${promotion.appliedDiscount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Available Promotions Banner */}
                {activePromotions && activePromotions.length > 0 && appliedPromotions.length === 0 && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg">
                        <h3 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                            <span>🎯</span> Available Promotions ({activePromotions.length})
                        </h3>
                        <div className="space-y-2">
                            {activePromotions.slice(0, 2).map((promotion) => (
                                <div key={promotion.id} className="text-blue-200 text-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs px-2 py-1 rounded-full ${promotion.type === 'FlashSale' ? 'bg-red-500/30 text-red-300' :
                                                promotion.type === 'Seasonal' ? 'bg-orange-500/30 text-orange-300' :
                                                    promotion.type === 'Clearance' ? 'bg-purple-500/30 text-purple-300' :
                                                        'bg-blue-500/30 text-blue-300'
                                            }`}>
                                            {promotion.type || 'Promo'}
                                        </span>
                                        <strong>{promotion.name}</strong>
                                    </div>
                                    <div>{promotion.description}</div>
                                    <div className="text-blue-300 text-xs mt-1">
                                        {promotion.discountPercentage}% off • Expires: {new Date(promotion.endDate).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Coupon Section - FIXED VERSION */}
                <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                    <h3 className="text-[#f3d5a5] font-semibold mb-3 flex items-center gap-2">
                        <span>🎫</span> Coupon Code
                    </h3>

                    {appliedCoupon ? (
                        // Applied coupon display
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400">✅</span>
                                    <div>
                                        <div className="text-green-300 font-semibold">
                                            {appliedCoupon.coupon?.code}
                                        </div>
                                        <div className="text-green-200 text-sm">
                                            {appliedCoupon.message}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-green-300 font-bold">
                                        -${appliedCoupon.discountAmount.toFixed(2)}
                                    </div>
                                    <button
                                        onClick={removeCoupon}
                                        className="text-red-400 hover:text-red-300 text-xs underline mt-1"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Input and button in a proper flex container */}
                            <div className="flex gap-2 w-full">
                                    <input
                                        type="text"
                                        placeholder="Enter coupon code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && couponCode.trim()) {
                                                e.preventDefault();
                                                validateCoupon(couponCode);
                                            }
                                        }}
                                        className="flex-1 min-w-0 p-3 bg-black/40 border border-white/20 rounded-lg text-white text-sm focus:border-[#f8c15c] focus:outline-none placeholder:text-gray-400"
                                        disabled={validatingCoupon}
                                        autoComplete="off"
                                        spellCheck="false"
                                    />

                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        validateCoupon(couponCode);
                                    }}
                                    disabled={validatingCoupon || !couponCode.trim()}
                                    className="px-4 py-3 bg-[#c89b6a] hover:bg-[#f8c15c] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 whitespace-nowrap flex-shrink-0"
                                    type="button" // Explicitly set button type
                                >
                                    {validatingCoupon ? (
                                        <>
                                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                            <span className="hidden sm:inline">Checking...</span>
                                        </>
                                    ) : (
                                        <span>Apply</span>
                                    )}
                                </button>
                            </div>

                            {/* Error message */}
                            {couponError && (
                                <div className="text-red-400 text-sm p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                                    {couponError}
                                </div>
                            )}

                            {/* Optional: Add some helpful text */}
                            <div className="text-gray-400 text-xs">
                                Enter your coupon code and click Apply to get your discount
                            </div>
                        </div>
                    )}
                </div>

                {/* Order Details */}
                <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-[#e6e6e6]">
                        <span>Subtotal ({cart?.totalItems || 0} items)</span>
                        <span>${totals.subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-[#e6e6e6]">
                        <span>Shipping</span>
                        <span className="text-[#c89b6a]">Free</span>
                    </div>

                    <div className="flex justify-between text-[#e6e6e6]">
                        <span>Tax</span>
                        <span>${totals.tax.toFixed(2)}</span>
                    </div>

                    {/* Show promotion discounts */}
                    {totals.promotionDiscount > 0 && (
                        <div className="flex justify-between text-green-400">
                            <span>Promotion Discounts</span>
                            <span>-${totals.promotionDiscount.toFixed(2)}</span>
                        </div>
                    )}

                    {/* Show coupon discounts */}
                    {totals.couponDiscount > 0 && (
                        <div className="flex justify-between text-green-400">
                            <span>Coupon Discount ({appliedCoupon?.coupon?.code})</span>
                            <span>-${totals.couponDiscount.toFixed(2)}</span>
                        </div>
                    )}

                    <div className="border-t border-white/20 pt-4">
                        <div className="flex justify-between text-xl font-bold">
                            <span className="text-[#f3d5a5]">Total</span>
                            <span className="text-[#f8c15c]">
                                ${totals.total.toFixed(2)}
                            </span>
                        </div>
                        {totals.totalDiscount > 0 && (
                            <div className="text-green-400 text-sm text-right mt-1">
                                You saved ${totals.totalDiscount.toFixed(2)}!
                            </div>
                        )}
                    </div>
                </div>


                <button
                    onClick={handleStartCheckout}
                    disabled={isProcessingOrder}
                    className="w-full bg-gradient-to-r from-[#c89b6a] to-[#f8c15c] hover:from-[#f8c15c] hover:to-[#c89b6a] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isProcessingOrder ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <span>Proceed to Checkout</span>
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>

                <a
                    href="/products"
                    className="w-full bg-white/10 hover:bg-white/20 text-[#e6e6e6] font-medium py-3 px-6 rounded-xl transition-all duration-300 border border-white/20 hover:border-white/30 text-center block"
                >
                    Continue Shopping
                </a>

                {/* Additional Info */}
                <div className="mt-6 pt-6 border-t border-white/20 space-y-3">
                    <div className="flex items-center gap-3 text-[#e6e6e6] text-sm">
                        <Heart size={16} className="text-[#c89b6a]" />
                        <span>Handcrafted with love</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#e6e6e6] text-sm">
                        <Gift size={16} className="text-[#c89b6a]" />
                        <span>Free gift wrapping available</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#e6e6e6] text-sm">
                        <ShoppingBag size={16} className="text-[#c89b6a]" />
                        <span>Free shipping on all orders</span>
                    </div>
                </div>
            </div>
        );
    };


    const handleAddressSelect = (address: SavedAddress): void => {
        setCheckoutFormData({
            ...checkoutFormData,
            savedAddressId: address.id,
            shippingAddress: {
                fullName: address.fullName,
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2 || '',
                city: address.city,
                state: address.state || '',
                zipCode: address.zipCode,
                country: address.country,
                email: address.email || '',
                phoneNumber: address.phoneNumber || ''
            }
        });
    };


    const OrderSuccessStep: React.FC<{
        cart: Cart;
        checkoutFormData: CheckoutFormData;
        onContinueShopping: () => void;
        onBackToAddress: () => void;
    }> = ({ cart, checkoutFormData, onContinueShopping, onBackToAddress }) => {
        const [showConfetti, setShowConfetti] = useState(true);

        // Generate order details from cart and form data
        const orderDetails = {
            orderNumber: `CHO-${Date.now().toString().slice(-6)}`,
            orderDate: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'confirmed',
            items: cart.items.map((item) => ({
                id: item.id,
                productName: item.productName,
                productImageUrl: item.productImageUrl,
                quantity: item.quantity,
                price: item.productPrice,
                lineTotal: item.lineTotal,
                isGiftWrapped: item.isGiftWrapped
            })),
            shippingAddress: checkoutFormData.shippingAddress,
            orderSummary: {
                subtotal: cart.subtotalAmount || cart.totalAmount,
                tax: cart.taxAmount || 0,
                shipping: 0,
                total: cart.totalAmount
            },
            orderNotes: checkoutFormData.orderNotes
        };

        useEffect(() => {
            const timer = setTimeout(() => setShowConfetti(false), 3000);
            return () => clearTimeout(timer);
        }, []);

        useEffect(() => {
            if (userInfo?.email && !checkoutFormData.shippingAddress.email) {
                setCheckoutFormData(prev => ({
                    ...prev,
                    shippingAddress: {
                        ...prev.shippingAddress,
                        email: userInfo.email
                    },
                    customerEmail: userInfo.email
                }));
            }
        }, [userInfo]);

        const formatDate = (dateString: string): string => {
            return new Date(dateString).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const getDeliveryEstimate = (): string => {
            const today = new Date();
            const deliveryDate = new Date(today);
            deliveryDate.setDate(today.getDate() + 3); // 3 days from now

            return deliveryDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            });
        };

        

       

       



        return (
            <div className="space-y-6">
                {/* Confetti Animation */}
                {showConfetti && (
                    <div className="fixed inset-0 pointer-events-none z-50">
                        <div className="absolute inset-0 overflow-hidden">
                            {[...Array(30)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute animate-bounce text-lg"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 2}s`,
                                        animationDuration: `${2 + Math.random() * 2}s`
                                    }}
                                >
                                    {['🎉', '🍫', '✨', '🎊', '🌟'][Math.floor(Math.random() * 5)]}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Success Header */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                        <CheckCircle size={32} className="text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#f3d5a5] mb-2">
                        Order Confirmed!
                    </h3>
                    <p className="text-[#e6e6e6] mb-4">
                        Thank you for your order. We&apos;re preparing your delicious chocolates!
                    </p>
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 inline-block">
                        <p className="text-green-300 font-semibold">
                            Order #{orderDetails.orderNumber}
                        </p>
                        <p className="text-green-200 text-sm">
                            Placed on {formatDate(orderDetails.orderDate)}
                        </p>
                    </div>
                </div>

                {/* Order Status Timeline */}
                <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-[#f3d5a5] mb-4">Order Status</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle size={16} className="text-white" />
                            </div>
                            <div>
                                <p className="text-green-400 font-semibold">Order Confirmed</p>
                                <p className="text-[#e6e6e6] text-sm">Just now</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#f8c15c] rounded-full flex items-center justify-center">
                                <Gift size={16} className="text-black" />
                            </div>
                            <div>
                                <p className="text-[#f8c15c] font-semibold">Preparing</p>
                                <p className="text-[#e6e6e6] text-sm">Within 24 hours</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <ArrowRight size={16} className="text-[#e6e6e6]" />
                            </div>
                            <div>
                                <p className="text-[#e6e6e6] font-semibold">Shipped</p>
                                <p className="text-[#e6e6e6] text-sm">1-2 business days</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#f8c15c]/10 border border-[#f8c15c]/30 rounded-lg p-3 mt-4">
                        <div className="flex items-center gap-3">
                            <ArrowRight size={18} className="text-[#f8c15c]" />
                            <div>
                                <p className="text-[#f8c15c] font-semibold">Estimated Delivery</p>
                                <p className="text-[#e6e6e6] text-sm">{getDeliveryEstimate()} • Free shipping</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <EnhancedOrderSummary />
                </div>

                {/* Shipping Address Review */}
                <div>
                    <h4 className="text-lg font-semibold text-[#f3d5a5] mb-3">Shipping Address</h4>
                    <div className="p-4 bg-black/40 rounded-lg border border-white/20">
                        <div className="flex items-start gap-3">
                            <MapPin size={18} className="text-[#c89b6a] mt-1" />
                            <div className="text-[#e6e6e6]">
                                <div className="font-medium">{orderDetails.shippingAddress.fullName}</div>
                                <div>{orderDetails.shippingAddress.addressLine1}</div>
                                {orderDetails.shippingAddress.addressLine2 && (
                                    <div>{orderDetails.shippingAddress.addressLine2}</div>
                                )}
                                <div>
                                    {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.zipCode}
                                </div>
                                <div>{orderDetails.shippingAddress.country}</div>
                                {orderDetails.shippingAddress.email && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Heart size={14} className="text-[#c89b6a]" />
                                        <span className="text-[#c89b6a] text-sm">{orderDetails.shippingAddress.email}</span>
                                    </div>
                                )}
                                {orderDetails.shippingAddress.phoneNumber && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Heart size={14} className="text-[#c89b6a]" />
                                        <span className="text-[#c89b6a] text-sm">{orderDetails.shippingAddress.phoneNumber}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Notes Review */}
                {orderDetails.orderNotes && (
                    <div>
                        <h4 className="text-lg font-semibold text-[#f3d5a5] mb-3">Order Notes</h4>
                        <div className="p-4 bg-black/40 rounded-lg border border-white/20 text-[#e6e6e6]">
                            {orderDetails.orderNotes}
                        </div>
                    </div>
                )}

                {/* Email Confirmation Notice */}
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Heart size={18} className="text-blue-400 mt-1" />
                        <div>
                            <p className="text-blue-300 font-semibold mb-1">Confirmation Email Sent</p>
                            <p className="text-blue-200 text-sm">
                                We&apos;ve sent an order confirmation to {orderDetails.shippingAddress.email || 'your email address'}.
                                You&apos;ll receive shipping updates and tracking information there.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Thank You Message */}
                <div className="bg-gradient-to-r from-[#c89b6a]/20 to-[#f8c15c]/20 rounded-lg p-4 border border-[#f8c15c]/30">
                    <div className="text-center">
                        <div className="flex justify-center mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Heart key={i} size={16} className="text-[#f8c15c] fill-current" />
                            ))}
                        </div>
                        <h4 className="text-[#f3d5a5] font-semibold mb-2">Thank You!</h4>
                        <p className="text-[#e6e6e6] text-sm">
                            We appreciate your business and hope you enjoy your handcrafted chocolates!
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onBackToAddress}
                        className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                    >
                        View Details
                    </button>
                    <button
                        onClick={onContinueShopping}
                        className="flex-1 py-3 bg-[#c89b6a] hover:bg-[#f8c15c] text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <ShoppingBag size={18} />
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
        };

    const processCheckout = async (): Promise<void> => {
        setIsProcessingOrder(true);
        setCheckoutError(null);
        const headers = await getAuthHeaders();
        try {
            // Final cart verification
            const isCartValid = await verifyCartBeforeCheckout();
            if (!isCartValid) {
                return;
            }

            // Validate form
            const validation = validateCheckoutForm();
            if (!validation.isValid) {
                setCheckoutError('Please fix the following errors: ' + validation.errors.join(', '));
                return;
            }


            if (!checkoutFormData.shippingAddress.email && !checkoutFormData.customerEmail) {
            }

            const response = await fetch(`${API_BASE_URL}/api/Checkout/simple`, {
                method: 'POST',
                credentials: 'include',
                headers: headers,
                body: JSON.stringify(checkoutFormData)
            });

            if (response.ok) {
                const order = await response.json();
                    console.log(checkoutFormData.shippingAddress.email || checkoutFormData.customerEmail || 'unknown');

                setCheckoutStep('success');

            } else {
                const errorText = await response.text();

                let errorMessage = 'Checkout failed';

                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.title || errorText;
                } catch (parseError) {
                    errorMessage = errorText || 'Unknown error occurred';
                }

                setCheckoutError(errorMessage);
            }
        } catch (checkoutError) {
            setCheckoutError('Network error occurred. Please try again.');
        } finally {
            setIsProcessingOrder(false);
        }
    };   
    

    useEffect(() => {
        checkAuthStatus();
        fetchCart();
        fetchActivePromotions();

        setTimeout(() => {
            if (typeof window !== 'undefined') {
                window.debugPromotions = debugPromotions;
                window.testPromotions = testPromotions; 
            }
        }, 2000);
    }, []);

    useEffect(() => {
        if (userInfo?.email) {
            setCheckoutFormData(prev => ({
                ...prev,
                shippingAddress: {
                    ...prev.shippingAddress,
                    email: userInfo.email
                },
                customerEmail: userInfo.email
            }));
        }
    }, [userInfo]); 

    useEffect(() => {
        if (savedAddresses.length > 0) {
            setAddressTab('saved');
        } else {
            setAddressTab('new');
        }
    }, [savedAddresses]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-[#f3d5a5] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-[#e6e6e6] text-lg">Loading your cart...</p>
                </div>
            </div>
        );
    }

    if (!cart) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-[#e6e6e6] text-lg">Failed to load cart. Please try again.</p>
                    <button
                        onClick={fetchCart}
                        className="mt-4 bg-[#c89b6a] hover:bg-[#f8c15c] text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }
    const CheckoutForm = () => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-[#f3d5a5]">Checkout</h2>
                        <button
                            onClick={() => setShowCheckoutForm(false)}
                            className="text-[#e6e6e6] hover:text-white text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* User Info Display */}
                    {userInfo && (
                        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-green-400">✅</span>
                                <span className="text-green-300">
                                    Logged in as: <strong>{userInfo.firstName} {userInfo.lastName}</strong> ({userInfo.email})
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Progress Steps */}
                    <div className="flex mb-8">
                        <div className={`flex-1 text-center ${checkoutStep === 'address' ? 'text-[#f8c15c]' : 'text-[#e6e6e6]'}`}>
                            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${checkoutStep === 'address' ? 'bg-[#f8c15c]' : 'bg-gray-600'}`}>
                                <MapPin size={16} />
                            </div>
                            <span className="text-sm">Address</span>
                        </div>
                        <div className={`flex-1 text-center ${checkoutStep === 'success' ? 'text-[#f8c15c]' : 'text-[#e6e6e6]'}`}>
                            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${checkoutStep === 'success' ? 'bg-[#f8c15c]' : 'bg-gray-600'}`}>
                                <CheckCircle size={16} />
                            </div>
                            <span className="text-sm">Success</span>
                        </div>
                    </div>

                    {checkoutError && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
                            {checkoutError}
                        </div>
                    )}

                    {checkoutStep === 'address' && (
                        <div className="space-y-6">
                            {/* Address Tabs */}
                            <div className="flex mb-6 border-b border-white/10">
                                {savedAddresses.length > 0 && (
                                    <button
                                        type="button"
                                        className={`flex-1 py-2 text-center font-semibold transition-colors ${addressTab === 'saved'
                                                ? 'text-[#f8c15c] border-b-2 border-[#f8c15c] bg-black/30'
                                                : 'text-[#e6e6e6] hover:text-[#f8c15c]'
                                            }`}
                                        onClick={() => setAddressTab('saved')}
                                    >
                                        Saved Address
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={`flex-1 py-2 text-center font-semibold transition-colors ${addressTab === 'new'
                                            ? 'text-[#f8c15c] border-b-2 border-[#f8c15c] bg-black/30'
                                            : 'text-[#e6e6e6] hover:text-[#f8c15c]'
                                        }`}
                                    onClick={() => setAddressTab('new')}
                                >
                                    New Address
                                </button>
                            </div>

                            {/* Tab Content */}
                            {addressTab === 'saved' && savedAddresses.length > 0 && (
                                <div className="space-y-2 mb-6">
                                    {savedAddresses.map((address) => (
                                        <button
                                            key={address.id}
                                            type="button"
                                            onClick={() => {
                                                handleAddressSelect(address);
                                                setAddressTab('new'); 
                                            }}
                                            className={`w-full p-3 text-left rounded-lg border transition-colors ${checkoutFormData.savedAddressId === address.id
                                                    ? 'border-[#f8c15c] bg-[#f8c15c]/10'
                                                    : 'border-white/20 bg-white/5 hover:border-white/30'
                                                }`}
                                        >
                                            <div className="text-[#f3d5a5] font-medium">{address.fullName}</div>
                                            <div className="text-[#e6e6e6] text-sm">
                                                {address.addressLine1}, {address.city}, {address.state} {address.zipCode}
                                            </div>
                                            {address.nickname && (
                                                <div className="text-xs text-[#c89b6a] mt-1">({address.nickname})</div>
                                            )}
                                            {address.isDefault && (
                                                <div className="text-xs text-green-400 mt-1">Default</div>
                                            )}
                                        </button>
                                    ))}
                                    <div className="text-center my-4">
                                        <span className="text-[#e6e6e6]">or enter a new address</span>
                                    </div>
                                </div>
                            )}

                            {addressTab === 'new' && (
                                <>
                                    {/* Address Form */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-[#e6e6e6] text-sm mb-1">Full Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={checkoutFormData.shippingAddress.fullName}
                                                onChange={(e) => setCheckoutFormData({
                                                    ...checkoutFormData,
                                                    shippingAddress: { ...checkoutFormData.shippingAddress, fullName: e.target.value }
                                                })}
                                                className="w-full p-3 bg-black/40 border border-white/20 rounded-lg text-white focus:border-[#f8c15c] focus:outline-none"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-[#e6e6e6] text-sm mb-1">
                                                Email * {userInfo && <span className="text-green-400">(Auto-filled from account)</span>}
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={checkoutFormData.shippingAddress.email}
                                                onChange={(e) => {
                                                    const newFormData = {
                                                        ...checkoutFormData,
                                                        shippingAddress: { ...checkoutFormData.shippingAddress, email: e.target.value },
                                                        customerEmail: e.target.value
                                                    };
                                                    console.log('📧 Email updated:', e.target.value);
                                                    setCheckoutFormData(newFormData);
                                                }}
                                                className="w-full p-3 bg-black/40 border border-white/20 rounded-lg text-white focus:border-[#f8c15c] focus:outline-none"
                                                placeholder="your-email@example.com"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-[#e6e6e6] text-sm mb-1">Address Line 1 *</label>
                                            <input
                                                type="text"
                                                required
                                                value={checkoutFormData.shippingAddress.addressLine1}
                                                onChange={(e) => setCheckoutFormData({
                                                    ...checkoutFormData,
                                                    shippingAddress: { ...checkoutFormData.shippingAddress, addressLine1: e.target.value }
                                                })}
                                                className="w-full p-3 bg-black/40 border border-white/20 rounded-lg text-white focus:border-[#f8c15c] focus:outline-none"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-[#e6e6e6] text-sm mb-1">Address Line 2</label>
                                            <input
                                                type="text"
                                                value={checkoutFormData.shippingAddress.addressLine2}
                                                onChange={(e) => setCheckoutFormData({
                                                    ...checkoutFormData,
                                                    shippingAddress: { ...checkoutFormData.shippingAddress, addressLine2: e.target.value }
                                                })}
                                                className="w-full p-3 bg-black/40 border border-white/20 rounded-lg text-white focus:border-[#f8c15c] focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[#e6e6e6] text-sm mb-1">City *</label>
                                            <input
                                                type="text"
                                                required
                                                value={checkoutFormData.shippingAddress.city}
                                                onChange={(e) => setCheckoutFormData({
                                                    ...checkoutFormData,
                                                    shippingAddress: { ...checkoutFormData.shippingAddress, city: e.target.value }
                                                })}
                                                className="w-full p-3 bg-black/40 border border-white/20 rounded-lg text-white focus:border-[#f8c15c] focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[#e6e6e6] text-sm mb-1">State</label>
                                            <input
                                                type="text"
                                                value={checkoutFormData.shippingAddress.state}
                                                onChange={(e) => setCheckoutFormData({
                                                    ...checkoutFormData,
                                                    shippingAddress: { ...checkoutFormData.shippingAddress, state: e.target.value }
                                                })}
                                                className="w-full p-3 bg-black/40 border border-white/20 rounded-lg text-white focus:border-[#f8c15c] focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[#e6e6e6] text-sm mb-1">ZIP Code *</label>
                                            <input
                                                type="text"
                                                required
                                                value={checkoutFormData.shippingAddress.zipCode}
                                                onChange={(e) => setCheckoutFormData({
                                                    ...checkoutFormData,
                                                    shippingAddress: { ...checkoutFormData.shippingAddress, zipCode: e.target.value }
                                                })}
                                                className="w-full p-3 bg-black/40 border border-white/20 rounded-lg text-white focus:border-[#f8c15c] focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[#e6e6e6] text-sm mb-1">Country *</label>
                                            <select
                                                value={checkoutFormData.shippingAddress.country}
                                                onChange={(e) => setCheckoutFormData({
                                                    ...checkoutFormData,
                                                    shippingAddress: { ...checkoutFormData.shippingAddress, country: e.target.value }
                                                })}
                                                className="w-full p-3 bg-black/40 border border-white/20 rounded-lg text-white focus:border-[#f8c15c] focus:outline-none"
                                            >
                                                <option value="US">United States</option>
                                                <option value="CA">Canada</option>
                                                <option value="UK">United Kingdom</option>
                                                <option value="AU">Australia</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[#e6e6e6] text-sm mb-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                value={checkoutFormData.shippingAddress.phoneNumber}
                                                onChange={(e) => setCheckoutFormData({
                                                    ...checkoutFormData,
                                                    shippingAddress: { ...checkoutFormData.shippingAddress, phoneNumber: e.target.value }
                                                })}
                                                className="w-full p-3 bg-black/40 border border-white/20 rounded-lg text-white focus:border-[#f8c15c] focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="saveAddress"
                                            checked={checkoutFormData.saveAddress}
                                            onChange={(e) => setCheckoutFormData({ ...checkoutFormData, saveAddress: e.target.checked })}
                                            className="rounded"
                                        />
                                        <label htmlFor="saveAddress" className="text-[#e6e6e6] text-sm">
                                            Save this address for future orders
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-[#e6e6e6] text-sm mb-1">Order Notes (Optional)</label>
                                        <textarea
                                            value={checkoutFormData.orderNotes}
                                            onChange={(e) => setCheckoutFormData({ ...checkoutFormData, orderNotes: e.target.value })}
                                            rows={3}
                                            className="w-full p-3 bg-black/40 border border-white/20 rounded-lg text-white focus:border-[#f8c15c] focus:outline-none"
                                            placeholder="Special delivery instructions, gift messages, etc."
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowCheckoutForm(false)}
                                            className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={processCheckout}
                                            disabled={isProcessingOrder}
                                            className="flex-1 py-3 bg-[#c89b6a] hover:bg-[#f8c15c] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isProcessingOrder ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Complete Order
                                                    <ArrowRight size={18} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {checkoutStep === 'success' && (
                        <OrderSuccessStep
                            cart={cart}
                            checkoutFormData={checkoutFormData}
                            onContinueShopping={() => {
                                setShowCheckoutForm(false);
                                setCheckoutStep('address');
                                // Optionally redirect to products page
                                window.location.href = '/products';
                            }}
                            onBackToAddress={() => setCheckoutStep('address')}
                        />
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">

                <button
                    onClick={() => router.push('/')}
                    className="mb-6 flex items-center gap-2 text-[#c89b6a] hover:text-[#f8c15c] text-sm font-medium transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Home
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#f3d5a5] mb-2">
                        Your Chocolate Cart
                    </h1>
                    <p className="text-[#e6e6e6] text-lg">
                        {cart.totalItems > 0
                            ? `${cart.totalItems} delicious item${cart.totalItems > 1 ? 's' : ''} waiting for you`
                            : 'Your cart is empty'
                        }
                    </p>
                </div>

                {(!cart || !Array.isArray(cart.items) || cart.items.length === 0) ? (
                    // Empty Cart State
                    <div className="text-center py-16">
                        <ShoppingBag size={80} className="text-[#c89b6a] mx-auto mb-6 opacity-50" />
                        <h2 className="text-2xl font-semibold text-[#f3d5a5] mb-4">
                            Your cart is empty
                        </h2>
                        <p className="text-[#e6e6e6] mb-8 max-w-md mx-auto">
                            Discover our exquisite collection of handcrafted chocolates and treats.
                        </p>

                        {/* Test Buttons for Empty Cart */}
                        <div className="space-y-4 mb-8">

                        </div>

                        <a
                            href="/products"
                            className="inline-block bg-[#c89b6a] hover:bg-[#f8c15c] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                        >
                            Start Shopping
                        </a>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2">
                            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-semibold text-[#f3d5a5]">
                                        Cart Items ({cart.totalItems})
                                    </h2>
                                    {cart && Array.isArray(cart.items) && cart.items.length > 0 && (
                                        <button
                                            onClick={clearCart}
                                            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                                        >
                                            Clear Cart
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {cart && Array.isArray(cart.items) && cart.items.map((item: CartItem) => (
                                        <div key={item.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <div className="flex gap-4">
                                                {/* Product Image */}
                                                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={getImageUrl(item.productImageUrl)}
                                                        alt={item.productName}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            const placeholder = document.createElement('div');
                                                            placeholder.className = 'absolute inset-0 flex items-center justify-center';
                                                            placeholder.innerHTML = `
                                                                <div class="text-center">
                                                                    <div class="w-12 h-12 bg-[#c89b6a]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                        <span class="text-2xl">🍫</span>
                                                                    </div>
                                                                    <span class="text-[#c89b6a] text-sm">No Image</span>
                                                                </div>
                                                            `;
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.parentElement?.appendChild(placeholder);
                                                        }}
                                                    />
                                                </div>

                                                {/* Product Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="text-[#f3d5a5] font-semibold text-lg truncate pr-2">
                                                            {item.productName}
                                                        </h3>
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            disabled={updating[item.id]}
                                                            className="text-red-400 hover:text-red-300 p-1 transition-colors disabled:opacity-50"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-[#c89b6a] font-semibold text-lg">
                                                            ${typeof item.productPrice === 'number' ? item.productPrice.toFixed(2) : '0.00'}
                                                        </span>

                                                        {/* Quantity Controls */}
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                disabled={updating[item.id] || item.quantity <= 1}
                                                                className="w-8 h-8 rounded-full bg-[#c89b6a] hover:bg-[#f8c15c] text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <Minus size={14} />
                                                            </button>

                                                            <span className="text-[#e6e6e6] font-semibold min-w-[2rem] text-center">
                                                                {updating[item.id] ? '...' : item.quantity}
                                                            </span>

                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                disabled={updating[item.id]}
                                                                className="w-8 h-8 rounded-full bg-[#c89b6a] hover:bg-[#f8c15c] text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Gift Wrap Option */}
                                                    <div className="flex items-center justify-between">
                                                        <button
                                                            onClick={() => toggleGiftWrap(item.id)}
                                                            disabled={updating[item.id]}
                                                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-all disabled:opacity-50 ${item.isGiftWrapped
                                                                ? 'bg-[#f8c15c]/20 text-[#f8c15c] border border-[#f8c15c]/30'
                                                                : 'bg-white/5 text-[#e6e6e6] border border-white/10 hover:border-[#c89b6a]/50'
                                                                }`}
                                                        >
                                                            <Gift size={14} />
                                                            {item.isGiftWrapped ? 'Gift Wrapped' : 'Add Gift Wrap'}
                                                        </button>

                                                        <div className="text-right">
                                                            <div className="text-[#f8c15c] font-bold text-lg">
                                                                ${typeof item.lineTotal === 'number' ? item.lineTotal.toFixed(2) : '0.00'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Gift Message */}
                                                    {item.isGiftWrapped && item.giftMessage && (
                                                        <div className="mt-2 p-2 bg-[#f8c15c]/10 rounded-lg border border-[#f8c15c]/20">
                                                            <p className="text-[#f8c15c] text-sm">
                                                                <strong>Gift Message:</strong> {item.giftMessage}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                            {/* Order Summary - Use the component that shows promotions */}
                            <div className="lg:col-span-1">
                                <EnhancedOrderSummary />
                            </div>
                    </div>
                )}

                {/* Checkout Form Modal */}
                {showCheckoutForm && <CheckoutForm />}
            </div>
        </div>
    );
};

export default EnhancedChocolateCartPage;