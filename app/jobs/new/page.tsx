'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../ui/Context/AuthContext';
import { createJob } from '../../Services/firebase/firestore';
import { JobStatus } from '../../types';
import toast from 'react-hot-toast';
import PrivateRoute from '../../ui/components/PrivateRoute';
import ProfileCheck from '../../ui/components/ProfileCheck';
import { getCardClasses, getInputClasses, getButtonClasses } from '../../ui/styles/theme';

export default function JobForm() {
    const { currentUser } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: '',
        company: '',
        description: '',
        status: 'Drafted' as JobStatus,
        notes: ''
    });
    const [loading, setLoading] = useState(false);

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

            // Create job in Firestore
            const jobData = {
                ...formData,
                userId: currentUser.uid
            };

            const newJobRef = await createJob(jobData);

            toast.success('Job added successfully!');
            router.push(`/jobs/${newJobRef.id}`);
        } catch (error) {
            console.error('Error creating job:', error);
            toast.error('Failed to add job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PrivateRoute>
            <ProfileCheck>
                <div className="min-h-screen bg-gray-700">
                    {/* Header */}
                    <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-20">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex items-center">
                                <button
                                    onClick={() => router.back()}
                                    className="mr-4 text-gray-400 hover:text-gray-300 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Add New Job</h1>
                                    <p className="mt-1 text-gray-400">
                                        Track a new job application and prepare for interviews
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className={getCardClasses()}>
                            <form onSubmit={handleSubmit}>
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                                        <div className="sm:col-span-3">
                                            <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                                                Job Title
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    type="text"
                                                    name="title"
                                                    id="title"
                                                    value={formData.title}
                                                    onChange={handleInputChange}
                                                    required
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                    placeholder="e.g. Software Engineer, Product Manager"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="company" className="block text-sm font-medium text-gray-300">
                                                Company
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    type="text"
                                                    name="company"
                                                    id="company"
                                                    value={formData.company}
                                                    onChange={handleInputChange}
                                                    required
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                    placeholder="e.g. Google, Amazon, TikTok"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="status" className="block text-sm font-medium text-gray-300">
                                                Status
                                            </label>
                                            <div className="mt-1">
                                                <select
                                                    id="status"
                                                    name="status"
                                                    value={formData.status}
                                                    onChange={handleInputChange}
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md appearance-none`}
                                                >
                                                    <option value="Drafted">Drafted</option>
                                                    <option value="Submitted">Submitted</option>
                                                    <option value="Interviewing">Interviewing</option>
                                                    <option value="Offer">Offer</option>
                                                    <option value="Rejected">Rejected</option>
                                                </select>

                                            </div>
                                        </div>

                                        <div className="sm:col-span-6">
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                                                Job Description
                                            </label>
                                            <div className="mt-1">
                                                <textarea
                                                    id="description"
                                                    name="description"
                                                    rows={8}
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                    placeholder="Paste the job description here"
                                                />
                                            </div>
                                            <p className="mt-2 text-sm text-gray-400">
                                                Adding the full job description helps tailor interview questions and AI feedback to this specific role.
                                            </p>
                                        </div>

                                        <div className="sm:col-span-6">
                                            <label htmlFor="notes" className="block text-sm font-medium text-gray-300">
                                                Notes
                                            </label>
                                            <div className="mt-1">
                                                <textarea
                                                    id="notes"
                                                    name="notes"
                                                    rows={4}
                                                    value={formData.notes}
                                                    onChange={handleInputChange}
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                    placeholder="Add any notes about this job (recruiter info, interview details, etc.)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-3 bg-gray-700 text-right sm:px-6 border-t border-gray-600">
                                    <button
                                        type="button"
                                        onClick={() => router.push('/jobs')}
                                        className={`${getButtonClasses('secondary')} mr-3`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={getButtonClasses('primary')}
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