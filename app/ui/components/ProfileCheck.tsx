'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../Context/AuthContext';

interface ProfileCheckProps {
    children: React.ReactNode;
}

export default function ProfileCheck({ children }: ProfileCheckProps) {
    const { profileComplete } = useAuth();
    const router = useRouter();

    if (!profileComplete) {
        return (
            <div className="min-h-screen bg-gray-700 flex items-center justify-center">
                <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Profile Setup Required
                    </h2>
                    <p className="text-gray-300 mb-6">
                        Please complete your profile to access all features.
                    </p>
                    <button
                        onClick={() => router.push('/profile/setup')}
                        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
                    >
                        Complete Profile
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}