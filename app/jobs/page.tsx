'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../ui/Context/AuthContext';
import { getJobs } from '../Services/firebase/firestore';
import { Job, JobStatus } from '../types';
import PrivateRoute from '../ui/components/PrivateRoute';
import ProfileCheck from '../ui/components/ProfileCheck';

export default function JobTracker() {
    const { currentUser } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            if (!currentUser) return;

            try {
                const userJobs = await getJobs(currentUser.uid);
                setJobs(userJobs);
            } catch (error) {
                console.error('Error fetching jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [currentUser]);

    const getStatusColor = (status: JobStatus) => {
        switch (status) {
            case 'Drafted':
                return 'bg-blue-100 text-blue-800';
            case 'Submitted':
                return 'bg-yellow-100 text-yellow-800';
            case 'Interviewing':
                return 'bg-purple-100 text-purple-800';
            case 'Offer':
                return 'bg-green-100 text-green-800';
            case 'Rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <div className="min-h-screen bg-gray-700 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
                    </div>
                </ProfileCheck>
            </PrivateRoute>
        );
    }

    return (
        <PrivateRoute>
            <ProfileCheck>
                <div className="min-h-screen bg-gray-700 p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold text-white">Job Tracker</h1>
                            <Link
                                href="/jobs/new"
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Add New Job
                            </Link>
                        </div>

                        {jobs.length === 0 ? (
                            <div className="bg-gray-800 p-8 rounded-lg text-center">
                                <h2 className="text-xl font-semibold text-white mb-4">No jobs tracked yet</h2>
                                <p className="text-gray-300 mb-6">Start tracking your job applications to stay organized!</p>
                                <Link
                                    href="/jobs/new"
                                    className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
                                >
                                    Add Your First Job
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {jobs.map((job) => (
                                    <div key={job.id} className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                                                <p className="text-gray-300">{job.company}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                                {job.status}
                                            </span>
                                        </div>

                                        {job.description && (
                                            <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                                                {job.description}
                                            </p>
                                        )}

                                        <div className="text-xs text-gray-500">
                                            Added: {job.createdAt.toLocaleDateString()}
                                        </div>

                                        <div className="mt-4 flex space-x-2">
                                            <Link
                                                href={`/jobs/${job.id}`}
                                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}