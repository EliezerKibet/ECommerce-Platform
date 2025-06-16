// components/ui/card.tsx - Dark themed card components
import React from 'react'

export const Card: React.FC<{
    children: React.ReactNode;
    className?: string
}> = ({ children, className = '' }) => (
    <div className={`
    relative rounded-xl border border-gray-700/60 bg-gray-900/95 backdrop-blur-sm 
    shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] 
    group overflow-hidden hover:border-gray-600/50
    ${className}
  `}>
        {/* Subtle animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700/10 via-transparent to-gray-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />

        {/* Content */}
        <div className="relative z-10">
            {children}
        </div>
    </div>
)

export const CardHeader: React.FC<{
    children: React.ReactNode;
    className?: string
}> = ({ children, className = '' }) => (
    <div className={`
    flex flex-col space-y-1.5 p-6 
    bg-gray-800/50 
    rounded-t-xl border-b border-gray-700/50
    ${className}
  `}>
        {children}
    </div>
)

export const CardTitle: React.FC<{
    children: React.ReactNode;
    className?: string
}> = ({ children, className = '' }) => (
    <h3 className={`
    text-lg font-bold leading-none tracking-tight 
    text-white
    group-hover:text-gray-100 transition-all duration-300
    ${className}
  `}>
        {children}
    </h3>
)

export const CardDescription: React.FC<{
    children: React.ReactNode;
    className?: string
}> = ({ children, className = '' }) => (
    <p className={`
    text-sm text-gray-400 leading-relaxed
    group-hover:text-gray-300 transition-colors duration-300
    ${className}
  `}>
        {children}
    </p>
)

export const CardContent: React.FC<{
    children: React.ReactNode;
    className?: string
}> = ({ children, className = '' }) => (
    <div className={`
    p-6 pt-0 bg-gray-900/30
    ${className}
  `}>
        {children}
    </div>
)

export const CardFooter: React.FC<{
    children: React.ReactNode;
    className?: string
}> = ({ children, className = '' }) => (
    <div className={`
    flex items-center justify-between p-6 pt-0 gap-3
    bg-gray-800/30 
    rounded-b-xl border-t border-gray-700/50
    ${className}
  `}>
        {children}
    </div>
)