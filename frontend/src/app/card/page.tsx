'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getCart, updateCartItem, removeFromCart } from '@/lib/services';
import { Cart } from '@/types'; // Removed CartItem as it's unused
import { toast } from 'react-hot-toast';

export default function CartPage() {
    const router = useRouter();
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingItemId, setProcessingItemId] = useState<number | null>(null);

    useEffect(() => {
        async function fetchCart() {
            setLoading(true);
            try {
                const cartData = await getCart();
                setCart(cartData);
            } catch (error) {
                console.error('Error fetching cart:', error);
                toast.error('Failed to load your cart');
            } finally {
                setLoading(false);
            }
        }

        fetchCart();
    }, []);

    const handleQuantityChange = async (itemId: number, newQuantity: number) => {
        if (newQuantity < 1) return;

        setProcessingItemId(itemId);
        try {
            await updateCartItem(itemId, newQuantity);
            // Update the cart locally
            if (cart) {
                const updatedItems = cart.items.map(item =>
                    item.id === itemId ? { ...item, quantity: newQuantity, subtotal: item.productPrice * newQuantity } : item
                );
                const updatedTotalItems = cart.totalItems - (cart.items.find(i => i.id === itemId)?.quantity || 0) + newQuantity;
                const updatedSubtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
                setCart({ ...cart, items: updatedItems, totalItems: updatedTotalItems, subtotal: updatedSubtotal });
            }
            toast.success('Cart updated');
        } catch (error) {
            console.error('Error updating cart:', error);
            toast.error('Failed to update cart');
        } finally {
            setProcessingItemId(null);
        }
    };

    const handleRemoveItem = async (itemId: number) => {
        setProcessingItemId(itemId);
        try {
            await removeFromCart(itemId);
            // Update cart locally
            if (cart) {
                const itemToRemove = cart.items.find(item => item.id === itemId);
                const updatedItems = cart.items.filter(item => item.id !== itemId);
                const updatedTotalItems = cart.totalItems - (itemToRemove?.quantity || 0);
                const updatedSubtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
                setCart({ ...cart, items: updatedItems, totalItems: updatedTotalItems, subtotal: updatedSubtotal });
            }
            toast.success('Item removed from cart');
        } catch (error) {
            console.error('Error removing item:', error);
            toast.error('Failed to remove item');
        } finally {
            setProcessingItemId(null);
        }
    };

    const goToCheckout = () => {
        router.push('/checkout');
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brown-600"></div>
            </div>
        );
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <svg className="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h2 className="text-2xl font-medium mb-4">Your cart is empty</h2>
                    <p className="text-gray-600 mb-6">Looks like you haven&apos;t added any chocolates to your cart yet.</p>
                    <Link
                        href="/products"
                        className="bg-brown-600 hover:bg-brown-700 text-white font-bold py-2 px-6 rounded-md transition"
                    >
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {cart.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-16 w-16 relative flex-shrink-0 mr-4">
                                                        {item.productImageUrl ? (
                                                            <Image
                                                                src={item.productImageUrl}
                                                                alt={item.productName}
                                                                fill
                                                                style={{ objectFit: 'cover' }}
                                                                className="rounded"
                                                            />
                                                        ) : (
                                                            <div className="h-16 w-16 bg-brown-100 rounded flex items-center justify-center">
                                                                <span className="text-brown-500 text-xs">No image</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={`/products/${item.productId}`}
                                                            className="text-brown-600 hover:text-brown-800 font-medium"
                                                        >
                                                            {item.productName}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                                ${item.productPrice.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <button
                                                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1 || processingItemId === item.id}
                                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-1 rounded-l focus:outline-none disabled:opacity-50"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                                        </svg>
                                                    </button>
                                                    <span className="bg-white border-t border-b border-gray-200 px-4 py-1 text-center w-12">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                        disabled={processingItemId === item.id}
                                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-1 rounded-r focus:outline-none disabled:opacity-50"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-semibold">
                                                ${item.subtotal.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    disabled={processingItemId === item.id}
                                                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                        <div className="border-t border-gray-200 pt-4 pb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="text-gray-800 font-medium">${cart.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">Shipping</span>
                                <span className="text-gray-800 font-medium">Calculated at checkout</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">Tax</span>
                                <span className="text-gray-800 font-medium">Calculated at checkout</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-lg font-bold">Total</span>
                                <span className="text-lg font-bold text-brown-800">${cart.subtotal.toFixed(2)}</span>
                            </div>

                            <button
                                onClick={goToCheckout}
                                className="bg-brown-600 hover:bg-brown-700 text-white font-bold py-3 px-6 rounded-md w-full flex items-center justify-center transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                                Proceed to Checkout
                            </button>

                            <div className="mt-6">
                                <Link
                                    href="/products"
                                    className="text-center block text-brown-600 hover:text-brown-800"
                                >
                                    <span className="flex items-center justify-center">
                                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Continue Shopping
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}