'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../ui/Context/AuthContext';
import {
    getPracticeSession,
    getUserProfile,
    getJob,
    updatePracticeSession
} from '../../../Services/firebase/firestore';
import { generateQuestions } from '../../../Services/openai/functions';
import { PracticeSession as SessionType, Question, UserProfile, Job, QuestionCategory } from '../../../types';
import PrivateRoute from '../../../ui/components/PrivateRoute';
import ProfileCheck from '../../../ui/components/ProfileCheck';

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
    const [loading, setLoading] = useState<boolean>(true);
    const [generatingQuestions, setGeneratingQuestions] = useState<boolean>(false);

    // Load session data on component mount
    useEffect(() => {
        const loadSessionData = async () => {
            if (!sessionId || !currentUser) return;

            try {
                setLoading(true);

                // Fetch practice session
                const sessionData = await getPracticeSession(sessionId);
                if (!sessionData) {
                    alert('Practice session not found');
                    return router.push('/practice/setup');
                }

                if (sessionData.userId !== currentUser.uid) {
                    alert('You do not have access to this session');
                    return router.push('/practice/setup');
                }

                setSession(sessionData);
                setCurrentQuestionIndex(sessionData.currentQuestionIndex || 0);

                // Fetch user profile
                const profile = await getUserProfile(currentUser.uid);
                if (!profile) {
                    alert('User profile not found');
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
                    setGeneratingQuestions(true);
                    await generateSessionQuestions(sessionData, profile, jobData);
                } else {
                    const questionIndex = sessionData.currentQuestionIndex || 0;
                    if (sessionData.questions.length > questionIndex) {
                        setCurrentQuestion(sessionData.questions[questionIndex]);
                    }
                }
            } catch (error) {
                console.error('Error loading session data:', error);
                alert('Failed to load session data');
            } finally {
                setLoading(false);
            }
        };

        loadSessionData();
    }, [sessionId, currentUser, router]);

    // Generate questions for the session
    const generateSessionQuestions = async (
        sessionData: SessionType,
        profile: UserProfile,
        job?: Job | null
    ) => {
        try {
            const questionsData = await generateQuestions(
                profile,
                sessionData.categories,
                5,
                job || undefined
            );

            const questions: Question[] = questionsData.map((q, index) => ({
                id: `q-${Date.now()}-${index}`,
                text: q.text,
                category: q.category,
                jobSpecific: !!job,
                jobId: job?.id
            }));

            // Update session with generated questions
            await updatePracticeSession(sessionId, questions, 0);

            setSession(prev => prev ? { ...prev, questions } : null);
            setCurrentQuestion(questions[0]);
            setCurrentQuestionIndex(0);
        } catch (error) {
            console.error('Error generating questions:', error);
            alert('Failed to generate questions');
        } finally {
            setGeneratingQuestions(false);
        }
    };

    // Move to next question
    const handleNextQuestion = async () => {
        if (!session || !session.questions) return;

        const nextIndex = currentQuestionIndex + 1;

        if (nextIndex >= session.questions.length) {
            alert('Practice session completed!');
            router.push('/dashboard');
            return;
        }

        try {
            await updatePracticeSession(sessionId, session.questions, nextIndex);

            setCurrentQuestionIndex(nextIndex);
            setCurrentQuestion(session.questions[nextIndex]);
            setUserAnswer('');
        } catch (error) {
            console.error('Error updating session:', error);
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
                    <div className="min-h-screen bg-gray-700 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
                    </div>
                </ProfileCheck>
            </PrivateRoute>
        );
    }

    if (generatingQuestions) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <div className="min-h-screen bg-gray-700 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mb-4 mx-auto"></div>
                            <h2 className="text-xl font-semibold text-white mb-2">Generating questions...</h2>
                            <p className="text-gray-300">Please wait while we create personalized interview questions for you.</p>
                        </div>
                    </div>
                </ProfileCheck>
            </PrivateRoute>
        );
    }

    if (!currentQuestion) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <div className="min-h-screen bg-gray-700 flex items-center justify-center">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-white mb-4">No questions available</h2>
                            <button
                                onClick={() => router.push('/practice/setup')}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Start New Session
                            </button>
                        </div>
                    </div>
                </ProfileCheck>
            </PrivateRoute>
        );
    }

    return (
        <PrivateRoute>
            <ProfileCheck>
                <div className="min-h-screen bg-gray-700 p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white">Practice Session</h1>
                                {session && (
                                    <p className="text-gray-400">
                                        Question {currentQuestionIndex + 1} of {session.questions.length}
                                    </p>
                                )}
                                {job && (
                                    <p className="text-sm text-blue-400">
                                        Preparing for: {job.title} at {job.company}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                            >
                                Exit Session
                            </button>
                        </div>

                        <div className="bg-gray-800 p-8 rounded-lg border border-gray-600">
                            {/* Question */}
                            <div className="mb-6">
                                <div className="mb-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(currentQuestion.category)}`}>
                                        {currentQuestion.category}
                                    </span>
                                </div>
                                <h2 className="text-xl font-medium text-white mb-6">{currentQuestion.text}</h2>
                            </div>

                            {/* Answer Input */}
                            <div className="mb-6">
                                <label className="block text-white text-sm font-bold mb-2">
                                    Your Answer
                                </label>
                                <textarea
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    rows={8}
                                    className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600 resize-none"
                                    placeholder="Type your answer here..."
                                />
                            </div>

                            {/* Navigation */}
                            <div className="flex justify-between">
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                                >
                                    Exit Session
                                </button>

                                <button
                                    onClick={handleNextQuestion}
                                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                                >
                                    {currentQuestionIndex + 1 >= (session?.questions?.length || 0) ? 'Complete Session' : 'Next Question'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}