// src/hooks/useAuth.ts - Updated to clean guest cookie on login
import { useState, useEffect, useCallback } from 'react';
import { parseCookies, destroyCookie, setCookie } from 'nookies';
import { toast } from 'react-hot-toast';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isGuest: boolean;
    guestId: string | null;
}

interface AuthActions {
    login: (user: User, token: string) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
    refreshAuthState: () => void;
    getCurrentUserId: () => string;
}

export function useAuth(): AuthState & AuthActions {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        isGuest: false,
        guestId: null
    });

    const generateGuestId = (): string => {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    };

    const createGuestSession = (guestId: string) => {
        try {
            setCookie(null, 'GuestId', guestId, {
                maxAge: 30 * 24 * 60 * 60, // 30 days
                path: '/',
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
        } catch (error) {
            console.error('Error creating guest session:', error);
        }
    };

    const checkAuthState = useCallback(() => {
        try {
            const cookies = parseCookies();
            const token = cookies.token;
            const guestId = cookies.GuestId;

            console.log('Checking auth state - token exists:', !!token, 'guestId:', guestId);

            // Check for authenticated user first (prioritize authentication)
            if (token && typeof window !== 'undefined') {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const userData = JSON.parse(storedUser);
                        console.log('Authenticated user found, clearing guest state');

                        setAuthState({
                            user: userData,
                            isAuthenticated: true,
                            isLoading: false,
                            isGuest: false,
                            guestId: null
                        });
                        return;
                    } catch (error) {
                        console.error('Error parsing stored user data:', error);
                        localStorage.removeItem('user');
                    }
                }
            }

            // Only use guest logic if not authenticated
            if (guestId) {
                console.log('Using existing guest session:', guestId);
                setAuthState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    isGuest: true,
                    guestId: guestId.startsWith('guest-') ? guestId : guestId
                });
            } else {
                // Create new guest session
                const newGuestId = generateGuestId();
                createGuestSession(newGuestId);
                console.log('Created new guest session:', newGuestId);

                setAuthState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    isGuest: true,
                    guestId: newGuestId
                });
            }
        } catch (error) {
            console.error('Error checking auth state:', error);

            if (typeof window !== 'undefined') {
                localStorage.removeItem('user');
            }
            destroyCookie(null, 'token');

            const fallbackGuestId = generateGuestId();
            createGuestSession(fallbackGuestId);

            setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isGuest: true,
                guestId: fallbackGuestId
            });
        }
    }, []);

    const login = useCallback((user: User, token: string) => {
        try {
            console.log('Logging in user:', user.email);

            // Set authentication token
            setCookie(null, 'token', token, {
                maxAge: 7 * 24 * 60 * 60, // 7 days
                path: '/',
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });

            // Store user data
            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(user));
            }

            // IMPORTANT: Clear guest session when user logs in
            // This prevents confusion between guest and authenticated user
            console.log('Clearing guest session on login');
            destroyCookie(null, 'GuestId');

            setAuthState({
                user,
                isAuthenticated: true,
                isLoading: false,
                isGuest: false,
                guestId: null
            });

            toast.success(`Welcome back, ${user.firstName}!`);
        } catch (error) {
            console.error('Error during login:', error);
            toast.error('Login failed. Please try again.');
        }
    }, []);

    const logout = useCallback(() => {
        try {
            console.log('Logging out user');

            // Clear authentication data
            destroyCookie(null, 'token');

            if (typeof window !== 'undefined') {
                localStorage.removeItem('user');
            }

            // Create new guest session after logout
            const newGuestId = generateGuestId();
            createGuestSession(newGuestId);
            console.log('Created new guest session after logout:', newGuestId);

            setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isGuest: true,
                guestId: newGuestId
            });

            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }, []);

    const updateUser = useCallback((updatedUser: Partial<User>) => {
        setAuthState(prev => {
            if (!prev.user) return prev;

            const newUser = { ...prev.user, ...updatedUser };

            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(newUser));
            }

            return { ...prev, user: newUser };
        });
    }, []);

    const refreshAuthState = useCallback(() => {
        checkAuthState();
    }, [checkAuthState]);

    const getCurrentUserId = useCallback((): string => {
        // Prioritize authenticated user (matches your backend logic)
        if (authState.isAuthenticated && authState.user) {
            console.log('Returning authenticated user ID:', authState.user.id);
            return authState.user.id;
        }

        // Only use guest ID if not authenticated
        if (authState.isGuest && authState.guestId) {
            const guestIdWithPrefix = authState.guestId.startsWith('guest-') ? authState.guestId : `guest-${authState.guestId}`;
            console.log('Returning guest user ID:', guestIdWithPrefix);
            return guestIdWithPrefix;
        }

        // Fallback - check cookies directly
        const cookies = parseCookies();
        const token = cookies.token;

        // If we have a token, user should be authenticated
        if (token) {
            console.log('Token exists but user not in state - checking localStorage');
            if (typeof window !== 'undefined') {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const userData = JSON.parse(storedUser);
                        console.log('Found user in localStorage:', userData.id);
                        return userData.id;
                    } catch (error) {
                        console.error('Error parsing stored user:', error);
                    }
                }
            }
        }

        // No authentication, use/create guest ID
        const guestId = cookies.GuestId;
        if (guestId) {
            return guestId.startsWith('guest-') ? guestId : `guest-${guestId}`;
        }

        // Last resort - create new guest ID
        const newGuestId = generateGuestId();
        createGuestSession(newGuestId);
        return `guest-${newGuestId}`;
    }, [authState]);

    useEffect(() => {
        checkAuthState();
    }, [checkAuthState]);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user') {
                console.log('User data changed in another tab');
                checkAuthState();
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('storage', handleStorageChange);
            return () => window.removeEventListener('storage', handleStorageChange);
        }
    }, [checkAuthState]);

    return {
        ...authState,
        login,
        logout,
        updateUser,
        refreshAuthState,
        getCurrentUserId
    };
}

export default useAuth;