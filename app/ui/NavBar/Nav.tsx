'use client'

import { usePathname } from "next/navigation";
import React from "react";
import { useAuth } from '../Context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Nav() {
    const { currentUser, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Don't show nav on auth pages
    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

    return (
        <nav className="h-16 bg-gray-800 border-b border-gray-700">
            <div className="flex justify-between items-center h-full px-6">
                <Link href="/" className="text-2xl font-bold text-white">
                    PersonaPrep
                </Link>

                {!isAuthPage && currentUser && (
                    <div className="flex items-center space-x-6">
                        <Link href="/dashboard" className="text-gray-300 hover:text-white">
                            Dashboard
                        </Link>
                        <span className="text-gray-400 text-sm">
                            {currentUser.email}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-gray-300 hover:text-white"
                        >
                            Logout
                        </button>
                    </div>
                )}

                {!isAuthPage && !currentUser && (
                    <div className="space-x-4">
                        <Link href="/login" className="text-gray-300 hover:text-white">
                            Login
                        </Link>
                        <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Sign Up
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}