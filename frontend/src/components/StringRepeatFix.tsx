'use client'

import { useEffect } from 'react'

export default function StringRepeatFix() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Store the original method
            const originalRepeat = String.prototype.repeat

            // Override with safe version
            String.prototype.repeat = function (count) {
                // Log the problematic calls
                if (count < 0) {
                    console.error('WARNING: Negative String.repeat detected:', count)
                    console.error('Stack trace:', new Error().stack)
                    // Use 0 instead of the negative value
                    return originalRepeat.call(this, 0)
                }
                return originalRepeat.call(this, count)
            }

            console.log('Applied String.repeat protection')
        }
    }, [])

    // This component doesn't render anything
    return null
}