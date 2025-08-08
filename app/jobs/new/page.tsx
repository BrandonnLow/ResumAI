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

    const [form, setForm] = useState({
        title: '',
        company: '',
        description: '',
        status: 'Drafted' as JobStatus,
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            setSubmitting(true);
            const jobData = { ...form, userId: currentUser.uid };
            const newJobRef = await createJob(jobData);
            toast.success('Job added!');
            router.push(`/jobs/${newJobRef.id}`);
        } catch (error) {
            console.error('Create job failed:', error);
            toast.error('Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PrivateRoute>
            <ProfileCheck>
                <div className="min-h-screen bg-gray-700">
                    <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-6">
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
                                    <p className="mt-1 text-gray-400">Track a new application and prep for interviews</p>
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
                                            <label htmlFor="title" className="block text-sm font-medium text-gray-300">Job Title</label>
                                            <input
                                                type="text"
                                                name="title"
                                                id="title"
                                                value={form.title}
                                                onChange={handleChange}
                                                required
                                                className={`${getInputClasses()} block w-full sm:text-sm rounded-md mt-1`}
                                                placeholder="Software Engineer, Product Manager, etc."
                                            />
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="company" className="block text-sm font-medium text-gray-300">Company</label>
                                            <input
                                                type="text"
                                                name="company"
                                                id="company"
                                                value={form.company}
                                                onChange={handleChange}
                                                required
                                                className={`${getInputClasses()} block w-full sm:text-sm rounded-md mt-1`}
                                                placeholder="Google, Amazon, etc."
                                            />
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="status" className="block text-sm font-medium text-gray-300">Status</label>
                                            <select
                                                id="status"
                                                name="status"
                                                value={form.status}
                                                onChange={handleChange}
                                                className={`${getInputClasses()} block w-full sm:text-sm rounded-md appearance-none mt-1`}
                                            >
                                                <option value="Drafted">Drafted</option>
                                                <option value="Submitted">Submitted</option>
                                                <option value="Interviewing">Interviewing</option>
                                                <option value="Offer">Offer</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        </div>

                                        <div className="sm:col-span-6">
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-300">Job Description</label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                rows={8}
                                                value={form.description}
                                                onChange={handleChange}
                                                className={`${getInputClasses()} block w-full sm:text-sm rounded-md mt-1`}
                                                placeholder="Copy the job description here"
                                            />
                                            <p className="mt-2 text-sm text-gray-400">
                                                The full job description helps generate better interview questions.
                                            </p>
                                        </div>

                                        <div className="sm:col-span-6">
                                            <label htmlFor="notes" className="block text-sm font-medium text-gray-300">Notes</label>
                                            <textarea
                                                id="notes"
                                                name="notes"
                                                rows={4}
                                                value={form.notes}
                                                onChange={handleChange}
                                                className={`${getInputClasses()} block w-full sm:text-sm rounded-md mt-1`}
                                                placeholder="Recruiter contact, interview dates, salary range, etc."
                                            />
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
                                        disabled={submitting}
                                        className={getButtonClasses('primary')}
                                    >
                                        {submitting ? 'Adding...' : 'Add Job'}
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