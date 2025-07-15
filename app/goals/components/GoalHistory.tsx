'use client'

import React from 'react';
import { WeeklyGoal } from '../../types';
import { getCardClasses } from '../../ui/styles/theme';
import { getWeekStart } from '../../Services/firebase/firestore';

interface GoalHistoryProps {
    history: WeeklyGoal[];
    onRefresh: () => void;
}

export default function GoalHistory({ history, onRefresh }: GoalHistoryProps) {
    const formatDateRange = (weekStart: string, weekEnd: string) => {
        const start = new Date(weekStart);
        const end = new Date(weekEnd);

        const formatDate = (date: Date) => {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        };

        return `${formatDate(start)} - ${formatDate(end)}`;
    };

    const getCompletionPercentage = (current: number, target: number) => {
        return Math.min((current / target) * 100, 100);
    };

    const getStatusIcon = (goal: WeeklyGoal) => {
        if (goal.isCompleted) {
            return (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            );
        } else if (goal.currentProgress > 0) {
            return (
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            );
        } else {
            return (
                <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                </div>
            );
        }
    };

    const getStatusText = (goal: WeeklyGoal) => {
        if (goal.isCompleted) return 'Completed';
        if (goal.currentProgress > 0) return 'Partial';
        return 'Not started';
    };

    const getStatusColor = (goal: WeeklyGoal) => {
        if (goal.isCompleted) return 'text-green-400';
        if (goal.currentProgress > 0) return 'text-yellow-400';
        return 'text-gray-400';
    };

    const isCurrentWeekGoal = (goal: WeeklyGoal) => {
        const currentWeekStart = getWeekStart();
        const goalWeekStart = new Date(goal.weekStartDate);
        return goalWeekStart.toDateString() === currentWeekStart.toDateString();
    };

    return (
        <div className={getCardClasses()}>
            <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-white">Goal History</h3>
                        <p className="mt-1 text-sm text-gray-400">
                            Your past weekly goals and progress
                        </p>
                    </div>
                    <button
                        onClick={onRefresh}
                        className="text-gray-400 hover:text-gray-300 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {history.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-600 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-gray-400">No goal history yet</p>
                        <p className="text-sm text-gray-500 mt-1">Set your first weekly goal to start tracking</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {history.map((goal, index) => {
                            const completionPercentage = getCompletionPercentage(goal.currentProgress, goal.targetQuestions);
                            const isCurrentWeek = isCurrentWeekGoal(goal);

                            return (
                                <div
                                    key={goal.id}
                                    className={`border rounded-lg p-4 transition-all duration-200 hover:border-gray-500 ${isCurrentWeek
                                        ? 'border-blue-600/50 bg-blue-900/10'
                                        : 'border-gray-600 bg-gray-700/30'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            {getStatusIcon(goal)}
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {formatDateRange(goal.weekStartDate, goal.weekEndDate)}
                                                    {isCurrentWeek && (
                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/20 text-blue-300 border border-blue-600/30">
                                                            Current
                                                        </span>
                                                    )}
                                                </p>
                                                <p className={`text-xs ${getStatusColor(goal)}`}>
                                                    {getStatusText(goal)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-white">
                                                {goal.currentProgress}/{goal.targetQuestions}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {Math.round(completionPercentage)}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-600 rounded-full h-2">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${goal.isCompleted
                                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                                : completionPercentage > 0
                                                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                                    : 'bg-gray-500'
                                                }`}
                                            style={{ width: `${completionPercentage}%` }}
                                        />
                                    </div>

                                    {/* Completion Badge */}
                                    {goal.isCompleted && goal.completedDate && (
                                        <div className="mt-2 flex items-center text-xs text-green-400">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Completed {new Date(goal.completedDate).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Summary Stats */}
                {history.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-600">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-lg font-semibold text-white">
                                    {history.filter(g => g.isCompleted).length}
                                </p>
                                <p className="text-xs text-gray-400">Completed</p>
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-white">
                                    {history.reduce((sum, g) => sum + g.currentProgress, 0)}
                                </p>
                                <p className="text-xs text-gray-400">Total Questions</p>
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-white">
                                    {history.length > 0 ? Math.round(
                                        (history.filter(g => g.isCompleted).length / history.length) * 100
                                    ) : 0}%
                                </p>
                                <p className="text-xs text-gray-400">Success Rate</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
