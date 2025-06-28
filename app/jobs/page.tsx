'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../ui/Context/AuthContext';
import { getJobs } from '../Services/firebase/firestore';
import { Job, JobStatus } from '../types';
import toast from 'react-hot-toast';
import PrivateRoute from '../ui/components/PrivateRoute';
import ProfileCheck from '../ui/components/ProfileCheck';
import { getCardClasses, getButtonClasses } from '../ui/styles/theme';
import JobItem from '../ui/components/jobs/JobItem';
import { LoadingPage } from '../ui/components/Loading';

export default function JobTracker() {
    const { currentUser } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<JobStatus | 'All'>('All');

    useEffect(() => {
        const fetchJobs = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);
                const userJobs = await getJobs(currentUser.uid);
                setJobs(userJobs);
            } catch (error) {
                console.error('Error fetching jobs:', error);
                toast.error('Failed to load your jobs. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [currentUser]);

    // Handle job status updates from JobItem component
    const handleJobUpdate = (jobId: string, newStatus: JobStatus) => {
        setJobs(prevJobs =>
            prevJobs.map(job =>
                job.id === jobId
                    ? { ...job, status: newStatus, updatedAt: new Date() }
                    : job
            )
        );
    };

    const filteredJobs = filter === 'All'
        ? jobs
        : jobs.filter(job => job.status === filter);

    const jobStatusCounts = jobs.reduce((counts, job) => {
        counts[job.status] = (counts[job.status] || 0) + 1;
        return counts;
    }, {} as Record<JobStatus, number>);

    const totalJobs = jobs.length;

    if (loading && jobs.length === 0) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <LoadingPage text="Loading..." />
                </ProfileCheck>
            </PrivateRoute>
        );
    }

    return (
        <PrivateRoute>
            <ProfileCheck>
                <div className="min-h-screen bg-gray-700">
                    {/* Header */}
                    <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-20">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="mb-4 sm:mb-0">
                                    <h1 className="text-2xl font-bold text-white">Job Tracker</h1>
                                    <p className="mt-1 text-gray-400">
                                        Manage your job applications and track your progress ({totalJobs} total)
                                    </p>
                                    <p className="mt-1 text-sm text-blue-400">
                                        💡 Tip: Click on the status badge to quickly update your application status
                                    </p>
                                </div>
                                <div className="flex space-x-3">
                                    <Link
                                        href="/jobs/new"
                                        className={`${getButtonClasses('primary')} transform transition-all hover:scale-105`}
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add New Job
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Stats */}
                        <div className={`${getCardClasses()} mb-6`}>
                            <div className="px-4 py-5 sm:p-6">
                                <h2 className="text-lg font-medium text-white mb-4">Job Application Overview</h2>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="bg-gray-600 border border-gray-500 overflow-hidden shadow rounded-lg hover:border-gray-400 transition-all duration-200">
                                        <div className="px-4 py-5 sm:p-6">
                                            <dt className="text-sm font-medium text-gray-300 truncate">Total Jobs</dt>
                                            <dd className="mt-1 text-3xl font-semibold text-white">{totalJobs}</dd>
                                        </div>
                                    </div>
                                    <div className="bg-blue-900/20 border border-blue-600/30 overflow-hidden shadow rounded-lg hover:border-blue-600/50 transition-all duration-200">
                                        <div className="px-4 py-5 sm:p-6">
                                            <dt className="text-sm font-medium text-blue-200 truncate">Drafted</dt>
                                            <dd className="mt-1 text-3xl font-semibold text-white">{jobStatusCounts.Drafted || 0}</dd>
                                        </div>
                                    </div>
                                    <div className="bg-yellow-900/20 border border-yellow-600/30 overflow-hidden shadow rounded-lg hover:border-yellow-600/50 transition-all duration-200">
                                        <div className="px-4 py-5 sm:p-6">
                                            <dt className="text-sm font-medium text-yellow-200 truncate">Submitted</dt>
                                            <dd className="mt-1 text-3xl font-semibold text-white">{jobStatusCounts.Submitted || 0}</dd>
                                        </div>
                                    </div>
                                    <div className="bg-purple-900/20 border border-purple-600/30 overflow-hidden shadow rounded-lg hover:border-purple-600/50 transition-all duration-200">
                                        <div className="px-4 py-5 sm:p-6">
                                            <dt className="text-sm font-medium text-purple-200 truncate">Interviewing</dt>
                                            <dd className="mt-1 text-3xl font-semibold text-white">{jobStatusCounts.Interviewing || 0}</dd>
                                        </div>
                                    </div>
                                    <div className="bg-green-900/20 border border-green-600/30 overflow-hidden shadow rounded-lg hover:border-green-600/50 transition-all duration-200">
                                        <div className="px-4 py-5 sm:p-6">
                                            <dt className="text-sm font-medium text-green-200 truncate">Offers</dt>
                                            <dd className="mt-1 text-3xl font-semibold text-white">{jobStatusCounts.Offer || 0}</dd>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filter */}
                        <div className={`${getCardClasses()} mb-6`}>
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setFilter('All')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'All'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        All Jobs ({totalJobs})
                                    </button>
                                    <button
                                        onClick={() => setFilter('Drafted')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'Drafted'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        Drafted ({jobStatusCounts.Drafted || 0})
                                    </button>
                                    <button
                                        onClick={() => setFilter('Submitted')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'Submitted'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        Submitted ({jobStatusCounts.Submitted || 0})
                                    </button>
                                    <button
                                        onClick={() => setFilter('Interviewing')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'Interviewing'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        Interviewing ({jobStatusCounts.Interviewing || 0})
                                    </button>
                                    <button
                                        onClick={() => setFilter('Offer')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'Offer'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        Offers ({jobStatusCounts.Offer || 0})
                                    </button>
                                    <button
                                        onClick={() => setFilter('Rejected')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'Rejected'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        Rejected ({jobStatusCounts.Rejected || 0})
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Job list */}
                        {filteredJobs.length === 0 ? (
                            <div className={`${getCardClasses()} p-6 text-center`}>
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-600 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">No jobs found</h3>
                                {jobs.length > 0 ? (
                                    <p className="text-gray-400 mb-4">
                                        No jobs match your current filter. Try selecting a different status filter.
                                    </p>
                                ) : (
                                    <div>
                                        <p className="text-gray-400 mb-4">
                                            You haven't added any jobs yet. Start tracking your job applications to get organized!
                                        </p>
                                        <Link
                                            href="/jobs/new"
                                            className={getButtonClasses('primary')}
                                        >
                                            Add Your First Job
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredJobs.map((job) => (
                                    <JobItem
                                        key={job.id}
                                        job={job}
                                        onJobUpdate={handleJobUpdate}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}