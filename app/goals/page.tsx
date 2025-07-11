'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../ui/Context/AuthContext';
import {
    getCurrentWeekGoal,
    createOrUpdateWeeklyGoal,
    updateWeeklyGoalProgress,
    getWeekStart,
    getWeekEnd
} from '../Services/firebase/firestore';
import { WeeklyGoal } from '../types';
import toast from 'react-hot-toast';
import PrivateRoute from '../ui/components/PrivateRoute';
import ProfileCheck from '../ui/components/ProfileCheck';
import { getCardClasses, getButtonClasses } from '../ui/styles/theme';
import { LoadingPage } from '../ui/components/Loading';
import GoalProgress from './components/GoalProgress';
import GoalSettings from './components/GoalSettings';

export default function Goals() {
    const { currentUser } = useAuth();
    const router = useRouter();

    const [currentGoal, setCurrentGoal] = useState<WeeklyGoal | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    // Fetch current goal
    const fetchGoalData = async () => {
        if (!currentUser) return;

        try {
            setLoading(true);

            // Update progress first to ensure we have latest data
            await updateWeeklyGoalProgress(currentUser.uid);

            // Fetch current goal
            const goal = await getCurrentWeekGoal(currentUser.uid);
            setCurrentGoal(goal);
        } catch (error) {
            console.error('Error fetching goal data:', error);
            toast.error('Failed to load goal data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoalData();
    }, [currentUser]);

    // Handle setting new goal
    const handleSetGoal = async (targetQuestions: number) => {
        if (!currentUser) return;

        try {
            setLoading(true);

            await createOrUpdateWeeklyGoal(currentUser.uid, targetQuestions);
            await fetchGoalData(); // Refresh data

            toast.success(`Weekly goal set to ${targetQuestions} questions!`);
            setShowSettings(false);
        } catch (error) {
            console.error('Error setting goal:', error);
            toast.error('Failed to set goal. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getWeekDateRange = () => {
        const weekStart = getWeekStart();
        const weekEnd = getWeekEnd();

        const formatDate = (date: Date) => {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        };

        return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    };

    if (loading) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <LoadingPage text="Loading your goals..." />
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
                                    <h1 className="text-2xl font-bold text-white">Weekly Goals</h1>
                                    <p className="mt-1 text-gray-400">
                                        Track your interview practice progress for the week of {getWeekDateRange()}
                                    </p>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setShowSettings(true)}
                                        className={`${getButtonClasses('secondary')} transform transition-all hover:scale-105`}
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {currentGoal ? 'Update Goal' : 'Set Goal'}
                                    </button>
                                    <button
                                        onClick={() => router.push('/practice/setup')}
                                        className={`${getButtonClasses('primary')} transform transition-all hover:scale-105`}
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Start Practice
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Main Goal Progress */}
                        <GoalProgress
                            currentGoal={currentGoal}
                            onSetGoal={() => setShowSettings(true)}
                            onStartPractice={() => router.push('/practice/setup')}
                        />

                        {/* Coming Soon Placeholder */}
                        <div className={`${getCardClasses()} text-center py-8`}>
                            <div className="text-gray-400">
                                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <p className="text-lg font-medium mb-2">More features coming soon!</p>
                                <p className="text-sm">Statistics, charts, and history tracking will be added in future updates.</p>
                            </div>
                        </div>
                    </div>

                    {/* Goal Settings Modal */}
                    {showSettings && (
                        <GoalSettings
                            currentTarget={currentGoal?.targetQuestions || 0}
                            onSave={handleSetGoal}
                            onCancel={() => setShowSettings(false)}
                            loading={loading}
                        />
                    )}
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}
