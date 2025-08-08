'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../ui/Context/AuthContext';
import {
    getCurrentWeekGoal,
    createOrUpdateWeeklyGoal,
    updateWeeklyGoalProgress,
    getGoalStats,
    getUserWeeklyGoals,
    getWeeklyProgressData,
    getWeekStart,
    getWeekEnd
} from '../Services/firebase/firestore';
import { WeeklyGoal, GoalStats, WeeklyProgress } from '../types';
import toast from 'react-hot-toast';
import PrivateRoute from '../ui/components/PrivateRoute';
import ProfileCheck from '../ui/components/ProfileCheck';
import { getCardClasses, getButtonClasses } from '../ui/styles/theme';
import { LoadingPage } from '../ui/components/Loading';
import GoalProgress from './components/GoalProgress';
import GoalSettings from './components/GoalSettings';
import GoalStat from './components/GoalStats';
import WeeklyChart from './components/WeeklyChart';
import GoalHistory from './components/GoalHistory';

export default function Goals() {
    const { currentUser } = useAuth();
    const router = useRouter();

    const [goal, setGoal] = useState<WeeklyGoal | null>(null);
    const [stats, setStats] = useState<GoalStats>({
        currentWeekProgress: 0,
        currentWeekTarget: 0,
        weeklyStreak: 0,
        totalWeeksCompleted: 0,
        averageCompletion: 0,
        bestWeek: 0
    });
    const [progress, setProgress] = useState<WeeklyProgress[]>([]);
    const [history, setHistory] = useState<WeeklyGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    const loadData = async () => {
        if (!currentUser) return;

        try {
            setLoading(true);
            await updateWeeklyGoalProgress(currentUser.uid);

            const [goalData, statsData, progressData, historyData] = await Promise.all([
                getCurrentWeekGoal(currentUser.uid),
                getGoalStats(currentUser.uid),
                getWeeklyProgressData(currentUser.uid, 12),
                getUserWeeklyGoals(currentUser.uid)
            ]);

            setGoal(goalData);
            setStats(statsData);
            setProgress(progressData);
            setHistory(historyData.slice(0, 10));
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentUser]);

    const saveGoal = async (target: number) => {
        if (!currentUser) return;

        try {
            setLoading(true);
            await createOrUpdateWeeklyGoal(currentUser.uid, target);
            await loadData();
            toast.success(`Goal set to ${target} questions!`);
            setShowSettings(false);
        } catch (error) {
            toast.error('Failed to save goal');
        } finally {
            setLoading(false);
        }
    };

    const getWeekRange = () => {
        const start = getWeekStart();
        const end = getWeekEnd();

        const format = (date: Date) => date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        return `${format(start)} - ${format(end)}`;
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
                    <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="mb-4 sm:mb-0">
                                    <h1 className="text-2xl font-bold text-white">Weekly Goals</h1>
                                    <p className="mt-1 text-gray-400">
                                        Week of {getWeekRange()}
                                    </p>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setShowSettings(true)}
                                        className={`${getButtonClasses('secondary')} hover:scale-105 transition-all`}
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {goal ? 'Update Goal' : 'Set Goal'}
                                    </button>
                                    <button
                                        onClick={() => router.push('/practice/setup')}
                                        className={`${getButtonClasses('primary')} hover:scale-105 transition-all`}
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
                        <GoalProgress
                            currentGoal={goal}
                            onSetGoal={() => setShowSettings(true)}
                            onStartPractice={() => router.push('/practice/setup')}
                        />

                        <GoalStat stats={stats} />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                            <WeeklyChart data={progress} />
                            <GoalHistory history={history} onRefresh={loadData} />
                        </div>

                        {goal && (
                            <div className={`${getCardClasses()} mt-8`}>
                                <div className="px-4 py-5 sm:p-6 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-white mb-2">
                                        {goal.isCompleted ? "🎉 Nice work!" : "Keep it up!"}
                                    </h3>
                                    <p className="text-gray-300">
                                        {goal.isCompleted
                                            ? `Goal completed! ${goal.targetQuestions} questions done this week.`
                                            : `${goal.targetQuestions - goal.currentProgress} more to hit your weekly target.`}
                                    </p>
                                    {!goal.isCompleted && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => router.push('/practice/setup')}
                                                className={`${getButtonClasses('primary')} hover:scale-105 transition-all`}
                                            >
                                                Keep Practicing
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {showSettings && (
                        <GoalSettings
                            currentTarget={goal?.targetQuestions || 0}
                            onSave={saveGoal}
                            onCancel={() => setShowSettings(false)}
                            loading={loading}
                        />
                    )}
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}