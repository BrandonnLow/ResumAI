'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../ui/Context/AuthContext';
import { getUserProfile, updateUserProfile } from '../Services/firebase/firestore';
import { UserProfile } from '../types';
import toast from 'react-hot-toast';
import PrivateRoute from '../ui/components/PrivateRoute';

export default function Profile() {
    const { currentUser } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [formData, setFormData] = useState<Partial<UserProfile>>({});
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);
                const userProfile = await getUserProfile(currentUser.uid);

                if (!userProfile) {
                    return router.push('/profile/setup');
                }

                setProfile(userProfile);
                setFormData(userProfile);
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Failed to load your profile. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [currentUser, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !profile) return;

        try {
            setUpdating(true);

            await updateUserProfile({
                ...formData,
                uid: currentUser.uid
            });

            setProfile(prev => prev ? { ...prev, ...formData } : null);
            toast.success('Profile updated successfully!');

        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <PrivateRoute>
                <div className="min-h-screen bg-gray-700 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
                </div>
            </PrivateRoute>
        );
    }

    return (
        <PrivateRoute>
            <div className="min-h-screen bg-gray-700">
                <div className="w-full">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-white">Your Profile</h1>
                            <p className="mt-1 text-gray-400">
                                Update your personal information to get more relevant interview questions
                            </p>
                        </div>

                        {/* Main Profile Form */}
                        <div className="bg-gray-800 shadow rounded-lg">
                            <form onSubmit={handleSubmit}>
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                                        <div className="sm:col-span-3">
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                                                Full Name
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    type="text"
                                                    name="name"
                                                    id="name"
                                                    value={formData.name || ''}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                                                Email
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    type="email"
                                                    name="email"
                                                    id="email"
                                                    value={formData.email || ''}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                                                Phone Number
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    id="phone"
                                                    value={formData.phone || ''}
                                                    onChange={handleInputChange}
                                                    className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="location" className="block text-sm font-medium text-gray-300">
                                                Location
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    type="text"
                                                    name="location"
                                                    id="location"
                                                    value={formData.location || ''}
                                                    onChange={handleInputChange}
                                                    className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md"
                                                    placeholder="City, State/Province, Country"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-6">
                                            <label htmlFor="summary" className="block text-sm font-medium text-gray-300">
                                                Professional Summary
                                            </label>
                                            <div className="mt-1">
                                                <textarea
                                                    id="summary"
                                                    name="summary"
                                                    rows={4}
                                                    value={formData.summary || ''}
                                                    onChange={handleInputChange}
                                                    className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-6">
                                            <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-300">
                                                Additional Information
                                            </label>
                                            <div className="mt-1">
                                                <textarea
                                                    id="additionalInfo"
                                                    name="additionalInfo"
                                                    rows={4}
                                                    value={formData.additionalInfo || ''}
                                                    onChange={handleInputChange}
                                                    className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-3 bg-gray-800 text-right sm:px-6 border-t border-gray-600">
                                    <button
                                        type="button"
                                        onClick={() => router.push('/profile/setup')}
                                        className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md text-sm"
                                    >
                                        Edit Full Profile
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="ml-3 bg-blue-600 hover:bg-blue-700 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        {updating ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </PrivateRoute>
    );
}