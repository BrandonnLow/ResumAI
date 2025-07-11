'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../ui/Context/AuthContext';
import { getCurrentWeekGoal, updateWeeklyGoalProgress } from '../../Services/firebase/firestore';
import { WeeklyGoal } from '../../types';
import { getCardClasses, getButtonClasses } from '../../ui/styles/theme';

export default function GoalProgressBar() {
    const { currentUser } = useAuth();
    const router = useRouter();
    const [currentGoal, setCurrentGoal] = useState<WeeklyGoal | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGoalData = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);

                // Update progress first
                await updateWeeklyGoalProgress(currentUser.uid);

                // Then fetch current goal
                const goal = await getCurrentWeekGoal(currentUser.uid);
                setCurrentGoal(goal);
            } catch (error) {
                console.error('Error fetching goal data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGoalData();
    }, [currentUser]);

    if (loading || !currentGoal) {
        return null; // Don't show anything if no goal is set
    }

    const { currentProgress, targetQuestions, isCompleted } = currentGoal;
    const progressPercentage = Math.min((currentProgress / targetQuestions) * 100, 100);
    const remainingQuestions = Math.max(0, targetQuestions - currentProgress);

    return (
        <div className={`${getCardClasses()} mt-8`}>
            <div className="px-4 py-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-medium text-white">Weekly Goal Progress</h2>
                        <p className="text-sm text-gray-400">
                            {currentGoal.currentProgress} of {currentGoal.targetQuestions} questions completed this week
                        </p>
                    </div>
                    <div className="mt-3 sm:mt-0">
                        <button
                            onClick={() => router.push('/goals')}
                            className={`${getButtonClasses('secondary')} text-sm`}
                        >
                            View Details
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                        <span>Progress</span>
                        <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${isCompleted
                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                : 'bg-gradient-to-r from-blue-500 to-purple-600'
                                }`}
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${isCompleted ? 'bg-green-400' : 'bg-blue-400'
                            }`} />
                        <span className={`text-sm font-medium ${isCompleted ? 'text-green-400' : 'text-blue-400'
                            }`}>
                            {isCompleted ? 'Goal Completed! 🎉' : `${remainingQuestions} questions remaining`}
                        </span>
                    </div>

                    {!isCompleted && (
                        <button
                            onClick={() => router.push('/practice/setup')}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            Practice Now →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}