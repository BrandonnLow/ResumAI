'use client'

import React from 'react';
import { WeeklyProgress } from '../../types';
import { getCardClasses } from '../../ui/styles/theme';

interface WeeklyChartProps {
    data: WeeklyProgress[];
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className={getCardClasses()}>
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Weekly Progress</h3>
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-600 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <p className="text-gray-400">No progress data available yet</p>
                        <p className="text-sm text-gray-500 mt-1">Start practicing to see your weekly trends</p>
                    </div>
                </div>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(d => d.count), 0);
    const totalQuestions = data.reduce((sum, d) => sum + d.count, 0);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const formatFullDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // GitHub-style color intensity based on question count
    const getContributionColor = (count: number) => {
        if (count === 0) return 'bg-gray-700 border-gray-600';
        if (count <= 2) return 'bg-green-900 border-green-800';
        if (count <= 5) return 'bg-green-700 border-green-600';
        if (count <= 10) return 'bg-green-500 border-green-400';
        return 'bg-green-300 border-green-200';
    };

    const getContributionLevel = (count: number) => {
        if (count === 0) return 'No contributions';
        if (count <= 2) return 'Low activity';
        if (count <= 5) return 'Moderate activity';
        if (count <= 10) return 'High activity';
        return 'Very high activity';
    };

    // Calculate chart dimensions
    const chartWidth = 100;
    const chartHeight = 160;
    const cellSize = 12;
    const cellGap = 2;

    return (
        <div className={getCardClasses()}>
            <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-white">Weekly Progress</h3>
                        <p className="mt-1 text-sm text-gray-400">
                            Last {data.length} weeks of practice activity
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">
                            Total: <span className="text-white font-medium">{totalQuestions} questions</span>
                        </p>
                        <p className="text-xs text-gray-500">
                            Peak: {maxValue} in one week
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 max-w-full">
                        {data.map((item, index) => {
                            const isCurrentWeek = index === data.length - 1;

                            return (
                                <div
                                    key={index}
                                    className="group relative"
                                >
                                    <div
                                        className={`
                                            w-4 h-4 sm:w-5 sm:h-5 rounded-sm border transition-all duration-200 
                                            ${getContributionColor(item.count)}
                                            ${isCurrentWeek ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
                                            hover:ring-2 hover:ring-white hover:ring-opacity-30 cursor-pointer
                                        `}
                                        title={`${item.count} questions on ${formatFullDate(item.date)}`}
                                    />

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 border border-gray-700">
                                        <div className="font-medium">{item.count} questions</div>
                                        <div className="text-gray-300">{formatFullDate(item.date)}</div>
                                        <div className="text-gray-400 text-xs">{getContributionLevel(item.count)}</div>
                                        {/* Arrow */}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Week labels (show every other week to avoid crowding) */}
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 mt-2">
                        {data.map((item, index) => (
                            <div key={index} className="text-xs text-gray-500 text-center">
                                {index % 2 === 0 ? formatDate(item.date) : ''}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Legend */}
                <div className="mb-6">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center space-x-3 bg-gray-800/50 rounded-lg px-4 py-3 border border-gray-600/30">
                            <span className="text-xs text-gray-400 font-medium">Less</span>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-gray-700 border border-gray-600/50 rounded-sm"></div>
                                <div className="w-3 h-3 bg-green-900 border border-green-800/50 rounded-sm"></div>
                                <div className="w-3 h-3 bg-green-700 border border-green-600/50 rounded-sm"></div>
                                <div className="w-3 h-3 bg-green-500 border border-green-400/50 rounded-sm"></div>
                                <div className="w-3 h-3 bg-green-300 border border-green-200/50 rounded-sm"></div>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">More</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-center mt-3">
                        <div className="flex items-center space-x-6 text-xs text-gray-500">
                            <span className="font-mono">0</span>
                            <span className="font-mono">1-2</span>
                            <span className="font-mono">3-5</span>
                            <span className="font-mono">6-10</span>
                            <span className="font-mono">11+</span>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">📊 Activity Summary</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div className="text-center">
                            <div className="text-lg font-semibold text-white">{totalQuestions}</div>
                            <div className="text-gray-400">Total Questions</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-white">
                                {data.filter(d => d.count > 0).length}
                            </div>
                            <div className="text-gray-400">Active Weeks</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-white">{maxValue}</div>
                            <div className="text-gray-400">Best Week</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-white">
                                {data.length > 0 ? Math.round(totalQuestions / data.length) : 0}
                            </div>
                            <div className="text-gray-400">Avg per Week</div>
                        </div>
                    </div>
                </div>

                {/* Current week indicator */}
                {data.length > 0 && (
                    <div className="mt-4 flex items-center justify-center text-xs text-blue-400">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                        Current week: {data[data.length - 1]?.count || 0} questions
                    </div>
                )}
            </div>
        </div>
    );
}
