// components/ui/badge.tsx - Dark themed badge component
import React from 'react'

export interface BadgeProps {
    children: React.ReactNode
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'md',
    className = ''
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 hover:scale-105 active:scale-95'

    const variantClasses = {
        default: 'bg-blue-900/50 text-blue-300 border border-blue-700/50 hover:bg-blue-800/50 focus:ring-blue-500',
        secondary: 'bg-gray-800/50 text-gray-300 border border-gray-600/50 hover:bg-gray-700/50 focus:ring-gray-500',
        destructive: 'bg-red-900/50 text-red-300 border border-red-700/50 hover:bg-red-800/50 focus:ring-red-500',
        outline: 'text-gray-300 border border-gray-600 bg-transparent hover:bg-gray-800/50 focus:ring-gray-500',
        success: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-800/50 focus:ring-emerald-500',
        warning: 'bg-amber-900/50 text-amber-300 border border-amber-700/50 hover:bg-amber-800/50 focus:ring-amber-500',
        info: 'bg-cyan-900/50 text-cyan-300 border border-cyan-700/50 hover:bg-cyan-800/50 focus:ring-cyan-500'
    }

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs rounded-md',
        md: 'px-3 py-1.5 text-sm rounded-lg',
        lg: 'px-4 py-2 text-base rounded-xl'
    }

    return (
        <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
            {children}
        </span>
    )
}