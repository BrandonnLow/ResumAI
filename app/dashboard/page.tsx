'use client'

import React from 'react';
import PrivateRoute from '../ui/components/PrivateRoute';
import ProfileCheck from '../ui/components/ProfileCheck';

export default function Dashboard() {
    return (
        <PrivateRoute>
            <ProfileCheck>
                <div className="min-h-screen bg-gray-700 p-8">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold text-white mb-8">
                            Dashboard
                        </h1>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
                                <h3 className="text-xl font-semibold text-white mb-2">Practice Interview</h3>
                                <p className="text-gray-300 mb-4">Start a mock interview session</p>
                                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                    Start Practice
                                </button>
                            </div>

                            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
                                <h3 className="text-xl font-semibold text-white mb-2">Job Tracker</h3>
                                <p className="text-gray-300 mb-4">Manage your applications</p>
                                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                    View Jobs
                                </button>
                            </div>

                            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
                                <h3 className="text-xl font-semibold text-white mb-2">Profile</h3>
                                <p className="text-gray-300 mb-4">Update your information</p>
                                <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}