'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../ui/Context/AuthContext';
import { updateJobStatus } from '../Services/firebase/firestore';
import { JobStatus } from '../types';
import toast from 'react-hot-toast';
import PrivateRoute from '../ui/components/PrivateRoute';
import ProfileCheck from '../ui/components/ProfileCheck';
import { getButtonClasses } from '../ui/styles/theme';
import { LoadingPage } from '../ui/components/Loading';
import { useDashboardData } from './hooks/useDashboardData';
import DashboardBanners from './components/DashboardBanners';
import QuickActions from './components/QuickActions';
import RecentAnswers from './components/RecentAnswers';
import JobApplications from './components/JobApplications';
import ProgressStats from './components/ProgressStats';
import GoalProgressBar from './components/GoalProgressBar';

export default function Dashboard() {
    const { currentUser, profileComplete } = useAuth();
    const router = useRouter();

    const {
        profile,
        profileError,
        allAnswers,
        recentAnswers,
        jobs,
        loading,
        showWelcome,
        setJobs,
        setShowWelcome,
        fetchDashboardData
    } = useDashboardData(currentUser, profileComplete);

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

    // Get display name with fallbacks
    const getDisplayName = () => {
        if (profile?.name && profile.name.trim() !== '') {
            return profile.name;
        }
        if (currentUser?.email) {
            return currentUser.email.split('@')[0];
        }
        return 'User';
    };

    // Handle quick job status update
    const handleQuickStatusUpdate = async (jobId: string, newStatus: JobStatus) => {
        if (!currentUser) return;

        try {
            await updateJobStatus(jobId, newStatus);

            setJobs(prevJobs =>
                prevJobs.map(job =>
                    job.id === jobId ? { ...job, status: newStatus } : job
                )
            );

            toast.success(`Job status updated to "${newStatus}"`);
        } catch (error) {
            console.error('Error updating job status:', error);
            toast.error('Failed to update job status');
            throw error; // Re-throw so JobApplications component can handle it
        }
    };

    if (loading) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <LoadingPage text="Loading your dashboard..." />
                </ProfileCheck>
            </PrivateRoute>
        );
    }

    return (
        <PrivateRoute>
            <ProfileCheck>
                <div className="min-h-screen bg-gray-700">
                    {/* Header */}
                    <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-6">
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
                        {/* Banners */}
                        <DashboardBanners
                            profile={profile}
                            profileError={profileError}
                            allAnswers={allAnswers}
                            jobs={jobs}
                            showWelcome={showWelcome}
                            currentUser={currentUser}
                            onSetShowWelcome={setShowWelcome}
                            onFetchDashboardData={fetchDashboardData}
                            getDisplayName={getDisplayName}
                        />

                        {/* Main Dashboard Cards */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <QuickActions />
                            <RecentAnswers
                                recentAnswers={recentAnswers}
                                jobs={jobs}
                                getCategoryBadgeColor={getCategoryBadgeColor}
                                getJobName={getJobName}
                            />
                            <JobApplications
                                jobs={jobs}
                                onQuickStatusUpdate={handleQuickStatusUpdate}
                            />
                        </div>

                        {/* Progress Stats */}
                        <ProgressStats allAnswers={allAnswers} jobs={jobs} />

                        {/* Goal Progress Bar */}
                        <GoalProgressBar />
                    </div>
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}