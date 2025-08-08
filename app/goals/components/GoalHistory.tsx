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
    const formatWeek = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);

        const fmt = (date: Date) => date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        return `${fmt(s)} - ${fmt(e)}`;
    };

    const getProgress = (current: number, target: number) => {
        return Math.min((current / target) * 100, 100);
    };

    const getIcon = (goal: WeeklyGoal) => {
        const className = "w-6 h-6 rounded-full flex items-center justify-center";

        if (goal.isCompleted) {
            return (
                <div className={`${className} bg-green-500`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            );
        }

        if (goal.currentProgress > 0) {
            return (
                <div className={`${className} bg-yellow-500`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            );
        }

        return (
            <div className={`${className} bg-gray-500`}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
            </div>
        );
    };

    const getStatus = (goal: WeeklyGoal) => {
        if (goal.isCompleted) return { text: 'Done', color: 'text-green-400' };
        if (goal.currentProgress > 0) return { text: 'Partial', color: 'text-yellow-400' };
        return { text: 'Skipped', color: 'text-gray-400' };
    };

    const isCurrent = (goal: WeeklyGoal) => {
        const currentWeek = getWeekStart();
        const goalWeek = new Date(goal.weekStartDate);
        return goalWeek.toDateString() === currentWeek.toDateString();
    };

    return (
        <div className={getCardClasses()}>
            <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-white">History</h3>
                        <p className="mt-1 text-sm text-gray-400">
                            Past goals and progress
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
                        <p className="text-gray-400">No history yet</p>
                        <p className="text-sm text-gray-500 mt-1">Set your first goal to start tracking</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {history.map((goal) => {
                            const progress = getProgress(goal.currentProgress, goal.targetQuestions);
                            const current = isCurrent(goal);
                            const status = getStatus(goal);

                            return (
                                <div
                                    key={goal.id}
                                    className={`border rounded-lg p-4 transition-all hover:border-gray-500 ${current
                                        ? 'border-blue-600/50 bg-blue-900/10'
                                        : 'border-gray-600 bg-gray-700/30'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            {getIcon(goal)}
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {formatWeek(goal.weekStartDate, goal.weekEndDate)}
                                                    {current && (
                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/20 text-blue-300 border border-blue-600/30">
                                                            Current
                                                        </span>
                                                    )}
                                                </p>
                                                <p className={`text-xs ${status.color}`}>
                                                    {status.text}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-white">
                                                {goal.currentProgress}/{goal.targetQuestions}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {Math.round(progress)}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full bg-gray-600 rounded-full h-2">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${goal.isCompleted
                                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                                : progress > 0
                                                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                                    : 'bg-gray-500'
                                                }`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    {goal.isCompleted && goal.completedDate && (
                                        <div className="mt-2 flex items-center text-xs text-green-400">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Done {new Date(goal.completedDate).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

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
                                <p className="text-xs text-gray-400">Total</p>
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-white">
                                    {history.length > 0 ? Math.round(
                                        (history.filter(g => g.isCompleted).length / history.length) * 100
                                    ) : 0}%
                                </p>
                                <p className="text-xs text-gray-400">Success</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}