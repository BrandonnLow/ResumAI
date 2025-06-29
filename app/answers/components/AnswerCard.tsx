'use client'

import React, { useState } from 'react';
import { Answer, Job, QuestionCategory } from '../../types';
import { updateAnswer, deleteAnswer } from '../../Services/firebase/firestore';
import toast from 'react-hot-toast';
import { getInputClasses, getButtonClasses } from '../../ui/styles/theme';

interface AnswerCardProps {
    answer: Answer;
    jobs: Job[];
    onAnswerUpdate: (updatedAnswer: Answer) => void;
    onAnswerDelete: (answerId: string) => void;
    expandedAnswer: string | null;
    setExpandedAnswer: (id: string | null) => void;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({
    answer,
    jobs,
    onAnswerUpdate,
    onAnswerDelete,
    expandedAnswer,
    setExpandedAnswer
}) => {
    const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

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

    // Toggle favorite status
    const toggleFavorite = async (answerId: string, currentStatus: boolean) => {
        try {
            await updateAnswer({ id: answerId, isFavorite: !currentStatus });

            const updatedAnswer = { ...answer, isFavorite: !currentStatus };
            onAnswerUpdate(updatedAnswer);

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

            const updatedAnswer = { ...answer, answerText: editText };
            onAnswerUpdate(updatedAnswer);

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
            onAnswerDelete(answerId);
            toast.success('Answer deleted successfully');
        } catch (error) {
            console.error('Error deleting answer:', error);
            toast.error('Failed to delete answer');
        }
    };

    return (
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
    );
};