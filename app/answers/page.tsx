'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../ui/Context/AuthContext';
import { getAnswers, getJobs, updateAnswer, deleteAnswer } from '../Services/firebase/firestore';
import { Answer, Job, QuestionCategory } from '../types';
import toast from 'react-hot-toast';
import PrivateRoute from '../ui/components/PrivateRoute';
import ProfileCheck from '../ui/components/ProfileCheck';
import { getCardClasses, getInputClasses, getButtonClasses } from '../ui/styles/theme';
import { LoadingPage } from '../ui/components/Loading';

export default function AnswerLibrary() {
    const { currentUser } = useAuth();
    const router = useRouter();

    const [answers, setAnswers] = useState<Answer[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [filteredAnswers, setFilteredAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'All'>('All');
    const [selectedJob, setSelectedJob] = useState<string>('All');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);
    const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [showFilters, setShowFilters] = useState(false); // For mobile

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
                toast.error('Failed to load your answers. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    // Filter answers based on search term, category, job, tags, and favorites
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

        // Filter by tags
        if (selectedTags.length > 0) {
            filtered = filtered.filter(answer =>
                selectedTags.every(tag => (answer.tags || []).includes(tag))
            );
        }

        // Filter by favorites
        if (showFavoritesOnly) {
            filtered = filtered.filter(answer => answer.isFavorite);
        }

        setFilteredAnswers(filtered);
    }, [answers, searchTerm, selectedCategory, selectedJob, selectedTags, showFavoritesOnly]);

    const formatDate = (date: any) => {
        try {
            if (date && typeof date === 'object' && date.seconds !== undefined) {
                return new Date(date.seconds * 1000).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                });
            }

            if (date) {
                const jsDate = new Date(date);
                if (!isNaN(jsDate.getTime())) {
                    return jsDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    });
                }
            }

            return 'Recent';
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Recent';
        }
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

    // Get all unique tags from answers
    const getAllTags = () => {
        const allTags = new Set<string>();
        answers.forEach(answer => {
            if (answer.tags && Array.isArray(answer.tags)) {
                answer.tags.forEach(tag => allTags.add(tag));
            }
        });
        return Array.from(allTags).sort();
    };

    // Toggle favorite status
    const toggleFavorite = async (answerId: string, currentStatus: boolean) => {
        try {
            await updateAnswer({ id: answerId, isFavorite: !currentStatus });

            setAnswers(prev => prev.map(answer =>
                answer.id === answerId ? { ...answer, isFavorite: !currentStatus } : answer
            ));

            toast.success(currentStatus ? 'Removed from favorites' : 'Added to favorites');
        } catch (error) {
            console.error('Error updating favorite status:', error);
            toast.error('Failed to update favorite status');
        }
    };

    // Start editing answer
    const startEditing = (answer: Answer) => {
        setEditingAnswer(answer.id);
        setEditText(answer.answerText);
    };

    // Save edited answer
    const saveEdit = async (answerId: string) => {
        try {
            await updateAnswer({ id: answerId, answerText: editText });

            setAnswers(prev => prev.map(answer =>
                answer.id === answerId ? { ...answer, answerText: editText } : answer
            ));

            setEditingAnswer(null);
            setEditText('');
            toast.success('Answer updated successfully');
        } catch (error) {
            console.error('Error updating answer:', error);
            toast.error('Failed to update answer');
        }
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingAnswer(null);
        setEditText('');
    };

    // Delete answer
    const handleDeleteAnswer = async (answerId: string) => {
        if (!window.confirm('Are you sure you want to delete this answer? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteAnswer(answerId);

            setAnswers(prev => prev.filter(answer => answer.id !== answerId));
            toast.success('Answer deleted successfully');
        } catch (error) {
            console.error('Error deleting answer:', error);
            toast.error('Failed to delete answer');
        }
    };

    // Toggle tag filter
    const toggleTagFilter = (tag: string) => {
        setSelectedTags(prev => {
            if (prev.includes(tag)) {
                return prev.filter(t => t !== tag);
            } else {
                return [...prev, tag];
            }
        });
    };

    // Quick filter handlers with proper state sync
    const handleQuickFavorites = () => {
        setShowFavoritesOnly(!showFavoritesOnly);
    };

    const handleQuickCategoryFilter = (category: QuestionCategory) => {
        setSelectedCategory(selectedCategory === category ? 'All' : category);
    };

    // Clear all filters
    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedCategory('All');
        setSelectedJob('All');
        setSelectedTags([]);
        setShowFavoritesOnly(false);
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
                                {/* Mobile filter toggle */}
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
                            {/* Filters Sidebar */}
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

                            {/* Main Content */}
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
                                                    onClick={() => router.push('/practice/setup')}
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
                                                <div className="px-6 py-5">
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
                                                                className={`p-2 rounded hover:bg-gray-600 transition-colors ${answer.isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
                                                            >
                                                                <svg className="h-5 w-5" fill={answer.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => startEditing(answer)}
                                                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-600 rounded transition-colors"
                                                            >
                                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
                                                        {editingAnswer === answer.id ? (
                                                            <div>
                                                                <textarea
                                                                    value={editText}
                                                                    onChange={(e) => setEditText(e.target.value)}
                                                                    rows={6}
                                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md mb-4`}
                                                                />
                                                                <div className="flex justify-end space-x-2">
                                                                    <button
                                                                        onClick={cancelEdit}
                                                                        className={getButtonClasses('secondary')}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={() => saveEdit(answer.id)}
                                                                        className={getButtonClasses('primary')}
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <p className={`text-gray-300 ${expandedAnswer === answer.id ? '' : 'line-clamp-3'}`}>
                                                                    {answer.answerText}
                                                                </p>
                                                                {answer.answerText.length > 200 && (
                                                                    <button
                                                                        onClick={() => setExpandedAnswer(expandedAnswer === answer.id ? null : answer.id)}
                                                                        className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                                                    >
                                                                        {expandedAnswer === answer.id ? 'Show less' : 'Show more'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Feedback */}
                                                    {answer.feedback && (
                                                        <div className="mb-4 bg-blue-900/20 border border-blue-600/30 p-3 rounded-md">
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