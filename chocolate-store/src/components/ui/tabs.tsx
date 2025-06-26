// components/ui/tabs.tsx - Dark themed tabs component
import React, { createContext, useContext, useState } from 'react'

interface TabsContextType {
    value: string
    onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

export interface TabsProps {
    children: React.ReactNode
    defaultValue: string
    className?: string
}

export const Tabs: React.FC<TabsProps> = ({ children, defaultValue, className = '' }) => {
    const [value, setValue] = useState(defaultValue)

    return (
        <TabsContext.Provider value={{ value, onValueChange: setValue }}>
            <div className={`w-full ${className}`}>
                {children}
            </div>
        </TabsContext.Provider>
    )
}

export interface TabsListProps {
    children: React.ReactNode
    className?: string
}

export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
    return (
        <div className={`
      inline-flex h-14 items-center justify-center rounded-2xl 
      bg-gray-900/90 backdrop-blur-md p-1.5 text-gray-400 
      shadow-2xl border border-gray-700/60
      relative overflow-hidden
      ${className}
    `}>
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800/10 via-gray-700/10 to-gray-800/10" />

            <div className="relative z-10 flex w-full">
                {children}
            </div>
        </div>
    )
}

export interface TabsTriggerProps {
    children: React.ReactNode
    value: string
    className?: string
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ children, value, className = '' }) => {
    const context = useContext(TabsContext)
    if (!context) throw new Error('TabsTrigger must be used within Tabs')

    const isActive = context.value === value

    return (
        <button
            onClick={() => context.onValueChange(value)}
            className={`
        inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-3
        text-sm font-semibold transition-all duration-300 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
        disabled:pointer-events-none disabled:opacity-50
        relative overflow-hidden group flex-1
        ${isActive
                    ? `
              bg-gray-800 text-white 
              shadow-lg border border-gray-600/50
              scale-105 z-20
              before:absolute before:inset-0 before:rounded-xl 
              before:bg-gradient-to-r before:from-gray-700/20 before:to-gray-600/20
            `
                    : `
              text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 
              hover:shadow-md hover:scale-102
              active:scale-95
            `
                } 
        ${className}
      `}
        >
            {/* Hover effect for inactive tabs */}
            {!isActive && (
                <span className="absolute inset-0 bg-gray-800/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
            )}

            {/* Active tab indicator */}
            {isActive && (
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-white rounded-full" />
            )}

            <span className="relative z-10 flex items-center gap-2">
                {children}
            </span>
        </button>
    )
}

export interface TabsContentProps {
    children: React.ReactNode
    value: string
    className?: string
}

export const TabsContent: React.FC<TabsContentProps> = ({ children, value, className = '' }) => {
    const context = useContext(TabsContext)
    if (!context) throw new Error('TabsContent must be used within Tabs')

    if (context.value !== value) return null

    return (
        <div className={`
      mt-8 ring-offset-gray-900 focus-visible:outline-none focus-visible:ring-2 
      focus-visible:ring-gray-400 focus-visible:ring-offset-2
      animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ease-out
      ${className}
    `}>
            {children}
        </div>
    )
}