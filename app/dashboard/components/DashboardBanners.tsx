'use client'

import React from 'react';
import { useRouter } from 'next/navigation';

interface DashboardBannersProps {
    profile: any;
    profileError: string | null;
    allAnswers: any[];
    jobs: any[];
    showWelcome: boolean;
    currentUser: any;
    onSetShowWelcome: (show: boolean) => void;
    onFetchDashboardData: () => void;
    getDisplayName: () => string;
}

export default function DashboardBanners({
    profile,
    profileError,
    allAnswers,
    jobs,
    showWelcome,
    currentUser,
    onSetShowWelcome,
    onFetchDashboardData,
    getDisplayName
}: DashboardBannersProps) {
    const router = useRouter();

    // Debug component - only show if there's actually an issue
    const DebugBanner = () => {
        const hasDataIssue = !profile && !profileError && allAnswers.length === 0 && jobs.length === 0;

        if (!hasDataIssue) return null;

        return (
            <div className="mb-6 bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-red-200">Data Loading Issue Detected</h3>
                        <div className="mt-2 text-sm text-red-300">
                            <p>No data was loaded. This might be a temporary issue.</p>
                            <p className="mt-1">Current User ID: <code className="bg-red-800/30 px-1 rounded">{currentUser?.uid}</code></p>
                        </div>
                        <div className="mt-3">
                            <button
                                onClick={() => {
                                    onFetchDashboardData();
                                }}
                                className="inline-flex items-center px-3 py-2 border border-red-600 text-sm font-medium rounded-md text-red-200 hover:bg-red-900/20"
                            >
                                Retry Loading Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Welcome banner for first-time users
    const WelcomeBanner = () => {
        if (!showWelcome) return null;

        return (
            <div className="mb-6 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-600/30 rounded-lg p-6">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600">
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                    </div>
                    <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-white">
                            🎉 Welcome to resumAI, {getDisplayName()}!
                        </h3>
                        <p className="mt-2 text-blue-200">
                            Your profile is complete! Now you can start practicing with personalized interview questions,
                            track your job applications, and get AI-powered feedback to improve your interview skills.
                        </p>
                        <div className="mt-4 flex space-x-3">
                            <button
                                onClick={() => router.push('/practice/setup')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Start First Practice
                            </button>
                            <button
                                onClick={() => onSetShowWelcome(false)}
                                className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-200 hover:bg-blue-900/20"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                        <button
                            onClick={() => onSetShowWelcome(false)}
                            className="inline-flex text-blue-400 hover:text-blue-300"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Profile error banner
    const ProfileErrorBanner = () => {
        if (!profileError) return null;

        return (
            <div className="mb-6 bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-yellow-200">Profile Issue Detected</h3>
                        <div className="mt-2 text-sm text-yellow-300">
                            <p>{profileError}. This may affect your experience.</p>
                        </div>
                        <div className="mt-3">
                            <button
                                onClick={() => router.push('/profile/setup')}
                                className="inline-flex items-center px-3 py-2 border border-yellow-600 text-sm font-medium rounded-md text-yellow-200 hover:bg-yellow-900/20"
                            >
                                Complete Profile Setup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <DebugBanner />
            <WelcomeBanner />
            <ProfileErrorBanner />
        </>
    );
}