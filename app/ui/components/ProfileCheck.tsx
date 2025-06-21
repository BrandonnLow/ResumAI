'use client'

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../Context/AuthContext';
import { getCardClasses, getButtonClasses } from '../styles/theme';

interface ProfileCheckProps {
    children: React.ReactNode;
}

export default function ProfileCheck({ children }: ProfileCheckProps) {
    const { currentUser, profileComplete, profileLoading, refreshProfileStatus } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Pages that don't require profile completion
    const allowedPages = ['/profile', '/profile/setup'];
    const isAllowedPage = allowedPages.some(page => pathname.startsWith(page));

    // Show loading spinner while checking profile status
    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-700">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading your profile...</p>
                </div>
            </div>
        );
    }

    // If user has profile or is on an allowed page, show content
    if (profileComplete || isAllowedPage) {
        return <>{children}</>;
    }

    // Show profile completion required page
    return (
        <div className="min-h-screen bg-gray-700">
            {/* Header */}
            <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-20">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
                    <p className="text-gray-400">Help us understand your background to provide tailored interview questions.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className={`${getCardClasses()} text-center`}>
                    <div className="px-8 py-12">
                        {/* Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 bg-blue-900/20 border border-blue-600/30 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>

                        {/* Content */}
                        <h2 className="text-2xl font-bold text-white mb-4">Profile Setup Required</h2>
                        <p className="text-gray-300 mb-6 max-w-md mx-auto">
                            To access the full features of resumAI, please complete your profile setup. This helps us provide personalized interview questions and better feedback.
                        </p>

                        {/* Benefits list */}
                        <div className="mb-8 text-left max-w-md mx-auto">
                            <h3 className="text-lg font-medium text-white mb-4 text-center">What you'll get:</h3>
                            <ul className="space-y-3 text-gray-300">
                                <li className="flex items-center">
                                    <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Personalized interview questions based on your background</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>AI-powered feedback to improve your answers</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Job application tracking and management</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Progress tracking and performance insights</span>
                                </li>
                            </ul>
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-4">
                            <button
                                onClick={() => router.push('/profile/setup')}
                                className={`${getButtonClasses('primary')} px-8 py-3 text-base transform transition-all hover:scale-105`}
                            >
                                🚀 Let's Get Started
                            </button>
                        </div>

                        {/* Time estimate */}
                        <div className="mt-8 pt-6 border-t border-gray-600">
                            <p className="text-sm text-gray-400">
                                ⏱️ Takes about 5-10 minutes • You can save progress and return later
                            </p>
                        </div>
                    </div>
                </div>

                {/* Additional help section */}
                <div className={`${getCardClasses()} mt-6`}>
                    <div className="px-6 py-4">
                        <h3 className="text-lg font-medium text-white mb-3">Need help?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-gray-300 font-medium">Upload your resume</p>
                                    <p className="text-gray-400">We can automatically extract your information</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <div>
                                    <p className="text-gray-300 font-medium">Use AI enhancement</p>
                                    <p className="text-gray-400">Let AI improve your profile content</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}