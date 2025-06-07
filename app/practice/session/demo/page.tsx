'use client'

import React from 'react';
import Link from 'next/link';
import PrivateRoute from '../../../ui/components/PrivateRoute';
import ProfileCheck from '../../../ui/components/ProfileCheck';

export default function PracticeSession() {
    return (
        <PrivateRoute>
            <ProfileCheck>
                <div className="min-h-screen bg-gray-700 p-8">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold text-white mb-8">Practice Session</h1>

                        <div className="bg-gray-800 p-8 rounded-lg border border-gray-600">
                            <h2 className="text-xl font-semibold text-white mb-4">Coming Soon!</h2>
                            <p className="text-gray-300 mb-6">
                                The practice session feature is being developed. You'll be able to:
                            </p>
                            <ul className="text-gray-300 list-disc list-inside mb-6 space-y-2">
                                <li>Answer personalized interview questions</li>
                                <li>Get AI-powered feedback on your responses</li>
                                <li>Save and review your answers</li>
                                <li>Track your progress over time</li>
                            </ul>

                            <Link
                                href="/practice/setup"
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Back to Setup
                            </Link>
                        </div>
                    </div>
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}