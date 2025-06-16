// src/components/AddressForm.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import shippingAddressService, { ShippingAddress } from '../services/shippingAddressService';

interface AddressFormProps {
    address?: ShippingAddress | null;
    onSave: (address: ShippingAddress) => void;
    onCancel: () => void;
}

interface FormData {
    fullName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phoneNumber: string;
    email: string;
    isDefault: boolean;
}

const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
    'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Sweden',
    'Norway', 'Denmark', 'Finland', 'Switzerland', 'Austria'
];

export default function AddressForm({ address, onSave, onCancel }: AddressFormProps) {
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
        phoneNumber: '',
        email: '',
        isDefault: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (address) {
            setFormData({
                fullName: address.fullName || '',
                addressLine1: address.addressLine1 || '',
                addressLine2: address.addressLine2 || '',
                city: address.city || '',
                state: address.state || '',
                zipCode: address.zipCode || '',
                country: address.country || 'United States',
                phoneNumber: address.phoneNumber || '',
                email: address.email || '',
                isDefault: address.isDefault || false
            });
        }
    }, [address]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let result;

            if (address && address.id) {
                result = await shippingAddressService.updateAddress(address.id, formData);
            } else {
                result = await shippingAddressService.createAddress(formData);
            }

            if (result.success && result.data) {
                toast.success(address ? 'Address updated successfully' : 'Address created successfully');
                onSave(result.data);
            } else {
                toast.error(result.error || 'Failed to save address');
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[#f3d5a5] mb-4">
                {address ? 'Edit Address' : 'Add New Address'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[#e6e6e6] text-sm font-medium mb-1">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c89b6a]"
                        />
                    </div>
                    <div>
                        <label className="block text-[#e6e6e6] text-sm font-medium mb-1">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c89b6a]"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[#e6e6e6] text-sm font-medium mb-1">
                        Address Line 1 *
                    </label>
                    <input
                        type="text"
                        name="addressLine1"
                        value={formData.addressLine1}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c89b6a]"
                    />
                </div>

                <div>
                    <label className="block text-[#e6e6e6] text-sm font-medium mb-1">
                        Address Line 2
                    </label>
                    <input
                        type="text"
                        name="addressLine2"
                        value={formData.addressLine2}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c89b6a]"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[#e6e6e6] text-sm font-medium mb-1">
                            City *
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c89b6a]"
                        />
                    </div>
                    <div>
                        <label className="block text-[#e6e6e6] text-sm font-medium mb-1">
                            State/Province
                        </label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c89b6a]"
                        />
                    </div>
                    <div>
                        <label className="block text-[#e6e6e6] text-sm font-medium mb-1">
                            ZIP/Postal Code *
                        </label>
                        <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c89b6a]"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[#e6e6e6] text-sm font-medium mb-1">
                        Country *
                    </label>
                    <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#c89b6a]"
                    >
                        {countries.map(country => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="flex items-center text-[#e6e6e6] text-sm">
                        <input
                            type="checkbox"
                            name="isDefault"
                            checked={formData.isDefault}
                            onChange={handleInputChange}
                            className="mr-2 rounded focus:ring-[#c89b6a]"
                        />
                        Set as default address
                    </label>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#c89b6a] hover:bg-[#b48a5a] disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        {isSubmitting ? 'Saving...' : (address ? 'Update Address' : 'Save Address')}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}