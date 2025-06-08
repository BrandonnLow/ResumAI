'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '../ui/Context/AuthContext';
import { getAnswers, getJobs, updateAnswer, deleteAnswer } from '../Services/firebase/firestore';
import { Answer, Job, QuestionCategory } from '../types';
import PrivateRoute from '../ui/components/PrivateRoute';
import ProfileCheck from '../ui/components/ProfileCheck';

export default function AnswerLibrary() {
    const { currentUser } = useAuth();
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [filteredAnswers, setFilteredAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'All'>('All');
    const [selectedJob, setSelectedJob] = useState<string>('All');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);

    // Fetch answers and jobs on component mount
    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);

                // Fetch all answers
                const userAnswers = await getAnswers(currentUser.uid);
                setAnswers(userAnswers);
                setFilteredAnswers(userAnswers);

                // Fetch jobs for filtering
                const userJobs = await getJobs(currentUser.uid);
                setJobs(userJobs);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    // Filter answers based on search term, category, job, and favorites
    useEffect(() => {
        let filtered = answers;

        // Filter by search term
        if (searchTerm.trim()) {
            filtered = filtered.filter(answer =>
                answer.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                answer.answerText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (answer.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Filter by category
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(answer => answer.category === selectedCategory);
        }

        // Filter by job
        if (selectedJob !== 'All') {
            filtered = filtered.filter(answer =>
                selectedJob === '' ? !answer.jobId : answer.jobId === selectedJob
            );
        }

        // Filter by favorites
        if (showFavoritesOnly) {
            filtered = filtered.filter(answer => answer.isFavorite);
        }

        setFilteredAnswers(filtered);
    }, [answers, searchTerm, selectedCategory, selectedJob, showFavoritesOnly]);

    // Format date
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Get job name by ID
    const getJobName = (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        return job ? `${job.title} at ${job.company}` : 'Unknown Job';
    };

    // Get category badge color
    const getCategoryBadgeColor = (category: QuestionCategory) => {
        switch (category) {
            case 'Motivational':
                return 'bg-green-100 text-green-800';
            case 'Behavioral':
                return 'bg-blue-100 text-blue-800';
            case 'Technical':
                return 'bg-purple-100 text-purple-800';
            case 'Personality':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Toggle favorite status
    const toggleFavorite = async (answerId: string, currentStatus: boolean) => {
        try {
            await updateAnswer({ id: answerId, isFavorite: !currentStatus });

            setAnswers(prev => prev.map(answer =>
                answer.id === answerId ? { ...answer, isFavorite: !currentStatus } : answer
            ));
        } catch (error) {
            console.error('Error updating favorite status:', error);
        }
    };

    // Delete answer
    const handleDeleteAnswer = async (answerId: string) => {
        if (!window.confirm('Are you sure you want to delete this answer?')) {
            return;
        }

        try {
            await deleteAnswer(answerId);
            setAnswers(prev => prev.filter(answer => answer.id !== answerId));
        } catch (error) {
            console.error('Error deleting answer:', error);
        }
    };

    if (loading) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <div className="min-h-screen bg-gray-700 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
                    </div>
                </ProfileCheck>
            </PrivateRoute>
        );
    }

    return (
        <PrivateRoute>
            <ProfileCheck>
                <div className="min-h-screen bg-gray-700 p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white">Answer Library</h1>
                                <p className="text-gray-400">
                                    View and manage your interview practice responses ({answers.length} total)
                                </p>
                            </div>
                            <button
                                onClick={() => window.location.href = '/practice/setup'}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Start New Practice
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            {/* Filters Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
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
                                            className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                                        />
                                    </div>

                                    {/* Category Filter */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Category
                                        </label>
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value as QuestionCategory | 'All')}
                                            className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                                        >
                                            <option value="All">All Categories</option>
                                            <option value="Motivational">Motivational</option>
                                            <option value="Behavioral">Behavioral</option>
                                            <option value="Technical">Technical</option>
                                            <option value="Personality">Personality</option>
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
                                            className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                                        >
                                            <option value="All">All Jobs</option>
                                            <option value="">General</option>
                                            {jobs.map(job => (
                                                <option key={job.id} value={job.id}>
                                                    {job.title} at {job.company}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Favorites Filter */}
                                    <div className="mb-6">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={showFavoritesOnly}
                                                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-300">Favorites only</span>
                                        </label>
                                    </div>

                                    {/* Clear Filters */}
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSelectedCategory('All');
                                            setSelectedJob('All');
                                            setShowFavoritesOnly(false);
                                        }}
                                        className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="lg:col-span-3">
                                {/* Results Count */}
                                <div className="mb-6">
                                    <p className="text-sm text-gray-400">
                                        Showing {filteredAnswers.length} of {answers.length} answers
                                    </p>
                                </div>

                                {/* Answer List */}
                                {filteredAnswers.length === 0 ? (
                                    <div className="bg-gray-800 p-8 rounded-lg text-center">
                                        <h3 className="text-lg font-medium text-white mb-2">No answers found</h3>
                                        {answers.length === 0 ? (
                                            <div>
                                                <p className="text-gray-400 mb-4">
                                                    You haven't saved any interview answers yet.
                                                </p>
                                                <button
                                                    onClick={() => window.location.href = '/practice/setup'}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setSelectedCategory('All');
                                                        setSelectedJob('All');
                                                        setShowFavoritesOnly(false);
                                                    }}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                                >
                                                    Clear Filters
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {filteredAnswers.map((answer) => (
                                            <div key={answer.id} className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                                                {/* Answer Header */}
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center mb-2">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(answer.category)}`}>
                                                                {answer.category}
                                                            </span>
                                                            {answer.jobId && (
                                                                <span className="ml-2 text-xs text-blue-400">
                                                                    {getJobName(answer.jobId)}
                                                                </span>
                                                            )}
                                                            <span className="ml-2 text-xs text-gray-400">
                                                                {formatDate(answer.createdAt)}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg font-medium text-blue-400 mb-3">
                                                            {answer.questionText}
                                                        </h3>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center space-x-2 ml-4">
                                                        <button
                                                            onClick={() => toggleFavorite(answer.id, answer.isFavorite)}
                                                            className={`p-2 rounded hover:bg-gray-600 transition-colors ${answer.isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                                                                }`}
                                                        >
                                                            <svg className="h-5 w-5" fill={answer.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAnswer(answer.id)}
                                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Answer Content */}
                                                <div className="mb-4">
                                                    <p className={`text-gray-300 ${expandedAnswer === answer.id ? '' : 'line-clamp-3'}`}>
                                                        {answer.answerText}
                                                    </p>
                                                    {answer.answerText.length > 200 && (
                                                        <button
                                                            onClick={() => setExpandedAnswer(expandedAnswer === answer.id ? null : answer.id)}
                                                            className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                                                        >
                                                            {expandedAnswer === answer.id ? 'Show less' : 'Show more'}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Feedback */}
                                                {answer.feedback && (
                                                    <div className="mb-4 bg-blue-900/20 border border-blue-600/30 p-3 rounded">
                                                        <h4 className="text-sm font-medium text-blue-200 mb-1">AI Feedback</h4>
                                                        <p className="text-sm text-blue-100 whitespace-pre-line">{answer.feedback}</p>
                                                    </div>
                                                )}

                                                {/* Tags */}
                                                {answer.tags && answer.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {answer.tags.map((tag, index) => (
                                                            <span
                                                                key={index}
                                                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}