'use client'

import React from 'react';
import { Answer, Job } from '../../types';
import { getCardClasses, getButtonClasses } from '../../ui/styles/theme';
import { AnswerCard } from './AnswerCard';

interface AnswerListProps {
    answers: Answer[];
    filteredAnswers: Answer[];
    jobs: Job[];
    showFavoritesOnly: boolean;
    clearAllFilters: () => void;
    onAnswerUpdate: (updatedAnswer: Answer) => void;
    onAnswerDelete: (answerId: string) => void;
    expandedAnswer: string | null;
    setExpandedAnswer: (id: string | null) => void;
    onStartPractice: () => void;
}

export const AnswerList: React.FC<AnswerListProps> = ({
    answers,
    filteredAnswers,
    jobs,
    showFavoritesOnly,
    clearAllFilters,
    onAnswerUpdate,
    onAnswerDelete,
    expandedAnswer,
    setExpandedAnswer,
    onStartPractice
}) => {
    return (
        <div className="lg:col-span-3 mt-8 lg:mt-0">
            {/* Results Count */}
            <div className="mb-6 flex justify-between items-center">
                <div className="text-sm text-gray-400">
                    Showing {filteredAnswers.length} of {answers.length} answers
                    {showFavoritesOnly && <span className="ml-2 text-yellow-400">⭐ Favorites only</span>}
                </div>
                {filteredAnswers.length > 0 && (
                    <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-400">
                        <span>Sort by:</span>
                        <select
                            className="bg-gray-700 border-gray-600 text-white text-sm rounded px-2 py-1 [&>option]:bg-gray-700 [&>option]:text-white appearance-none"
                            style={{
                                backgroundColor: '#374151',
                                color: 'white'
                            }}
                        >
                            <option className="bg-gray-700 text-white">Most Recent</option>
                            <option className="bg-gray-700 text-white">Oldest First</option>
                            <option className="bg-gray-700 text-white">Category</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Answer List */}
            {filteredAnswers.length === 0 ? (
                <div className={`${getCardClasses()} p-8 text-center`}>
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-600 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No answers found</h3>
                    {answers.length === 0 ? (
                        <div>
                            <p className="text-gray-400 mb-4">
                                You haven't saved any interview answers yet.
                            </p>
                            <button
                                onClick={onStartPractice}
                                className={getButtonClasses('primary')}
                            >
                                Start Your First Practice Session
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-400 mb-4">
                                No answers match your current filters.
                            </p>
                            <button
                                onClick={clearAllFilters}
                                className={getButtonClasses('primary')}
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredAnswers.map((answer) => (
                        <div key={answer.id} className={`${getCardClasses()} hover-lift transition-smooth`}>
                            <AnswerCard
                                answer={answer}
                                jobs={jobs}
                                onAnswerUpdate={onAnswerUpdate}
                                onAnswerDelete={onAnswerDelete}
                                expandedAnswer={expandedAnswer}
                                setExpandedAnswer={setExpandedAnswer}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};