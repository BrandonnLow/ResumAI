'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { getCardClasses } from '../../ui/styles/theme';

export default function QuickActions() {
    const router = useRouter();

    return (
        <div className={`${getCardClasses()} hover:border-blue-500/40 transition-all duration-200`}>
            <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-white mb-4">Quick Actions</h2>
                <div className="space-y-3">
                    <button
                        onClick={() => router.push('/practice/setup')}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                        Start Practice Session
                    </button>
                    <button
                        onClick={() => router.push('/jobs/new')}
                        className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all duration-200"
                    >
                        Add New Job
                    </button>
                    <button
                        onClick={() => router.push('/profile')}
                        className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all duration-200"
                    >
                        Update Profile
                    </button>
                </div>
            </div>
        </div>
    );
}