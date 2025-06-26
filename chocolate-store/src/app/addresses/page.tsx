// app/addresses/page.tsx - Fixed with proper types
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import shippingAddressService from '../../services/shippingAddressService';
import { useAuth } from '../../hooks/useAuth';
import AddressForm from '../../components/AddressForm';
import AddressCard from '../../components/AddressCard';

// Import types properly to avoid parsing errors
import type { ShippingAddress, DebugApiResponse } from '../../services/shippingAddressService';

export default function AddressesPage() {
    const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
    const [showDebug, setShowDebug] = useState(false);
    const [debugInfo, setDebugInfo] = useState<DebugApiResponse | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const isCheckoutFlow = searchParams.get('checkout') === 'true';
    const { isAuthenticated, isLoading: authLoading, user, isGuest, getCurrentUserId } = useAuth();

    const fetchAddresses = async () => {
        console.log('Fetching addresses...');
        setLoading(true);
        setError(null);

        try {
            const result = await shippingAddressService.getAddresses();
            console.log('API Result:', result);

            if (result.success && result.data) {
                // Ensure result.data is an array
                if (Array.isArray(result.data)) {
                    console.log('Setting addresses:', result.data.length, 'addresses found');
                    setAddresses(result.data);
                } else {
                    console.error('Expected array but got:', typeof result.data, result.data);
                    setError('Invalid data format received from server');
                    setAddresses([]);
                }
            } else {
                console.error('API call failed:', result.error);
                setError(result.error || 'Failed to load addresses');
                setAddresses([]);
                if (result.error) {
                    toast.error(result.error);
                }
            }
        } catch (err) {
            console.error('Fetch addresses error:', err);
            setError('An unexpected error occurred');
            setAddresses([]);
            toast.error('Failed to load addresses');
        } finally {
            setLoading(false);
        }
    };

    const debugApi = async () => {
        console.log('Running API debug...');
        try {
            const result = await shippingAddressService.debugApi();
            console.log('Debug API result:', result);

            if (result.success && result.data) {
                setDebugInfo(result.data);
            } else {
                setDebugInfo({
                    userId: 'Unknown',
                    isAuthenticated: false,
                    cookies: {},
                    claims: {},
                    error: result.error
                } as DebugApiResponse & { error?: string });
            }
            setShowDebug(true);
        } catch (err) {
            console.error('Debug API error:', err);
            toast.error('Debug API call failed');
            setDebugInfo({
                userId: 'Error',
                isAuthenticated: false,
                cookies: {},
                claims: {},
                error: err instanceof Error ? err.message : 'Unknown error'
            } as DebugApiResponse & { error?: string });
            setShowDebug(true);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this address?')) return;

        setDeletingId(id);
        try {
            const result = await shippingAddressService.deleteAddress(id);

            if (result.success) {
                setAddresses(prevAddresses => prevAddresses.filter(addr => addr.id !== id));
                toast.success('Address deleted successfully');
            } else {
                toast.error(result.error || 'Failed to delete address');
            }
        } catch (err) {
            console.error('Delete error:', err);
            toast.error('Failed to delete address');
        } finally {
            setDeletingId(null);
        }
    };

    const handleSetDefault = async (id: number) => {
        setSettingDefaultId(id);
        try {
            const result = await shippingAddressService.setDefaultAddress(id);

            if (result.success && result.data) {
                setAddresses(prevAddresses => prevAddresses.map(addr => ({
                    ...addr,
                    isDefault: addr.id === id
                })));
                toast.success('Default address updated');
            } else {
                toast.error(result.error || 'Failed to set default address');
            }
        } catch (err) {
            console.error('Set default error:', err);
            toast.error('Failed to set default address');
        } finally {
            setSettingDefaultId(null);
        }
    };

    const handleEdit = (address: ShippingAddress) => {
        setEditingAddress(address);
        setShowAddForm(true);
    };

    const handleFormSave = (savedAddress: ShippingAddress) => {
        if (editingAddress && editingAddress.id) {
            // Update existing address
            setAddresses(prevAddresses => prevAddresses.map(addr =>
                addr.id === editingAddress.id ? savedAddress : addr
            ));
        } else {
            // Add new address
            setAddresses(prevAddresses => [...prevAddresses, savedAddress]);
        }

        setShowAddForm(false);
        setEditingAddress(null);
    };

    const handleFormSaveWithCheckout = (savedAddress: ShippingAddress) => {
        // Call the existing save handler
        handleFormSave(savedAddress);

        // If in checkout flow, redirect back to cart
        if (isCheckoutFlow) {
            setTimeout(() => {
                router.push('/carts');
            }, 1000); // Small delay to show success message
        }
    };

    const handleFormCancel = () => {
        setShowAddForm(false);
        setEditingAddress(null);
    };

    useEffect(() => {
        if (!authLoading) {
            fetchAddresses();
        }
    }, [authLoading]);

    // Debug: Log current state
    useEffect(() => {
        console.log('Auth State:', { isAuthenticated, isGuest, user });
        console.log('Current addresses state:', addresses, 'Type:', typeof addresses, 'Is Array:', Array.isArray(addresses));
        if (getCurrentUserId) {
            console.log('Current User ID:', getCurrentUserId());
        }
    }, [addresses, isAuthenticated, isGuest, user, getCurrentUserId]);

    // Show loading while auth is being determined
    if (authLoading) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-[#c89b6a] border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-[#e6e6e6]">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#f3d5a5]">My Addresses</h1>
                    {isGuest && (
                        <p className="text-[#c89b6a] text-sm mt-1">
                            You&apos;re shopping as a guest. <Link href="/auth/login" className="underline hover:text-[#f8c15c]">Sign in</Link> to save addresses permanently.
                        </p>
                    )}
                    {isAuthenticated && user && (
                        <p className="text-[#c89b6a] text-sm mt-1">
                            Managing addresses for {user.firstName} {user.lastName}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={debugApi}
                        className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                        Debug API
                    </button>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-[#c89b6a] hover:bg-[#b48a5a] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Address
                    </button>
                </div>
            </div>

            {/* Checkout Flow Banner */}
            {isCheckoutFlow && (
                <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="text-blue-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-blue-300 font-semibold">Checkout in Progress</h3>
                            <p className="text-blue-200 text-sm">Add or select a shipping address to continue with your order.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Debug Info Modal */}
            {showDebug && debugInfo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDebug(false)}>
                    <div className="bg-[#1a1a1a] border border-white/20 rounded-xl p-6 max-w-2xl max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-[#f3d5a5]">API Debug Info</h2>
                            <button
                                onClick={() => setShowDebug(false)}
                                className="text-[#c89b6a] hover:text-[#f8c15c]"
                            >
                                ✕
                            </button>
                        </div>
                        <pre className="text-sm text-[#e6e6e6] bg-[#2a2a2a] p-4 rounded overflow-auto">
                            {JSON.stringify(debugInfo, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="mb-8">
                    <AddressForm
                        address={editingAddress}
                        onSave={isCheckoutFlow ? handleFormSaveWithCheckout : handleFormSave}
                        onCancel={handleFormCancel}
                    />
                </div>
            )}

            {/* Address List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-[#c89b6a] border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-[#e6e6e6]">Loading addresses...</span>
                </div>
            ) : error ? (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-red-400 font-medium">Error loading addresses</div>
                    </div>
                    <div className="text-red-300 text-sm mb-4">{error}</div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchAddresses}
                            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={debugApi}
                            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            Debug API
                        </button>
                    </div>
                </div>
            ) : !Array.isArray(addresses) ? (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 mb-6">
                    <div className="text-yellow-400 font-medium mb-2">Data Format Error</div>
                    <div className="text-yellow-300 text-sm mb-4">
                        Expected an array of addresses but received: {typeof addresses}
                    </div>
                    <pre className="text-xs text-yellow-200 bg-yellow-900/20 p-2 rounded mb-4">
                        {JSON.stringify(addresses, null, 2)}
                    </pre>
                    <button
                        onClick={() => {
                            console.log('Resetting addresses to empty array');
                            setAddresses([]);
                            fetchAddresses();
                        }}
                        className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                        Reset and Retry
                    </button>
                </div>
            ) : addresses.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📍</div>
                    <div className="text-[#e6e6e6] text-xl mb-2">No addresses found</div>
                    <div className="text-[#c89b6a] text-sm mb-6 max-w-md mx-auto">
                        {isCheckoutFlow
                            ? "Add a shipping address to complete your order."
                            : "Add your first shipping address to make checkout faster and easier for future orders."
                        }
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-[#c89b6a] hover:bg-[#b48a5a] text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {isCheckoutFlow ? "Add Shipping Address" : "Add Your First Address"}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {addresses.map(address => (
                        <AddressCard
                            key={address.id}
                            address={address}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onSetDefault={handleSetDefault}
                            isDeleting={deletingId === address.id}
                            isSettingDefault={settingDefaultId === address.id}
                        />
                    ))}

                    {/* Summary */}
                    <div className="bg-[#1a1a1a]/60 border border-white/5 rounded-lg p-4 mt-6">
                        <div className="text-[#c89b6a] text-sm">
                            <span className="font-medium">{addresses.length}</span> saved address{addresses.length !== 1 ? 'es' : ''}
                            {addresses.find(addr => addr.isDefault) && (
                                <span className="ml-4">
                                    • Default: <span className="text-[#f3d5a5]">{addresses.find(addr => addr.isDefault)?.fullName}</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Checkout Action */}
                    {isCheckoutFlow && addresses.length > 0 && (
                        <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-green-300 font-semibold">Ready to continue</h3>
                                    <p className="text-green-200 text-sm">You have {addresses.length} shipping address{addresses.length !== 1 ? 'es' : ''} available.</p>
                                </div>
                                <Link
                                    href="/carts"
                                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    Continue Checkout
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation */}
            <div className="mt-12 flex justify-center">
                <Link
                    href="/carts"
                    className="text-[#c89b6a] hover:text-[#f8c15c] transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Cart
                </Link>
            </div>
        </div>
    );
}