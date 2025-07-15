'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { Answer, Job } from '../../types';
import { getCardClasses } from '../../ui/styles/theme';

interface RecentAnswersProps {
    recentAnswers: Answer[];
    jobs: Job[];
    getCategoryBadgeColor: (category: string) => string;
    getJobName: (jobId: string) => string;
}

export default function RecentAnswers({
    recentAnswers,
    jobs,
    getCategoryBadgeColor,
    getJobName
}: RecentAnswersProps) {
    const router = useRouter();

    return (
        <div className={`${getCardClasses()} hover:border-purple-500/40 transition-all duration-200`}>
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-medium text-white">Recent Answers</h2>
                    <p className="mt-1 text-sm text-gray-400">Your latest practice responses</p>
                </div>
                <button
                    onClick={() => router.push('/answers')}
                    className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                    View all
                    <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            <div className="border-t border-gray-600 px-4 py-5 sm:p-0">
                {recentAnswers.length === 0 ? (
                    <div className="px-4 py-5 sm:px-6 text-center">
                        <div className="w-12 h-12 mx-auto mb-4 bg-purple-900/20 border border-purple-600/30 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">You haven't saved any answers yet.</p>
                        <button
                            onClick={() => router.push('/practice/setup')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                        >
                            Start practicing
                        </button>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-600">
                        {recentAnswers.map((answer) => (
                            <li key={answer.id} className="px-4 py-4 sm:px-6">
                                <div className="flex items-center mb-1">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(answer.category)}`}>
                                        {answer.category}
                                    </span>
                                    {answer.jobId && (
                                        <span className="ml-2 text-xs text-gray-400">
                                            {getJobName(answer.jobId)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm font-medium text-white truncate">{answer.questionText}</p>
                                <p className="mt-1 text-sm text-gray-400 line-clamp-2">{answer.answerText}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}