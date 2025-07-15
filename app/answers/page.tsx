'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../ui/Context/AuthContext';
import { getAnswers, getJobs } from '../Services/firebase/firestore';
import { Answer, Job } from '../types';
import toast from 'react-hot-toast';
import PrivateRoute from '../ui/components/PrivateRoute';
import ProfileCheck from '../ui/components/ProfileCheck';
import { getButtonClasses } from '../ui/styles/theme';
import { LoadingPage } from '../ui/components/Loading';
import { useAnswerFilters } from './hooks/useAnswerFilters';
import { AnswerFilters } from './components/AnswerFilters';
import { AnswerList } from './components/AnswerList';

export default function AnswerLibrary() {
    const { currentUser } = useAuth();
    const router = useRouter();

    const [answers, setAnswers] = useState<Answer[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const {
        filteredAnswers,
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
        getAllTags
    } = useAnswerFilters(answers);

    // Fetch answers and jobs on component mount
    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);
                const [userAnswers, userJobs] = await Promise.all([
                    getAnswers(currentUser.uid),
                    getJobs(currentUser.uid)
                ]);
                setAnswers(userAnswers);
                setJobs(userJobs);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load your answers. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    const handleAnswerUpdate = (updatedAnswer: Answer) => {
        setAnswers(prev => prev.map(answer =>
            answer.id === updatedAnswer.id ? updatedAnswer : answer
        ));
    };

    const handleAnswerDelete = (answerId: string) => {
        setAnswers(prev => prev.filter(answer => answer.id !== answerId));
    };

    if (loading) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <LoadingPage text="Loading..." />
                </ProfileCheck>
            </PrivateRoute>
        );
    }

    return (
        <PrivateRoute>
            <ProfileCheck>
                <div className="min-h-screen bg-gray-700">
                    {/* Header */}
                    <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-2xl font-bold text-white">Answer Library</h1>
                                <p className="mt-1 text-gray-400">
                                    View and manage your interview practice responses ({answers.length} total)
                                </p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="sm:hidden inline-flex items-center px-3 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                                    </svg>
                                    Filters
                                </button>
                                <button
                                    onClick={() => router.push('/practice/setup')}
                                    className={`${getButtonClasses('primary')} transform transition-all hover:scale-105`}
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Start New Practice
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
                            <AnswerFilters
                                answers={answers}
                                jobs={jobs}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                selectedCategory={selectedCategory}
                                setSelectedCategory={setSelectedCategory}
                                selectedJob={selectedJob}
                                setSelectedJob={setSelectedJob}
                                selectedTags={selectedTags}
                                showFavoritesOnly={showFavoritesOnly}
                                toggleTagFilter={toggleTagFilter}
                                handleQuickFavorites={handleQuickFavorites}
                                handleQuickCategoryFilter={handleQuickCategoryFilter}
                                clearAllFilters={clearAllFilters}
                                getAllTags={getAllTags}
                                showFilters={showFilters}
                            />
                            <AnswerList
                                answers={answers}
                                filteredAnswers={filteredAnswers}
                                jobs={jobs}
                                showFavoritesOnly={showFavoritesOnly}
                                clearAllFilters={clearAllFilters}
                                onAnswerUpdate={handleAnswerUpdate}
                                onAnswerDelete={handleAnswerDelete}
                                expandedAnswer={expandedAnswer}
                                setExpandedAnswer={setExpandedAnswer}
                                onStartPractice={() => router.push('/practice/setup')}
                            />
                        </div>
                    </div>
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}