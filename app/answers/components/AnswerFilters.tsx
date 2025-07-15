'use client'

import React from 'react';
import { Answer, Job, QuestionCategory } from '../../types';
import { getCardClasses, getInputClasses, getButtonClasses } from '../../ui/styles/theme';

interface AnswerFiltersProps {
    answers: Answer[];
    jobs: Job[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedCategory: QuestionCategory | 'All';
    setSelectedCategory: (category: QuestionCategory | 'All') => void;
    selectedJob: string;
    setSelectedJob: (job: string) => void;
    selectedTags: string[];
    showFavoritesOnly: boolean;
    toggleTagFilter: (tag: string) => void;
    handleQuickFavorites: () => void;
    handleQuickCategoryFilter: (category: QuestionCategory) => void;
    clearAllFilters: () => void;
    getAllTags: () => string[];
    showFilters: boolean;
}

export const AnswerFilters: React.FC<AnswerFiltersProps> = ({
    answers,
    jobs,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedJob,
    setSelectedJob,
    selectedTags,
    showFavoritesOnly,
    toggleTagFilter,
    handleQuickFavorites,
    handleQuickCategoryFilter,
    clearAllFilters,
    getAllTags,
    showFilters
}) => {
    return (
        <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className={`${getCardClasses()} p-6 lg:sticky lg:top-24`}>
                <h3 className="text-lg font-medium text-white mb-6">Filters</h3>

                {/* Search */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Search
                    </label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search questions, answers..."
                        className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                    />
                </div>

                {/* Quick Filter Chips */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                        Quick Filters
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleQuickFavorites}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showFavoritesOnly
                                ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-600/50'
                                : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                                }`}
                        >
                            Favorites ⭐
                        </button>
                        <button
                            onClick={() => handleQuickCategoryFilter('Behavioral')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategory === 'Behavioral'
                                ? 'bg-blue-900/40 text-blue-300 border border-blue-600/50'
                                : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                                }`}
                        >
                            Behavioral
                        </button>
                        <button
                            onClick={() => handleQuickCategoryFilter('Technical')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategory === 'Technical'
                                ? 'bg-purple-900/40 text-purple-300 border border-purple-600/50'
                                : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                                }`}
                        >
                            Technical
                        </button>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                        Category
                    </label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as QuestionCategory | 'All')}
                        className={`${getInputClasses()} block w-full sm:text-sm rounded-md [&>option]:bg-gray-700 [&>option]:text-white appearance-none`}
                        style={{
                            backgroundColor: '#374151',
                            color: 'white',
                        }}
                    >
                        <option value="All" className="bg-gray-700 text-white">All Categories ({answers.length})</option>
                        <option value="Motivational" className="bg-gray-700 text-white">Motivational ({answers.filter(a => a.category === 'Motivational').length})</option>
                        <option value="Behavioral" className="bg-gray-700 text-white">Behavioral ({answers.filter(a => a.category === 'Behavioral').length})</option>
                        <option value="Technical" className="bg-gray-700 text-white">Technical ({answers.filter(a => a.category === 'Technical').length})</option>
                        <option value="Personality" className="bg-gray-700 text-white">Personality ({answers.filter(a => a.category === 'Personality').length})</option>
                    </select>
                </div>

                {/* Job Filter */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                        Job
                    </label>
                    <select
                        value={selectedJob}
                        onChange={(e) => setSelectedJob(e.target.value)}
                        className={`${getInputClasses()} block w-full sm:text-sm rounded-md [&>option]:bg-gray-700 [&>option]:text-white appearance-none`}
                        style={{
                            backgroundColor: '#374151',
                            color: 'white'
                        }}
                    >
                        <option value="All" className="bg-gray-700 text-white">All Jobs ({answers.length})</option>
                        <option value="" className="bg-gray-700 text-white">General ({answers.filter(a => !a.jobId).length})</option>
                        {jobs.map(job => (
                            <option key={job.id} value={job.id} className="bg-gray-700 text-white">
                                {job.title} at {job.company} ({answers.filter(a => a.jobId === job.id).length})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Popular Tags */}
                {getAllTags().length > 0 && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Popular Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {getAllTags().slice(0, 8).map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTagFilter(tag)}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${selectedTags.includes(tag)
                                        ? 'bg-blue-900/40 text-blue-300 border border-blue-600/50'
                                        : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                                        }`}
                                >
                                    {tag} ({answers.filter(a => (a.tags || []).includes(tag)).length})
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Clear Filters */}
                <button
                    onClick={clearAllFilters}
                    className={`${getButtonClasses('secondary')} w-full`}
                >
                    Clear All Filters
                </button>
            </div>
        </div>
    );
};