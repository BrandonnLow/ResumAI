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
                        <p className="text-gray-400">No data yet</p>
                        <p className="text-sm text-gray-500 mt-1">Start practicing to see your progress</p>
                    </div>
                </div>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(d => d.count), 0);
    const total = data.reduce((sum, d) => sum + d.count, 0);

    const shortDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const fullDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-700 border-gray-600';
        if (count <= 2) return 'bg-green-900 border-green-800';
        if (count <= 5) return 'bg-green-700 border-green-600';
        if (count <= 10) return 'bg-green-500 border-green-400';
        return 'bg-green-300 border-green-200';
    };

    return (
        <div className={getCardClasses()}>
            <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-white">Weekly Progress</h3>
                        <p className="mt-1 text-sm text-gray-400">
                            Last {data.length} weeks
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">
                            Total: <span className="text-white font-medium">{total}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                            Best: {maxValue}
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                        {data.map((item, i) => {
                            const isCurrent = i === data.length - 1;

                            return (
                                <div key={i} className="group relative">
                                    <div
                                        className={`
                                            w-4 h-4 sm:w-5 sm:h-5 rounded-sm border transition-all
                                            ${getColor(item.count)}
                                            ${isCurrent ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
                                            hover:ring-2 hover:ring-white hover:ring-opacity-30 cursor-pointer
                                        `}
                                        title={`${item.count} questions on ${fullDate(item.date)}`}
                                    />

                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-gray-700">
                                        <div className="font-medium">{item.count} questions</div>
                                        <div className="text-gray-300">{fullDate(item.date)}</div>
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 mt-2">
                        {data.map((item, i) => (
                            <div key={i} className="text-xs text-gray-500 text-center">
                                {i % 2 === 0 ? shortDate(item.date) : ''}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center space-x-3 bg-gray-800/50 rounded-lg px-4 py-3 border border-gray-600/30">
                            <span className="text-xs text-gray-400">Less</span>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-gray-700 border border-gray-600/50 rounded-sm"></div>
                                <div className="w-3 h-3 bg-green-900 border border-green-800/50 rounded-sm"></div>
                                <div className="w-3 h-3 bg-green-700 border border-green-600/50 rounded-sm"></div>
                                <div className="w-3 h-3 bg-green-500 border border-green-400/50 rounded-sm"></div>
                                <div className="w-3 h-3 bg-green-300 border border-green-200/50 rounded-sm"></div>
                            </div>
                            <span className="text-xs text-gray-400">More</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div className="text-center">
                            <div className="text-lg font-semibold text-white">{total}</div>
                            <div className="text-gray-400">Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-white">
                                {data.filter(d => d.count > 0).length}
                            </div>
                            <div className="text-gray-400">Active</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-white">{maxValue}</div>
                            <div className="text-gray-400">Best</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-white">
                                {Math.round(total / data.length) || 0}
                            </div>
                            <div className="text-gray-400">Average</div>
                        </div>
                    </div>
                </div>

                {data.length > 0 && (
                    <div className="mt-4 flex items-center justify-center text-xs text-blue-400">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                        This week: {data[data.length - 1]?.count || 0}
                    </div>
                )}
            </div>
        </div>
    );
}