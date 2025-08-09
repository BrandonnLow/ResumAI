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
import { generateQuestions, suggestTags } from '../../../Services/openai/functions';
import { PracticeSession as SessionType, Question, UserProfile, Job, QuestionCategory } from '../../../types';
import toast from 'react-hot-toast';
import { serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../Services/firebase/config';
import PrivateRoute from '../../../ui/components/PrivateRoute';
import ProfileCheck from '../../../ui/components/ProfileCheck';
import { getCardClasses, getInputClasses, getButtonClasses } from '../../../ui/styles/theme';
import Loading, { LoadingPage } from '../../../ui/components/Loading';
import VoiceEmotionRecorder from '@/app/ui/components/recordButton/recordButton';

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
    const [loading, setLoading] = useState<boolean>(true);
    const [generatingQuestions, setGeneratingQuestions] = useState<boolean>(false);
    const [gettingFeedback, setGettingFeedback] = useState<boolean>(false);
    const [customTagInput, setCustomTagInput] = useState('');

    const getFeedback = async () => {
        const response = await fetch('http://127.0.0.1:5000/deepSeekAnswer', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                answer: userAnswer,
                question: currentQuestion,
            })
        });

        const data = await response.json();
        setFeedback(data.answer);
        return String(data.answer);
    };

    useEffect(() => {
        const initSession = async () => {
            if (!sessionId || !currentUser) return;

            try {
                setLoading(true);
                setGeneratingQuestions(true);

                const sessionData = await getPracticeSession(sessionId);

                if (!sessionData) {
                    toast.error('Session not found');
                    setGeneratingQuestions(false);
                    return router.push('/practice/setup');
                }

                if (sessionData.userId !== currentUser.uid) {
                    toast.error('Access denied');
                    setGeneratingQuestions(false);
                    return router.push('/practice/setup');
                }

                if (!sessionData.categories?.length) {
                    toast.error('No categories selected');
                    setGeneratingQuestions(false);
                    return router.push('/practice/setup');
                }

                setSession(sessionData);
                setCurrentQuestionIndex(sessionData.currentQuestionIndex || 0);

                const profile = await getUserProfile(currentUser.uid);
                if (!profile) {
                    toast.error('Profile not found');
                    setGeneratingQuestions(false);
                    return router.push('/profile/setup');
                }
                setUserProfile(profile);

                let jobData = null;
                if (sessionData.jobId) {
                    jobData = await getJob(sessionData.jobId);
                    setJob(jobData);
                }

                if (!sessionData.questions?.length) {
                    toast.dismiss();
                    toast.loading('Creating questions...');
                    await createQuestions(sessionData, profile, jobData);
                } else {
                    setGeneratingQuestions(false);
                    const qIndex = sessionData.currentQuestionIndex || 0;
                    const question = sessionData.questions[qIndex] || sessionData.questions[0];
                    setCurrentQuestion(question);
                    if (question !== sessionData.questions[qIndex]) {
                        setCurrentQuestionIndex(0);
                    }
                }
            } catch (error) {
                console.error('Session load failed:', error);
                toast.error('Could not load session');
                setGeneratingQuestions(false);
            } finally {
                setLoading(false);
            }
        };

        initSession();
    }, [sessionId, currentUser, router]);

    const createQuestions = async (sessionData: SessionType, profile: UserProfile, job?: Job | null) => {
        if (!sessionId) return;

        try {
            const questionsData = await generateQuestions(
                profile,
                sessionData.categories,
                5,
                job || undefined
            );

            if (!questionsData?.length) {
                toast.dismiss();
                toast.error('Question generation failed');
                setGeneratingQuestions(false);
                return;
            }

            const validQuestions = questionsData.filter(q =>
                q.category && sessionData.categories.includes(q.category)
            );

            if (!validQuestions.length) {
                toast.dismiss();
                toast.error('No valid questions generated');
                setGeneratingQuestions(false);
                return;
            }

            const questions: Question[] = validQuestions.map((q, index) => {
                const question: Question = {
                    id: `q-${Date.now()}-${index}`,
                    text: q.text || `Question ${index + 1}`,
                    category: q.category || 'Behavioral' as QuestionCategory,
                    jobSpecific: !!job
                };

                if (job?.id) {
                    question.jobId = job.id;
                }

                return question;
            });

            if (!questions.length) {
                toast.dismiss();
                toast.error('No questions created');
                setGeneratingQuestions(false);
                return;
            }

            const sessionRef = doc(db, 'practice_sessions', sessionId);
            await updateDoc(sessionRef, {
                questions: questions,
                currentQuestionIndex: 0,
                updatedAt: serverTimestamp()
            });

            setSession(prev => prev ? { ...prev, questions } : null);
            setCurrentQuestion(questions[0]);
            setCurrentQuestionIndex(0);

            toast.dismiss();
            toast.success(`Generated ${questions.length} questions`);
        } catch (error) {
            console.error('Question generation error:', error);
            toast.dismiss();
            toast.error('Failed to create questions');
        } finally {
            setGeneratingQuestions(false);
        }
    };

    const handleGetFeedback = async () => {
        if (!currentQuestion || !userAnswer.trim() || !userProfile) return;

        try {
            setGettingFeedback(true);
            toast.loading('Analyzing your answer...');

            const feedbackText = await getFeedback();
            setFeedback(feedbackText || 'Unable to provide feedback at this time.');

            try {
                const tags = await suggestTags(currentQuestion.text, userAnswer, job || undefined);
                const tagsToUse = tags?.length ? tags : ['interview', currentQuestion.category.toLowerCase()];
                setSuggestedTags(tagsToUse);
                setSelectedTags(tagsToUse);
            } catch (tagError) {
                const fallbackTags = ['interview', currentQuestion.category.toLowerCase()];
                setSuggestedTags(fallbackTags);
                setSelectedTags(fallbackTags);
            }

            toast.dismiss();
        } catch (error) {
            console.error('Feedback error:', error);
            toast.dismiss();
            toast.error('Feedback unavailable');
            setFeedback('Consider reviewing your answer for clarity and specific examples.');
        } finally {
            setGettingFeedback(false);
        }
    };

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
                tags: selectedTags.length ? selectedTags : ['interview'],
                isFavorite: false
            };

            if (job?.id) {
                answerData.jobId = job.id;
            }

            await saveAnswer(answerData);
            toast.success('Answer saved!');
            await moveToNext();
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Could not save answer');
        } finally {
            setLoading(false);
        }
    };

    const moveToNext = async () => {
        if (!session?.questions?.length || !sessionId) return;

        const nextIndex = currentQuestionIndex + 1;

        if (nextIndex >= session.questions.length) {
            toast.success('Session complete!');
            router.push('/dashboard');
            return;
        }

        const cleanQuestions = session.questions.map(q => ({
            id: q.id || `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: q.text || 'Interview question',
            category: q.category || 'Behavioral',
            jobSpecific: q.jobSpecific ?? false,
            ...(q.jobId && { jobId: q.jobId })
        }));

        try {
            const sessionRef = doc(db, 'practice_sessions', sessionId);
            await updateDoc(sessionRef, {
                questions: cleanQuestions,
                currentQuestionIndex: nextIndex,
                updatedAt: serverTimestamp()
            });

            setCurrentQuestionIndex(nextIndex);
            setCurrentQuestion(session.questions[nextIndex]);
            resetAnswerState();
        } catch (error) {
            console.error('Navigation failed:', error);
            toast.error('Could not move to next question');
        }
    };

    const resetAnswerState = () => {
        setUserAnswer('');
        setFeedback('');
        setSuggestedTags([]);
        setSelectedTags([]);
    };

    const reviseAnswer = () => {
        setFeedback('');
        setSuggestedTags([]);
        setSelectedTags([]);
    };


    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const addCustomTag = (tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !selectedTags.includes(trimmed)) {
            setSelectedTags(prev => [...prev, trimmed]);
        }
    };

    const getCategoryStyle = (category: QuestionCategory) => {
        const styles = {
            'Motivational': 'bg-green-100 text-green-800',
            'Behavioral': 'bg-blue-100 text-blue-800',
            'Technical': 'bg-purple-100 text-purple-800',
            'Personality': 'bg-yellow-100 text-yellow-800'
        };
        return styles[category] || 'bg-gray-100 text-gray-800';
    };

    const confirmExit = () => {
        if (window.confirm('Exit session? Unsaved progress will be lost.')) {
            router.push('/dashboard');
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
                        <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-6">
                            <div className="max-w-4xl mx-auto text-center">
                                <h1 className="text-2xl font-bold text-white mb-2">Creating Questions</h1>
                                <p className="text-gray-400">
                                    Generating questions for: {session?.categories?.join(', ') || 'your session'}
                                </p>
                            </div>
                        </div>

                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-center">
                            <Loading variant="wave" size="lg" />
                            <h2 className="text-xl font-semibold text-white mb-2 mt-6">Almost ready...</h2>
                            <p className="text-gray-300 text-center max-w-md">
                                Creating personalized {session?.categories?.join(', ').toLowerCase()} questions
                                {job && ' based on your target role'}.
                            </p>
                        </div>
                    </div>
                </ProfileCheck>
            </PrivateRoute>
        );
    }

    const hasQuestions = session?.questions?.length;
    if (!hasQuestions && !generatingQuestions) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <div className="min-h-screen bg-gray-700">
                        <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-6">
                            <div className="max-w-4xl mx-auto text-center">
                                <h1 className="text-2xl font-bold text-red-400 mb-4">No Questions Available</h1>
                                <p className="mb-4 text-gray-300">Something went wrong loading your session.</p>
                                <button
                                    onClick={() => router.push('/practice/setup')}
                                    className={getButtonClasses('primary')}
                                >
                                    Start New Session
                                </button>
                            </div>
                        </div>
                    </div>
                </ProfileCheck>
            </PrivateRoute>
        );
    }

    const displayQuestion = currentQuestion ||
        (session?.questions ? session.questions[Math.min(currentQuestionIndex, session.questions.length - 1)] : null);

    if (!displayQuestion) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <div className="min-h-screen bg-gray-700">
                        <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-6">
                            <div className="max-w-4xl mx-auto text-center">
                                <h1 className="text-2xl font-bold text-red-400 mb-4">Question Load Error</h1>
                                <p className="mb-4 text-gray-300">Unable to load question data.</p>
                                <button
                                    onClick={() => router.push('/practice/setup')}
                                    className={getButtonClasses('primary')}
                                >
                                    Start New Session
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
                    <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-6">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="mb-4 sm:mb-0">
                                    <h1 className="text-2xl font-bold text-white">Practice Session</h1>
                                    {hasQuestions && (
                                        <p className="mt-1 text-gray-400">
                                            Question {currentQuestionIndex + 1} of {session?.questions?.length}
                                        </p>
                                    )}
                                    {session?.categories && (
                                        <p className="text-sm text-gray-400">
                                            <span className="text-blue-400">{session.categories.join(', ')}</span>
                                        </p>
                                    )}
                                    {job && (
                                        <p className="text-sm text-gray-400">
                                            <span className="text-blue-400">{job.title}</span> at <span className="text-blue-400">{job.company}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="flex space-x-3">
                                    <button onClick={confirmExit} className={getButtonClasses('secondary')}>
                                        Exit Session
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className={`${getCardClasses()} mb-6`}>
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center mb-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(displayQuestion.category)}`}>
                                        {displayQuestion.category}
                                    </span>
                                    {session?.categories && !session.categories.includes(displayQuestion.category) && (
                                        <span className="ml-2 text-xs text-red-400">⚠️ Category mismatch</span>
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
                                        readOnly={!!feedback}
                                        className={`${getInputClasses()} block w-full sm:text-sm rounded-md resize-none ${feedback ? 'cursor-not-allowed opacity-75' : ''}`}
                                        placeholder="Type your answer here..."
                                    />
                                </div>

                                {!feedback && (
                                    <div className="flex justify-between">
                                        <VoiceEmotionRecorder setUserAnswer={setUserAnswer} />
                                        <button
                                            type="button"
                                            onClick={handleGetFeedback}
                                            disabled={!userAnswer.trim() || gettingFeedback}
                                            className={`${getButtonClasses('primary')} disabled:opacity-50`}
                                        >
                                            {gettingFeedback ? 'Analyzing...' : 'Get Feedback'}
                                        </button>
                                    </div>
                                )}

                                {feedback && (
                                    <div className="mt-6 bg-blue-900/20 border border-blue-600/30 p-4 rounded-md">
                                        <h3 className="text-lg font-medium text-blue-200 mb-2">Feedback</h3>
                                        <div className="text-sm text-blue-100 whitespace-pre-line">
                                            {feedback}
                                        </div>
                                    </div>
                                )}

                                {feedback && (
                                    <div className="mt-6">
                                        <h3 className="text-sm font-medium text-gray-300 mb-2">Tags</h3>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {suggestedTags.map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => toggleTag(tag)}
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
                                                        onClick={() => toggleTag(tag)}
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
                                                    placeholder="Add tag"
                                                    value={customTagInput}
                                                    onChange={(e) => setCustomTagInput(e.target.value)}
                                                    className="border border-gray-600 rounded-l-md text-xs py-0.5 px-2 bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && customTagInput.trim()) {
                                                            addCustomTag(customTagInput);
                                                            setCustomTagInput('');
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (customTagInput.trim()) {
                                                            addCustomTag(customTagInput);
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
                                            {selectedTags.length} tags selected
                                            {selectedTags.length > 0 && ` (${selectedTags.join(', ')})`}
                                        </p>

                                        <div className="flex justify-end space-x-3">
                                            <button
                                                type="button"
                                                onClick={reviseAnswer}
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
                                                {loading ? 'Saving...' : 'Save & Continue'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button type="button" onClick={confirmExit} className={getButtonClasses('secondary')}>
                                Exit Session
                            </button>

                            <button type="button" onClick={moveToNext} className={getButtonClasses('primary')}>
                                Skip Question
                            </button>
                        </div>
                    </div>
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}