'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../ui/Context/AuthContext';
import {
    getPracticeSession,
    getUserProfile,
    getJob,
    saveAnswer
} from '../../../Services/firebase/firestore';
import { generateQuestions, getAnswerFeedback, suggestTags } from '../../../Services/openai/functions';
import { PracticeSession as SessionType, Question, UserProfile, Job, QuestionCategory } from '../../../types';
import toast from 'react-hot-toast';
import { serverTimestamp } from 'firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../Services/firebase/config';
import PrivateRoute from '../../../ui/components/PrivateRoute';
import ProfileCheck from '../../../ui/components/ProfileCheck';
import { getCardClasses, getInputClasses, getButtonClasses } from '../../../ui/styles/theme';
import Loading, { LoadingPage } from '../../../ui/components/Loading';

export default function PracticeSession() {
    const params = useParams();
    const sessionId = params.sessionId as string;
    const { currentUser } = useAuth();
    const router = useRouter();

    const [session, setSession] = useState<SessionType | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [job, setJob] = useState<Job | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [userAnswer, setUserAnswer] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [savedAnswer, setSavedAnswer] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [generatingQuestions, setGeneratingQuestions] = useState<boolean>(false);
    const [gettingFeedback, setGettingFeedback] = useState<boolean>(false);
    const [customTagInput, setCustomTagInput] = useState('');

    useEffect(() => {
        const loadSessionData = async () => {
            if (!sessionId || !currentUser) return;

            try {
                setLoading(true);
                setGeneratingQuestions(true);

                // Fetch practice session
                const sessionData = await getPracticeSession(sessionId);

                if (!sessionData) {
                    toast.error('Practice session not found');
                    setGeneratingQuestions(false);
                    return router.push('/practice/setup');
                }

                if (sessionData.userId !== currentUser.uid) {
                    toast.error('You do not have access to this session');
                    setGeneratingQuestions(false);
                    return router.push('/practice/setup');
                }

                if (!sessionData.categories || sessionData.categories.length === 0) {
                    toast.error('Invalid session: No question categories found');
                    setGeneratingQuestions(false);
                    return router.push('/practice/setup');
                }

                setSession(sessionData);
                setCurrentQuestionIndex(sessionData.currentQuestionIndex || 0);

                // Fetch user profile
                const profile = await getUserProfile(currentUser.uid);
                if (!profile) {
                    toast.error('User profile not found');
                    setGeneratingQuestions(false);
                    return router.push('/profile/setup');
                }
                setUserProfile(profile);

                // Fetch job if job-specific session
                let jobData = null;
                if (sessionData.jobId) {
                    jobData = await getJob(sessionData.jobId);
                    setJob(jobData);
                }

                // Check if this is a new session (no questions)
                if (!sessionData.questions || sessionData.questions.length === 0) {
                    toast.dismiss();
                    toast.loading('Generating personalized interview questions...');

                    await generateSessionQuestions(sessionData, profile, jobData);
                } else {
                    setGeneratingQuestions(false);

                    const questionIndex = sessionData.currentQuestionIndex || 0;
                    if (sessionData.questions.length > questionIndex) {
                        setCurrentQuestion(sessionData.questions[questionIndex]);
                    } else if (sessionData.questions.length > 0) {
                        setCurrentQuestion(sessionData.questions[0]);
                        setCurrentQuestionIndex(0);
                    }
                }
            } catch (error) {
                console.error('Error loading session data:', error);
                toast.error('Failed to load session data. Please try again.');
                setGeneratingQuestions(false);
            } finally {
                setLoading(false);
            }
        };

        loadSessionData();
    }, [sessionId, currentUser, router]);

    // Generate questions for the session with validation
    const generateSessionQuestions = async (
        sessionData: SessionType,
        profile: UserProfile,
        job?: Job | null
    ) => {
        if (!sessionId) return;

        try {
            console.log('Generating questions for categories:', sessionData.categories);

            const questionsData = await generateQuestions(
                profile,
                sessionData.categories,
                5,
                job || undefined
            );

            if (!questionsData || !Array.isArray(questionsData) || questionsData.length === 0) {
                toast.dismiss();
                toast.error('Failed to generate questions. Please try again.');
                setGeneratingQuestions(false);
                return;
            }

            // Validate that generated questions match selected categories
            const validQuestions = questionsData.filter(q =>
                q.category && sessionData.categories.includes(q.category)
            );

            if (validQuestions.length === 0) {
                console.error('No valid questions generated for selected categories:', sessionData.categories);
                toast.dismiss();
                toast.error('Failed to generate questions for selected categories. Please try again.');
                setGeneratingQuestions(false);
                return;
            }

            console.log('Generated questions:', validQuestions.map(q => ({ text: q.text.substring(0, 50) + '...', category: q.category })));

            const questions: Question[] = validQuestions.map((q, index) => {
                const cleanQuestion: Question = {
                    id: `q-${Date.now()}-${index}`,
                    text: q.text || `Question ${index + 1}`,
                    category: q.category || 'Behavioral' as QuestionCategory,
                    jobSpecific: !!job
                };

                if (job && job.id) {
                    cleanQuestion.jobId = job.id;
                }

                return cleanQuestion;
            });

            if (questions.length === 0) {
                toast.dismiss();
                toast.error('No questions could be generated. Please try again.');
                setGeneratingQuestions(false);
                return;
            }

            const sessionUpdate = {
                questions: questions,
                currentQuestionIndex: 0,
                updatedAt: serverTimestamp()
            };

            try {
                const sessionRef = doc(db, 'practice_sessions', sessionId);
                await updateDoc(sessionRef, sessionUpdate);

                setSession(prev => prev ? { ...prev, questions } : null);
                setCurrentQuestion(questions[0]);
                setCurrentQuestionIndex(0);

                toast.dismiss();
                toast.success(`Questions generated for: ${sessionData.categories.join(', ')}`);
            } catch (updateError) {
                console.error('Error updating practice session:', updateError);
                toast.dismiss();
                toast.error('Failed to save questions. Please try again.');
            }
        } catch (error) {
            console.error('Error generating questions:', error);
            toast.dismiss();
            toast.error('Failed to generate questions. Please try again.');
        } finally {
            setGeneratingQuestions(false);
        }
    };

    // Request feedback for the current answer
    const requestFeedback = async () => {
        if (!currentQuestion || !userAnswer.trim() || !userProfile) return;

        try {
            setGettingFeedback(true);
            toast.loading('Getting AI feedback on your answer...');

            const feedbackText = await getAnswerFeedback(
                currentQuestion.text,
                userAnswer,
                userProfile,
                job || undefined
            );

            setFeedback(feedbackText || 'No feedback available.');

            try {
                const tags = await suggestTags(currentQuestion.text, userAnswer, job || undefined);
                if (tags && Array.isArray(tags) && tags.length > 0) {
                    setSuggestedTags(tags);
                    setSelectedTags(tags);
                } else {
                    const defaultTags = ['interview', currentQuestion.category.toLowerCase()];
                    setSuggestedTags(defaultTags);
                    setSelectedTags(defaultTags);
                }
            } catch (tagError) {
                console.error('Error getting tags:', tagError);
                const defaultTags = ['interview', currentQuestion.category.toLowerCase()];
                setSuggestedTags(defaultTags);
                setSelectedTags(defaultTags);
            }

            toast.dismiss();
        } catch (error) {
            console.error('Error getting feedback:', error);
            toast.dismiss();
            toast.error('Failed to get feedback. Please try again.');
            setFeedback('I couldn\'t generate detailed feedback at this time. Consider reviewing your answer for clarity, relevance to the question, and specific examples that demonstrate your skills and experience.');
        } finally {
            setGettingFeedback(false);
        }
    };

    // Save the current answer
    const saveCurrentAnswer = async () => {
        if (!currentQuestion || !userAnswer.trim() || !currentUser) return;

        try {
            setLoading(true);

            const answerData: any = {
                userId: currentUser.uid,
                questionId: currentQuestion.id,
                questionText: currentQuestion.text,
                answerText: userAnswer,
                category: currentQuestion.category,
                feedback: feedback || '',
                tags: selectedTags.length > 0 ? selectedTags : ['interview'],
                isFavorite: false
            };

            if (job && job.id) {
                answerData.jobId = job.id;
            }

            await saveAnswer(answerData);

            setSavedAnswer(true);
            toast.success('Answer saved successfully!');
        } catch (error) {
            console.error('Error saving answer:', error);
            toast.error('Failed to save answer. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Move to the next question
    const handleNextQuestion = async () => {
        if (!session || !session.questions || !sessionId) return;

        if (!Array.isArray(session.questions) || session.questions.length === 0) {
            toast.error('No questions available. Please start a new session.');
            router.push('/practice/setup');
            return;
        }

        const nextIndex = currentQuestionIndex + 1;

        if (nextIndex >= session.questions.length) {
            toast.success('You have completed all questions!');
            router.push('/dashboard');
            return;
        }

        const cleanQuestions = session.questions.map(q => {
            const cleanQuestion: any = {
                id: q.id || `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                text: q.text || 'Interview question',
                category: q.category || 'Behavioral',
                jobSpecific: q.jobSpecific ?? false
            };

            if (q.jobId) {
                cleanQuestion.jobId = q.jobId;
            }

            return cleanQuestion;
        });

        try {
            const sessionRef = doc(db, 'practice_sessions', sessionId);
            await updateDoc(sessionRef, {
                questions: cleanQuestions,
                currentQuestionIndex: nextIndex,
                updatedAt: serverTimestamp()
            });

            setCurrentQuestionIndex(nextIndex);
            setCurrentQuestion(session.questions[nextIndex]);
            setUserAnswer('');
            setFeedback('');
            setSuggestedTags([]);
            setSelectedTags([]);
            setSavedAnswer(false);
        } catch (error) {
            console.error('Error updating session:', error);
            toast.error('Failed to move to next question. Please try again.');
        }
    };

    // Handle tag selection
    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev => {
            if (prev.includes(tag)) {
                return prev.filter(t => t !== tag);
            } else {
                return [...prev, tag];
            }
        });
    };

    // Add custom tag
    const handleAddCustomTag = (tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !selectedTags.includes(trimmedTag)) {
            setSelectedTags(prevTags => [...prevTags, trimmedTag]);
        }
    };

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

    if (loading) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <LoadingPage text="Loading..." />
                </ProfileCheck>
            </PrivateRoute>
        );
    }


    if (generatingQuestions) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <div className="min-h-screen bg-gray-700">
                        <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-20">
                            <div className="max-w-4xl mx-auto text-center">
                                <h1 className="text-2xl font-bold text-white mb-2">Generating Questions</h1>
                                <p className="text-gray-400">
                                    Creating personalized interview questions for: {session?.categories?.join(', ') || 'selected categories'}
                                </p>
                            </div>
                        </div>

                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-center">
                            <Loading variant="wave" size="lg" />
                            <h2 className="text-xl font-semibold text-white mb-2 mt-6">Generating personalized questions...</h2>
                            <p className="text-gray-300 text-center max-w-md">
                                Our AI is analyzing your profile {job && 'and job requirements'} to create relevant {session?.categories?.join(', ').toLowerCase()} interview questions.
                            </p>
                        </div>
                    </div>
                </ProfileCheck>
            </PrivateRoute>
        );
    }

    const hasQuestions = session?.questions && Array.isArray(session.questions) && session.questions.length > 0;

    if (!hasQuestions && !generatingQuestions) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <div className="min-h-screen bg-gray-700">
                        <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-20">
                            <div className="max-w-4xl mx-auto text-center">
                                <h1 className="text-2xl font-bold text-red-400 mb-4">No questions available</h1>
                                <p className="mb-4 text-gray-300">We couldn't load any questions for this session.</p>
                                <button
                                    onClick={() => router.push('/practice/setup')}
                                    className={getButtonClasses('primary')}
                                >
                                    Start a New Session
                                </button>
                            </div>
                        </div>
                    </div>
                </ProfileCheck>
            </PrivateRoute>
        );
    }

    const displayQuestion = currentQuestion || (hasQuestions ?
        session.questions[Math.min(currentQuestionIndex, session.questions.length - 1)] : null);

    if (!displayQuestion) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <div className="min-h-screen bg-gray-700">
                        <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-20">
                            <div className="max-w-4xl mx-auto text-center">
                                <h1 className="text-2xl font-bold text-red-400 mb-4">Error loading question</h1>
                                <p className="mb-4 text-gray-300">There was a problem loading the question. Please try again.</p>
                                <button
                                    onClick={() => router.push('/practice/setup')}
                                    className={getButtonClasses('primary')}
                                >
                                    Start a New Session
                                </button>
                            </div>
                        </div>
                    </div>
                </ProfileCheck>
            </PrivateRoute>
        );
    }

    return (
        <PrivateRoute>
            <ProfileCheck>
                <div className="min-h-screen bg-gray-700">
                    {/* Header */}
                    <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-20">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="mb-4 sm:mb-0">
                                    <h1 className="text-2xl font-bold text-white">Practice Session</h1>
                                    {hasQuestions && (
                                        <p className="mt-1 text-gray-400">
                                            Question {currentQuestionIndex + 1} of {session.questions.length}
                                        </p>
                                    )}
                                    {session?.categories && (
                                        <p className="text-sm text-gray-400">
                                            Categories: <span className="text-blue-400">{session.categories.join(', ')}</span>
                                        </p>
                                    )}
                                    {job && (
                                        <p className="text-sm text-gray-400">
                                            Preparing for: <span className="text-blue-400">{job.title}</span> at <span className="text-blue-400">{job.company}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Are you sure you want to exit? Your progress on this question will be lost if not saved.')) {
                                                router.push('/dashboard');
                                            }
                                        }}
                                        className={getButtonClasses('secondary')}
                                    >
                                        Exit Session
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Question Card */}
                        <div className={`${getCardClasses()} mb-6`}>
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center mb-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(displayQuestion.category)}`}>
                                        {displayQuestion.category}
                                    </span>
                                    {session?.categories && !session.categories.includes(displayQuestion.category) && (
                                        <span className="ml-2 text-xs text-red-400">
                                            ⚠️ Category mismatch
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-xl font-medium text-white mb-6">{displayQuestion.text}</h2>

                                <div className="mb-4">
                                    <label htmlFor="answer" className="block text-sm font-medium text-gray-300 mb-2">
                                        Your Answer
                                    </label>
                                    <textarea
                                        id="answer"
                                        name="answer"
                                        rows={8}
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        disabled={savedAnswer}
                                        className={`${getInputClasses()} block w-full sm:text-sm rounded-md resize-none`}
                                        placeholder="Type your answer here..."
                                    />
                                </div>

                                {!feedback && (
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={requestFeedback}
                                            disabled={!userAnswer.trim() || gettingFeedback || savedAnswer}
                                            className={`${getButtonClasses('primary')} disabled:opacity-50`}
                                        >
                                            {gettingFeedback ? 'Getting Feedback...' : 'Get AI Feedback'}
                                        </button>
                                    </div>
                                )}

                                {feedback && (
                                    <div className="mt-6 bg-blue-900/20 border border-blue-600/30 p-4 rounded-md">
                                        <h3 className="text-lg font-medium text-blue-200 mb-2">AI Feedback</h3>
                                        <div className="text-sm text-blue-100 whitespace-pre-line">
                                            {feedback}
                                        </div>
                                    </div>
                                )}

                                {feedback && !savedAnswer && (
                                    <div className="mt-6">
                                        <h3 className="text-sm font-medium text-gray-300 mb-2">Tags</h3>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {suggestedTags.map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => handleTagToggle(tag)}
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedTags.includes(tag)
                                                        ? 'bg-blue-900/20 text-blue-300 border border-blue-600/30'
                                                        : 'bg-gray-700 text-gray-300 border border-gray-600'
                                                        }`}
                                                >
                                                    {tag}
                                                    {selectedTags.includes(tag) ? (
                                                        <svg className="ml-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="ml-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                    )}
                                                </button>
                                            ))}

                                            {selectedTags
                                                .filter(tag => !suggestedTags.includes(tag))
                                                .map((tag) => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => handleTagToggle(tag)}
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/20 text-blue-300 border border-blue-600/30"
                                                    >
                                                        {tag}
                                                        <svg className="ml-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                ))}

                                            <div className="inline-flex items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Add custom tag"
                                                    value={customTagInput}
                                                    onChange={(e) => setCustomTagInput(e.target.value)}
                                                    className="border border-gray-600 rounded-l-md text-xs py-0.5 px-2 bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && customTagInput.trim()) {
                                                            handleAddCustomTag(customTagInput);
                                                            setCustomTagInput('');
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (customTagInput.trim()) {
                                                            handleAddCustomTag(customTagInput);
                                                            setCustomTagInput('');
                                                        }
                                                    }}
                                                    className="inline-flex items-center px-2 py-0.5 rounded-r-md border border-l-0 border-gray-600 bg-gray-600 text-xs font-medium text-gray-300 hover:bg-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-400 mb-4">
                                            Selected tags: {selectedTags.length} {selectedTags.length > 0 && `(${selectedTags.join(', ')})`}
                                        </p>

                                        <div className="flex justify-end space-x-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUserAnswer('');
                                                    setFeedback('');
                                                    setSuggestedTags([]);
                                                    setSelectedTags([]);
                                                }}
                                                className={getButtonClasses('secondary')}
                                            >
                                                Revise Answer
                                            </button>
                                            <button
                                                type="button"
                                                onClick={saveCurrentAnswer}
                                                disabled={loading}
                                                className={getButtonClasses('primary')}
                                            >
                                                {loading ? 'Saving...' : 'Save Answer'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {savedAnswer && (
                                    <div className="mt-6 flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={handleNextQuestion}
                                            className={getButtonClasses('primary')}
                                        >
                                            {currentQuestionIndex + 1 >= (session?.questions?.length || 0) ? 'Complete Session' : 'Next Question'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to exit? Your progress on this question will be lost if not saved.')) {
                                        router.push('/dashboard');
                                    }
                                }}
                                className={getButtonClasses('secondary')}
                            >
                                Exit Session
                            </button>

                            {!savedAnswer && (
                                <button
                                    type="button"
                                    onClick={handleNextQuestion}
                                    className={getButtonClasses('primary')}
                                >
                                    Skip Question
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}