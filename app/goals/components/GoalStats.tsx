'use client'

import React from 'react';
import { GoalStats as GoalStatsType } from '../../types';
import { getCardClasses } from '../../ui/styles/theme';

interface GoalStatsProps {
    stats: GoalStatsType;
}

export default function GoalStat({ stats }: GoalStatsProps) {
    const cards = [
        {
            title: 'Streak',
            value: stats.weeklyStreak,
            suffix: 'weeks',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            color: 'from-yellow-500 to-orange-600'
        },
        {
            title: 'Completed',
            value: stats.totalWeeksCompleted,
            suffix: 'goals',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
            ),
            color: 'from-green-500 to-green-600'
        },
        {
            title: 'Average',
            value: stats.averageCompletion,
            suffix: '%',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            color: 'from-blue-500 to-purple-600'
        },
        {
            title: 'Best Week',
            value: stats.bestWeek,
            suffix: 'questions',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            ),
            color: 'from-purple-500 to-pink-600'
        }
    ];

    const getMessage = () => {
        if (stats.weeklyStreak >= 4) return "🔥 On fire!";
        if (stats.weeklyStreak >= 2) return "⭐ Keep going!";
        if (stats.totalWeeksCompleted >= 5) return "💪 Strong work!";
        if (stats.averageCompletion >= 80) return "🎯 Nice rate!";
        if (stats.currentWeekProgress > 0) return "🚀 Making progress!";
        return "💫 Ready to start?";
    };

    const badges = [];
    if (stats.weeklyStreak >= 3) badges.push({ text: "🔥 Streak", color: "bg-yellow-900/20 text-yellow-300 border-yellow-600/30" });
    if (stats.totalWeeksCompleted >= 1) badges.push({ text: "✅ Achiever", color: "bg-green-900/20 text-green-300 border-green-600/30" });
    if (stats.averageCompletion >= 90) badges.push({ text: "🎯 Pro", color: "bg-blue-900/20 text-blue-300 border-blue-600/30" });
    if (stats.bestWeek >= 20) badges.push({ text: "⚡ Power", color: "bg-purple-900/20 text-purple-300 border-purple-600/30" });

    if (badges.length === 0) {
        badges.push({ text: "🌱 Starter", color: "bg-gray-700 text-gray-400 border-gray-600" });
    }

    return (
        <div className={`${getCardClasses()} mb-8`}>
            <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-medium text-white">Your Stats</h2>
                        <p className="mt-1 text-sm text-gray-400">
                            Progress overview
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-blue-400">
                            {getMessage()}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {cards.map((card, i) => (
                        <div
                            key={i}
                            className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4 hover:border-gray-500 transition-all"
                        >
                            <div className="flex items-center">
                                <div className={`w-10 h-10 bg-gradient-to-r ${card.color} rounded-lg flex items-center justify-center mr-3`}>
                                    <div className="text-white">
                                        {card.icon}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-300">
                                        {card.title}
                                    </p>
                                    <p className="text-2xl font-bold text-white">
                                        {card.value}
                                        <span className="text-sm text-gray-400 ml-1">
                                            {card.suffix}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-600">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Badges</h3>
                    <div className="flex flex-wrap gap-2">
                        {badges.map((badge, i) => (
                            <div key={i} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                                {badge.text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}