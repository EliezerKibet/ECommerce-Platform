'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { destroyCookie } from 'nookies';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for user in localStorage
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            } else {
                router.push('/auth/login');
            }
            setLoading(false);
        }
    }, [router]);

    const handleLogout = () => {
        destroyCookie(null, 'token');
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
        }
        toast.success('Logged out successfully');
        router.push('/');
        router.refresh();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1a1713]">
                <div className="w-8 h-8 border-2 border-[#c89b6a] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (

        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1713] via-[#2a211c] to-[#1a1713] px-4">
            <div className="bg-[#1a1713]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#c89b6a]/30 p-8 md:p-10 w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#c89b6a] to-[#f8c15c] rounded-full flex items-center justify-center shadow-lg mb-4">
                        <span className="text-[#1a1713] font-bold text-3xl">
                            {user.firstName?.[0]?.toUpperCase() || 'U'}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-[#f3d5a5] mb-1">{user.firstName} {user.lastName}</h1>
                    <p className="text-[#c89b6a] text-lg">{user.email}</p>
                </div>
                <div className="absolute top-8 left-8">
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

                <div className="flex flex-col gap-4">
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-md transition duration-300"
                    >
                        Sign Out
                    </button>
                    <button
                        onClick={() => router.push('/orders')}
                        className="w-full bg-[#c89b6a] hover:bg-[#b48a5a] text-[#1a1713] font-bold py-3 px-6 rounded-md transition duration-300"
                    >
                        View My Orders
                    </button>
                    <Link
                        href={`/auth/forgot-password?email=${encodeURIComponent(user.email)}`}
                        className="w-full bg-[#f8c15c] hover:bg-[#c89b6a] text-[#1a1713] font-bold py-3 px-6 rounded-md transition duration-300 text-center"
                    >
                        Reset Password
                    </Link>
                </div>
            </div>
        </div>
    );
}
