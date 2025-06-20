'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../ui/Context/AuthContext';
import { getUserProfile, getAnswers, getJobs, updateJobStatus } from '../Services/firebase/firestore';
import { UserProfile, Answer, Job, JobStatus } from '../types';
import toast from 'react-hot-toast';
import PrivateRoute from '../ui/components/PrivateRoute';
import ProfileCheck from '../ui/components/ProfileCheck';
import { getCardClasses, getButtonClasses } from '../ui/styles/theme';
import Link from 'next/link';

export default function Dashboard() {
    const { currentUser, profileComplete } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
    const [recentAnswers, setRecentAnswers] = useState<Answer[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);
    const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

    // Track if we're currently fetching to prevent duplicate requests
    const fetchingRef = useRef(false);
    const mountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Memoized fetch function to prevent recreation on every render
    const fetchDashboardData = useCallback(async () => {
        // Prevent multiple simultaneous fetches
        if (!currentUser || fetchingRef.current) {
            console.log('Skipping fetch - no user or already fetching');
            return;
        }

        try {
            fetchingRef.current = true;
            setLoading(true);
            setProfileError(null);

            console.log('Starting dashboard data fetch for user:', currentUser.uid);

            // Fetch all data in parallel
            const [userProfile, userAnswers, userJobs] = await Promise.all([
                getUserProfile(currentUser.uid),
                getAnswers(currentUser.uid),
                getJobs(currentUser.uid)
            ]);

            console.log('Data fetched successfully:', {
                profile: !!userProfile,
                profileName: userProfile?.name || 'N/A',
                answersCount: userAnswers.length,
                jobsCount: userJobs.length
            });

            // Handle profile
            if (!userProfile) {
                console.error('No profile found for user:', currentUser.uid);
                setProfileError('Profile not found');
            } else {
                setProfile(userProfile);
                if (!userProfile.name || userProfile.name.trim() === '') {
                    setProfileError('Profile name is missing');
                }
            }

            // Set answers
            setAllAnswers(userAnswers);
            setRecentAnswers(userAnswers.slice(0, 5));

            // Set jobs
            setJobs(userJobs);

            // Check for welcome message
            const hasShownWelcome = localStorage.getItem(`welcome_shown_${currentUser.uid}`);
            if (profileComplete && !hasShownWelcome && userProfile) {
                setShowWelcome(true);
                localStorage.setItem(`welcome_shown_${currentUser.uid}`, 'true');
            }

            console.log('Dashboard data updated successfully');

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setProfileError('Failed to load profile data');
            toast.error('Failed to load dashboard data. Please try again.');
        } finally {
            // Always set loading to false
            setLoading(false);
            fetchingRef.current = false;
            console.log('Dashboard fetch completed, loading set to false');
        }
    }, [currentUser, profileComplete]);

    // Main data fetching effect
    useEffect(() => {
        if (currentUser && mountedRef.current) {
            console.log('useEffect triggered for dashboard data fetch');
            fetchDashboardData();
        }
    }, [currentUser, fetchDashboardData]);

    // Ensure loading doesn't stay true forever
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading && !fetchingRef.current) {
                console.log('Fallback: Setting loading to false after timeout');
                setLoading(false);
            }
        }, 10000); // 10 second timeout

        return () => clearTimeout(timeout);
    }, [loading]);

    // Get job name by ID
    const getJobName = (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        return job ? `${job.title} at ${job.company}` : 'Unknown Job';
    };

    // Get category badge color
    const getCategoryBadgeColor = (category: string) => {
        switch (category) {
            case 'Motivational':
                return 'bg-green-100 text-green-800';
            case 'Behavioral':
                return 'bg-blue-100 text-blue-800';
            case 'Technical':
                return 'bg-purple-100 text-purple-800';
            case 'Personality':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <div className="min-h-screen bg-gray-700 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
                            <p className="text-gray-300">Loading your dashboard...</p>
                        </div>
                    </div>
                </ProfileCheck>
            </PrivateRoute>
        );
    }

    const handleQuickStatusUpdate = async (jobId: string, newStatus: JobStatus) => {
        if (updatingJobId || !currentUser) return;

        setUpdatingJobId(jobId);

        try {
            await updateJobStatus(jobId, newStatus);
            if (mountedRef.current) {
                setJobs(prevJobs =>
                    prevJobs.map(job =>
                        job.id === jobId ? { ...job, status: newStatus } : job
                    )
                );
                toast.success(`Job status updated to "${newStatus}"`);
            }
        } catch (error) {
            console.error('Error updating job status:', error);
            if (mountedRef.current && currentUser) {
                toast.error('Failed to update job status');
            }
        } finally {
            if (mountedRef.current) {
                setUpdatingJobId(null);
            }
        }
    };

    // Get display name with multiple fallbacks
    const getDisplayName = () => {
        if (profile?.name && profile.name.trim() !== '') {
            return profile.name;
        }
        if (currentUser?.email) {
            return currentUser.email.split('@')[0];
        }
        return 'User';
    };

    // Debug component - only show if there's actually an issue
    const DebugBanner = () => {
        const hasDataIssue = !profile && !profileError && allAnswers.length === 0 && jobs.length === 0;

        if (!hasDataIssue) return null;

        return (
            <div className="mb-6 bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-red-200">Data Loading Issue Detected</h3>
                        <div className="mt-2 text-sm text-red-300">
                            <p>No data was loaded. This might be a temporary issue.</p>
                            <p className="mt-1">Current User ID: <code className="bg-red-800/30 px-1 rounded">{currentUser?.uid}</code></p>
                        </div>
                        <div className="mt-3">
                            <button
                                onClick={() => {
                                    setLoading(true);
                                    fetchDashboardData();
                                }}
                                className="inline-flex items-center px-3 py-2 border border-red-600 text-sm font-medium rounded-md text-red-200 hover:bg-red-900/20"
                            >
                                Retry Loading Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Welcome banner for first-time users
    const WelcomeBanner = () => {
        if (!showWelcome) return null;

        return (
            <div className="mb-6 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-600/30 rounded-lg p-6">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600">
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                    </div>
                    <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-white">
                            🎉 Welcome to resuMate, {getDisplayName()}!
                        </h3>
                        <p className="mt-2 text-blue-200">
                            Your profile is complete! Now you can start practicing with personalized interview questions,
                            track your job applications, and get AI-powered feedback to improve your interview skills.
                        </p>
                        <div className="mt-4 flex space-x-3">
                            <button
                                onClick={() => router.push('/practice/setup')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Start First Practice
                            </button>
                            <button
                                onClick={() => setShowWelcome(false)}
                                className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-200 hover:bg-blue-900/20"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                        <button
                            onClick={() => setShowWelcome(false)}
                            className="inline-flex text-blue-400 hover:text-blue-300"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Profile error banner
    const ProfileErrorBanner = () => {
        if (!profileError) return null;

        return (
            <div className="mb-6 bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-yellow-200">Profile Issue Detected</h3>
                        <div className="mt-2 text-sm text-yellow-300">
                            <p>{profileError}. This may affect your experience.</p>
                        </div>
                        <div className="mt-3">
                            <button
                                onClick={() => router.push('/profile/setup')}
                                className="inline-flex items-center px-3 py-2 border border-yellow-600 text-sm font-medium rounded-md text-yellow-200 hover:bg-yellow-900/20"
                            >
                                Complete Profile Setup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <PrivateRoute>
            <ProfileCheck>
                <div className="min-h-screen bg-gray-700">
                    {/* Header */}
                    <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-20">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="mb-4 sm:mb-0">
                                    <h1 className="text-2xl font-bold text-white">
                                        Welcome, {getDisplayName()}!
                                    </h1>
                                    <p className="mt-1 text-gray-400">Your interview preparation dashboard</p>
                                    {profileError && (
                                        <p className="mt-1 text-sm text-yellow-400">⚠️ Profile needs attention</p>
                                    )}
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => router.push('/practice/setup')}
                                        className={`${getButtonClasses('primary')} transform transition-all hover:scale-105`}
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Start Practice
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Debug Banner */}
                        <DebugBanner />

                        {/* Welcome Banner */}
                        <WelcomeBanner />

                        {/* Profile Error Banner */}
                        <ProfileErrorBanner />

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* Quick actions card */}
                            <div className={`${getCardClasses()} hover:border-blue-500/40 transition-all duration-200`}>
                                <div className="px-4 py-5 sm:p-6">
                                    <h2 className="text-lg font-medium text-white mb-4">Quick Actions</h2>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => router.push('/practice/setup')}
                                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                        >
                                            Start Practice Session
                                        </button>
                                        <button
                                            onClick={() => router.push('/jobs/new')}
                                            className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all duration-200"
                                        >
                                            Add New Job
                                        </button>
                                        <button
                                            onClick={() => router.push('/profile')}
                                            className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all duration-200"
                                        >
                                            Update Profile
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recent answers card */}
                            <div className={`${getCardClasses()} hover:border-purple-500/40 transition-all duration-200`}>
                                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-medium text-white">Recent Answers</h2>
                                        <p className="mt-1 text-sm text-gray-400">Your latest practice responses</p>
                                    </div>
                                    <button
                                        onClick={() => router.push('/answers')}
                                        className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300"
                                    >
                                        View all
                                        <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="border-t border-gray-600 px-4 py-5 sm:p-0">
                                    {recentAnswers.length === 0 ? (
                                        <div className="px-4 py-5 sm:px-6 text-center">
                                            <div className="w-12 h-12 mx-auto mb-4 bg-purple-900/20 border border-purple-600/30 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-gray-400 mb-3">You haven't saved any answers yet.</p>
                                            <button
                                                onClick={() => router.push('/practice/setup')}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                                            >
                                                Start practicing
                                            </button>
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-gray-600">
                                            {recentAnswers.map((answer) => (
                                                <li key={answer.id} className="px-4 py-4 sm:px-6">
                                                    <div className="flex items-center mb-1">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(answer.category)}`}>
                                                            {answer.category}
                                                        </span>
                                                        {answer.jobId && (
                                                            <span className="ml-2 text-xs text-gray-400">
                                                                {getJobName(answer.jobId)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-white truncate">{answer.questionText}</p>
                                                    <p className="mt-1 text-sm text-gray-400 line-clamp-2">{answer.answerText}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Job applications card */}
                            <div className={`${getCardClasses()} hover:border-green-500/40 transition-all duration-200`}>
                                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-medium text-white">Job Applications</h2>
                                        <p className="mt-1 text-sm text-gray-400">Track your job search progress</p>
                                    </div>
                                    <button
                                        onClick={() => router.push('/jobs')}
                                        className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300"
                                    >
                                        View all
                                        <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="border-t border-gray-600 px-4 py-5 sm:p-0">
                                    {jobs.length === 0 ? (
                                        <div className="px-4 py-5 sm:px-6 text-center">
                                            <div className="w-12 h-12 mx-auto mb-4 bg-green-900/20 border border-green-600/30 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-gray-400 mb-3">You haven't added any jobs yet.</p>
                                            <button
                                                onClick={() => router.push('/jobs/new')}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                                            >
                                                Add job
                                            </button>
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-gray-600">
                                            {jobs.slice(0, 5).map((job) => (
                                                <li key={job.id} className="px-4 py-4 sm:px-6">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex-1 min-w-0">
                                                            <Link href={`/jobs/${job.id}`} className="block hover:text-blue-400 transition-colors">
                                                                <p className="text-sm font-medium text-white truncate">{job.title}</p>
                                                                <p className="text-sm text-gray-400">{job.company}</p>
                                                            </Link>
                                                        </div>
                                                        <div className="ml-4 flex-shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                                                            <select
                                                                value={job.status}
                                                                onChange={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleQuickStatusUpdate(job.id, e.target.value as JobStatus);
                                                                }}
                                                                disabled={updatingJobId === job.id}
                                                                className={`
                                                                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer
                                                                    ${job.status === 'Drafted' ? 'bg-blue-100 text-blue-800' :
                                                                        job.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                                                                            job.status === 'Interviewing' ? 'bg-purple-100 text-purple-800' :
                                                                                job.status === 'Offer' ? 'bg-green-100 text-green-800' :
                                                                                    'bg-red-100 text-red-800'
                                                                    }
                                                                    ${updatingJobId === job.id ? 'opacity-50' : 'hover:opacity-80'}
                                                                    focus:outline-none focus:ring-2 focus:ring-blue-500
                                                                    appearance-none -webkit-appearance-none -moz-appearance-none
                                                                    pr-6 disabled:cursor-not-allowed
                                                                `}
                                                                style={{
                                                                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                                                    backgroundSize: '1em 1em',
                                                                    backgroundPosition: 'right 0.25rem center',
                                                                    backgroundRepeat: 'no-repeat'
                                                                }}
                                                            >
                                                                <option value="Drafted">Drafted</option>
                                                                <option value="Submitted">Submitted</option>
                                                                <option value="Interviewing">Interviewing</option>
                                                                <option value="Offer">Offer</option>
                                                                <option value="Rejected">Rejected</option>
                                                            </select>

                                                            {updatingJobId === job.id && (
                                                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                                    <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-current"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats card */}
                        <div className={`mt-8 ${getCardClasses()}`}>
                            <div className="px-4 py-5 sm:p-6">
                                <h2 className="text-lg font-medium text-white mb-4">Your Progress</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-900/20 border border-blue-600/30 overflow-hidden shadow rounded-lg hover:border-blue-600/50 transition-all duration-200">
                                        <div className="px-4 py-5 sm:p-6">
                                            <dt className="text-sm font-medium text-blue-200 truncate">Total Answers</dt>
                                            <dd className="mt-1 text-3xl font-semibold text-white">{allAnswers.length}</dd>
                                        </div>
                                    </div>
                                    <div className="bg-purple-900/20 border border-purple-600/30 overflow-hidden shadow rounded-lg hover:border-purple-600/50 transition-all duration-200">
                                        <div className="px-4 py-5 sm:p-6">
                                            <dt className="text-sm font-medium text-purple-200 truncate">Jobs Tracked</dt>
                                            <dd className="mt-1 text-3xl font-semibold text-white">{jobs.length}</dd>
                                        </div>
                                    </div>
                                    <div className="bg-indigo-900/20 border border-indigo-600/30 overflow-hidden shadow rounded-lg hover:border-indigo-600/50 transition-all duration-200">
                                        <div className="px-4 py-5 sm:p-6">
                                            <dt className="text-sm font-medium text-indigo-200 truncate">Job Interviews</dt>
                                            <dd className="mt-1 text-3xl font-semibold text-white">
                                                {jobs.filter(job => job.status === 'Interviewing').length}
                                            </dd>
                                        </div>
                                    </div>
                                    <div className="bg-green-900/20 border border-green-600/30 overflow-hidden shadow rounded-lg hover:border-green-600/50 transition-all duration-200">
                                        <div className="px-4 py-5 sm:p-6">
                                            <dt className="text-sm font-medium text-green-200 truncate">Job Offers</dt>
                                            <dd className="mt-1 text-3xl font-semibold text-white">
                                                {jobs.filter(job => job.status === 'Offer').length}
                                            </dd>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Action Buttons */}
                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => router.push('/practice/setup')}
                                        className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Start Practice
                                    </button>

                                    <button
                                        onClick={() => router.push('/answers')}
                                        className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        View Answers
                                    </button>

                                    <button
                                        onClick={() => router.push('/jobs/new')}
                                        className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add Job
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}