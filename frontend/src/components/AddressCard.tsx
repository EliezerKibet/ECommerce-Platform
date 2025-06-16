// src/components/AddressCard.tsx
import React from 'react';
import { ShippingAddress } from '../services/shippingAddressService';

interface AddressCardProps {
    address: ShippingAddress;
    onEdit: (address: ShippingAddress) => void;
    onDelete: (id: number) => void;
    onSetDefault: (id: number) => void;
    isDeleting?: boolean;
    isSettingDefault?: boolean;
}

export default function AddressCard({
    address,
    onEdit,
    onDelete,
    onSetDefault,
    isDeleting = false,
    isSettingDefault = false
}: AddressCardProps) {
    return (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="font-semibold text-[#f3d5a5] text-lg">{address.fullName}</div>
                        {address.isDefault && (
                            <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                                Default
                            </span>
                        )}
                    </div>
                    <div className="text-[#e6e6e6] space-y-1">
                        <div>{address.addressLine1}</div>
                        {address.addressLine2 && <div>{address.addressLine2}</div>}
                        <div>{address.city}{address.state && `, ${address.state}`} {address.zipCode}</div>
                        <div>{address.country}</div>
                    </div>
                    {address.phoneNumber && (
                        <div className="text-[#c89b6a] text-sm mt-2">
                            📞 {address.phoneNumber}
                        </div>
                    )}
                    {address.email && (
                        <div className="text-[#c89b6a] text-sm">
                            ✉️ {address.email}
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => onEdit(address)}
                        className="px-3 py-2 bg-[#c89b6a]/20 text-[#c89b6a] hover:bg-[#c89b6a]/30 rounded-lg text-sm transition-colors"
                    >
                        Edit
                    </button>
                    {!address.isDefault && address.id && (
                        <button
                            onClick={() => onSetDefault(address.id!)}
                            disabled={isSettingDefault}
                            className="px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                            {isSettingDefault ? 'Setting...' : 'Set Default'}
                        </button>
                    )}
                    {address.id && (
                        <button
                            onClick={() => onDelete(address.id!)}
                            disabled={isDeleting}
                            className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}