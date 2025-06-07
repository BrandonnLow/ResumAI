'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../ui/Context/AuthContext';
import { createUserProfile } from '../../Services/firebase/firestore';
import { UserProfile } from '../../types';
import PrivateRoute from '../../ui/components/PrivateRoute';

export default function ProfileSetup() {
    const { currentUser, refreshProfileStatus } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: currentUser?.email || '',
        phone: '',
        location: '',
        summary: '',
        additionalInfo: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) return;

        try {
            setLoading(true);

            const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
                uid: currentUser.uid,
                ...formData,
                education: [],
                workExperience: [],
                projects: [],
                skills: [],
                extracurriculars: []
            };

            await createUserProfile(profile);
            await refreshProfileStatus();

            router.push('/dashboard');
        } catch (error) {
            console.error('Error creating profile:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PrivateRoute>
            <div className="min-h-screen bg-gray-700 py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gray-800 p-8 rounded-lg border border-gray-600">
                        <h1 className="text-3xl font-bold text-white mb-6">
                            Complete Your Profile
                        </h1>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-white text-sm font-bold mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-white text-sm font-bold mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-white text-sm font-bold mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-white text-sm font-bold mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                                    placeholder="City, State/Province, Country"
                                />
                            </div>

                            <div>
                                <label className="block text-white text-sm font-bold mb-2">
                                    Professional Summary
                                </label>
                                <textarea
                                    name="summary"
                                    value={formData.summary}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                                    placeholder="Brief overview of your professional background and career goals"
                                />
                            </div>

                            <div>
                                <label className="block text-white text-sm font-bold mb-2">
                                    Additional Information
                                </label>
                                <textarea
                                    name="additionalInfo"
                                    value={formData.additionalInfo}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                                    placeholder="Any other information you'd like to include"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Creating Profile...' : 'Complete Setup'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </PrivateRoute>
    );
}