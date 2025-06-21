'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../ui/Context/AuthContext';
import { getUserProfile, updateUserProfile } from '../Services/firebase/firestore';
import { beautifyProfile } from '../Services/openai/functions';
import { UserProfile } from '../types';
import toast from 'react-hot-toast';
import PrivateRoute from '../ui/components/PrivateRoute';
import { getCardClasses, getInputClasses, getButtonClasses } from '../ui/styles/theme';

export default function Profile() {
    const { currentUser } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [formData, setFormData] = useState<Partial<UserProfile>>({});
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [beautifying, setBeautifying] = useState(false);

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

    // beautifyProfile function
    const handleBeautifyProfile = async () => {
        if (!profile) return;

        try {
            setBeautifying(true);
            toast.loading('Enhancing your profile content with AI magic...');

            const enhancedProfile = await beautifyProfile(profile);

            // Update form data with enhanced content
            setFormData(prev => ({
                ...prev,
                ...enhancedProfile
            }));

            toast.dismiss();
            toast.success('Profile enhanced successfully! Review and save the changes.', { duration: 3000 });

        } catch (error) {
            console.error('Error beautifying profile:', error);
            toast.dismiss();
            toast.error('Failed to enhance profile. Please try again.');
        } finally {
            setBeautifying(false);
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
                        <div className={getCardClasses()}>
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
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
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
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
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
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
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
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
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
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
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
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Beautify Profile Section */}
                                    <div className="mt-6 bg-blue-900/10 border border-blue-600/30 p-4 rounded-lg">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-medium text-blue-200 mb-2">
                                                    ✨ Enhance My Profile with AI
                                                </h3>
                                                <p className="text-sm text-blue-300">
                                                    Transform your profile content with AI-powered enhancements.
                                                </p>
                                            </div>
                                            <div className="mt-4 md:mt-0">
                                                <button
                                                    type="button"
                                                    onClick={handleBeautifyProfile}
                                                    disabled={beautifying}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:opacity-50"
                                                >
                                                    {beautifying ? (
                                                        <>
                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Enhancing...
                                                        </>
                                                    ) : (
                                                        'Enhance with AI'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-3 bg-gray-800 text-right sm:px-6 border-t border-gray-600">
                                    <button
                                        type="button"
                                        onClick={() => router.push('/profile/setup')}
                                        className={getButtonClasses('secondary')}
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