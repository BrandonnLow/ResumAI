'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../ui/Context/AuthContext';
import { createJob } from '../../Services/firebase/firestore';
import { JobStatus } from '../../types';
import PrivateRoute from '../../ui/components/PrivateRoute';
import ProfileCheck from '../../ui/components/ProfileCheck';

export default function NewJob() {
    const { currentUser } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        company: '',
        description: '',
        status: 'Drafted' as JobStatus,
        notes: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

            await createJob({
                ...formData,
                userId: currentUser.uid
            });

            router.push('/jobs');
        } catch (error) {
            console.error('Error creating job:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PrivateRoute>
            <ProfileCheck>
                <div className="min-h-screen bg-gray-700 p-8">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-gray-800 p-8 rounded-lg border border-gray-600">
                            <h1 className="text-3xl font-bold text-white mb-6">Add New Job</h1>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-white text-sm font-bold mb-2">
                                        Job Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white text-sm font-bold mb-2">
                                        Company *
                                    </label>
                                    <input
                                        type="text"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white text-sm font-bold mb-2">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                                    >
                                        <option value="Drafted">Drafted</option>
                                        <option value="Submitted">Submitted</option>
                                        <option value="Interviewing">Interviewing</option>
                                        <option value="Offer">Offer</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-white text-sm font-bold mb-2">
                                        Job Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={6}
                                        className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                                        placeholder="Paste the job description here..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-white text-sm font-bold mb-2">
                                        Notes
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                                        placeholder="Any additional notes..."
                                    />
                                </div>

                                <div className="flex space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => router.push('/jobs')}
                                        className="flex-1 bg-gray-600 text-white p-3 rounded hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Adding...' : 'Add Job'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}