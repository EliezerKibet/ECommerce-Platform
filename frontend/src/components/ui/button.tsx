// components/ui/button.tsx - Enhanced button component with better styling
import React from 'react'

export interface ButtonProps {
    children: React.ReactNode
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    className?: string
    onClick?: () => void
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'default',
    size = 'default',
    className = '',
    onClick,
    disabled = false,
    type = 'button'
}) => {
    const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:shadow-md'

    const variantClasses = {
        default: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-950',
        destructive: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
        outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-slate-950',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-950',
        ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-950',
        link: 'text-slate-900 underline-offset-4 hover:underline focus-visible:ring-slate-950 shadow-none hover:shadow-none'
    }

    const sizeClasses = {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-10 w-10'
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        >
            {children}
        </button>
    )
}