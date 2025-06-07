'use client'

import React from 'react';
import { useAuth } from '../ui/Context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const { currentUser, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (!currentUser) {
        router.push('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-700 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">
                        Welcome, {currentUser.email}!
                    </h1>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Logout
                    </button>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        Your Dashboard
                    </h2>
                    <p className="text-gray-300">
                        This is your interview preparation dashboard. More features coming soon!
                    </p>
                </div>
            </div>
        </div>
    );
}