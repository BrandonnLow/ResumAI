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
    const [goal, setGoal] = useState<WeeklyGoal | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const loadGoal = async () => {
            try {
                setLoading(true);
                await updateWeeklyGoalProgress(currentUser.uid);
                const weekGoal = await getCurrentWeekGoal(currentUser.uid);
                setGoal(weekGoal);
            } catch (err) {
                console.error('Goal fetch failed:', err);
            }
            setLoading(false);
        };

        loadGoal();
    }, [currentUser]);

    if (loading || !goal) return null;

    const progress = Math.min((goal.currentProgress / goal.targetQuestions) * 100, 100);
    const remaining = Math.max(0, goal.targetQuestions - goal.currentProgress);
    const done = goal.isCompleted;

    const progressBarBg = done
        ? 'bg-gradient-to-r from-green-500 to-green-600'
        : 'bg-gradient-to-r from-blue-500 to-purple-600';

    const statusColor = done ? 'text-green-400' : 'text-blue-400';
    const dotColor = done ? 'bg-green-400' : 'bg-blue-400';

    return (
        <div className={`${getCardClasses()} mt-8`}>
            <div className="px-4 py-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-medium text-white">Weekly Goal Progress</h2>
                        <p className="text-sm text-gray-400">
                            {goal.currentProgress} of {goal.targetQuestions} questions completed this week
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

                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${progressBarBg}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${dotColor}`} />
                        <span className={`text-sm font-medium ${statusColor}`}>
                            {done ? 'Goal Completed! 🎉' : `${remaining} questions remaining`}
                        </span>
                    </div>

                    {!done && (
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