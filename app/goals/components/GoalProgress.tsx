'use client'

import React from 'react';
import { WeeklyGoal } from '../../types';
import { getCardClasses, getButtonClasses } from '../../ui/styles/theme';

interface GoalProgressProps {
    currentGoal: WeeklyGoal | null;
    onSetGoal: () => void;
    onStartPractice: () => void;
}

export default function GoalProgress({ currentGoal, onSetGoal, onStartPractice }: GoalProgressProps) {
    if (!currentGoal) {
        return (
            <div className={`${getCardClasses()} mb-8`}>
                <div className="px-4 py-8 sm:p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-blue-900/20 border border-blue-600/30 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Set Your Goal</h2>
                    <p className="text-gray-300 mb-6 max-w-md mx-auto">
                        Track your practice with a weekly target
                    </p>
                    <div className="space-y-4">
                        <button
                            onClick={onSetGoal}
                            className={`${getButtonClasses('primary')} px-8 py-3 text-base hover:scale-105 transition-all`}
                        >
                            Set Goal
                        </button>
                        <div className="text-sm text-gray-400">
                            <p>💡 Start with 5-10 questions</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const progress = Math.min((currentGoal.currentProgress / currentGoal.targetQuestions) * 100, 100);
    const done = currentGoal.isCompleted;
    const remaining = Math.max(0, currentGoal.targetQuestions - currentGoal.currentProgress);

    return (
        <div className={`${getCardClasses()} mb-8`}>
            <div className="px-4 py-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">This Week</h2>
                        <p className="text-gray-400 mt-1">
                            {currentGoal.currentProgress} of {currentGoal.targetQuestions} done
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex space-x-3">
                        <button
                            onClick={onSetGoal}
                            className={getButtonClasses('secondary')}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </button>
                        {!done && (
                            <button
                                onClick={onStartPractice}
                                className={getButtonClasses('primary')}
                            >
                                Practice
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-4 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${done
                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                : 'bg-gradient-to-r from-blue-500 to-purple-600'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${done ? 'bg-green-400' : 'bg-blue-400'}`} />
                            <div>
                                <p className="text-sm text-gray-400">Status</p>
                                <p className={`text-lg font-semibold ${done ? 'text-green-400' : 'text-blue-400'}`}>
                                    {done ? 'Done!' : 'Active'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-purple-400 rounded-full mr-3" />
                            <div>
                                <p className="text-sm text-gray-400">Completed</p>
                                <p className="text-lg font-semibold text-purple-400">
                                    {currentGoal.currentProgress}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${remaining === 0 ? 'bg-green-400' : 'bg-yellow-400'}`} />
                            <div>
                                <p className="text-sm text-gray-400">Left</p>
                                <p className={`text-lg font-semibold ${remaining === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {remaining}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {done && (
                    <div className="mt-6 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-600/30 rounded-lg p-4">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-green-400">Nice work!</h3>
                                <p className="text-green-300">Goal completed this week</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}