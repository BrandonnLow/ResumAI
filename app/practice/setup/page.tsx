'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../ui/Context/AuthContext';
import { getUserProfile, getJobs, createPracticeSession } from '../../Services/firebase/firestore';
import { QuestionCategory, UserProfile, Job } from '../../types';
import toast from 'react-hot-toast';
import PrivateRoute from '../../ui/components/PrivateRoute';
import ProfileCheck from '../../ui/components/ProfileCheck';
import { getCardClasses, getInputClasses, getButtonClasses } from '../../ui/styles/theme';
import { LoadingPage } from '../../ui/components/Loading';

export default function PracticeSetup() {
    const { currentUser } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [sessionType, setSessionType] = useState<'general' | 'job-specific'>('general');
    const [selectedJob, setSelectedJob] = useState<string>('');
    const [jobDescription, setJobDescription] = useState<string>('');
    const [categories, setCategories] = useState<QuestionCategory[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);

    // Check for job parameter in URL
    useEffect(() => {
        const jobParam = searchParams.get('job');
        if (jobParam) {
            setSessionType('job-specific');
            setSelectedJob(jobParam);
        }
    }, [searchParams]);

    // Fetch user profile and jobs on component mount
    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);

                // Fetch user profile
                const profile = await getUserProfile(currentUser.uid);
                setUserProfile(profile);

                // Fetch user's saved jobs
                const userJobs = await getJobs(currentUser.uid);
                setJobs(userJobs);

                // If a job ID was passed in the URL, select it and populate description
                const jobParam = searchParams.get('job');
                if (jobParam) {
                    const job = userJobs.find(j => j.id === jobParam);
                    if (job && job.description) {
                        setJobDescription(job.description);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load your data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser, searchParams]);

    // Handle category selection
    const handleCategoryToggle = (category: QuestionCategory) => {
        setCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    // Handle job selection
    const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const jobId = e.target.value;
        setSelectedJob(jobId);

        if (jobId) {
            const job = jobs.find(j => j.id === jobId);
            if (job && job.description) {
                setJobDescription(job.description);
            } else {
                setJobDescription('');
            }
        } else {
            setJobDescription('');
        }
    };

    // Start practice session
    const handleStartSession = async () => {
        if (categories.length === 0) {
            return toast.error('Please select at least one question category');
        }

        try {
            setLoading(true);
            toast.loading('Creating your practice session...');

            // Create practice session in Firestore
            const sessionId = await createPracticeSession(
                currentUser!.uid,
                categories,
                sessionType === 'job-specific' ? selectedJob : undefined
            );

            // Navigate to practice session
            router.push(`/practice/session/${sessionId}`);
        } catch (error) {
            console.error('Error creating practice session:', error);
            toast.dismiss();
            toast.error('Failed to start practice session. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !userProfile) {
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
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center">
                                <button
                                    onClick={() => router.back()}
                                    className="mr-4 text-gray-400 hover:text-gray-300 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Start a Practice Session</h1>
                                    <p className="mt-1 text-gray-400">Prepare for your upcoming interviews with AI-powered practice</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Session Type Selection */}
                        <div className={`${getCardClasses()} mb-6`}>
                            <div className="px-4 py-5 sm:p-6">
                                <h2 className="text-lg font-medium text-white mb-4">Session Type</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            id="general"
                                            name="session-type"
                                            type="radio"
                                            checked={sessionType === 'general'}
                                            onChange={() => setSessionType('general')}
                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-600 bg-gray-700"
                                        />
                                        <label htmlFor="general" className="ml-3 block text-sm font-medium text-gray-300">
                                            General Interview Prep
                                        </label>
                                    </div>
                                    <p className="ml-7 text-sm text-gray-400">
                                        Practice common interview questions across all industries and roles
                                    </p>

                                    <div className="flex items-center">
                                        <input
                                            id="job-specific"
                                            name="session-type"
                                            type="radio"
                                            checked={sessionType === 'job-specific'}
                                            onChange={() => setSessionType('job-specific')}
                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-600 bg-gray-700"
                                        />
                                        <label htmlFor="job-specific" className="ml-3 block text-sm font-medium text-gray-300">
                                            Job-Specific Prep
                                        </label>
                                    </div>
                                    <p className="ml-7 text-sm text-gray-400">
                                        Get questions tailored to a specific job application
                                    </p>
                                </div>

                                {sessionType === 'job-specific' && (
                                    <div className="mt-6 space-y-6">
                                        <div>
                                            <label htmlFor="job-select" className="block text-sm font-medium text-gray-300 mb-2">
                                                Select a Job
                                            </label>
                                            <select
                                                id="job-select"
                                                name="job-select"
                                                value={selectedJob}
                                                onChange={handleJobChange}
                                                className={`${getInputClasses()} block w-full sm:text-sm rounded-md appearance-none`}
                                                required={sessionType === 'job-specific'}
                                            >
                                                <option value="">Select a job...</option>
                                                {jobs.map(job => (
                                                    <option key={job.id} value={job.id}>
                                                        {job.title} at {job.company}
                                                    </option>
                                                ))}
                                            </select>
                                            {jobs.length === 0 && (
                                                <div className="mt-2 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-md">
                                                    <p className="text-sm text-yellow-200">
                                                        You don't have any saved jobs yet.
                                                        <button
                                                            onClick={() => router.push('/jobs/new')}
                                                            className="ml-1 font-medium text-yellow-100 hover:text-white underline"
                                                        >
                                                            Add a job
                                                        </button>
                                                        {' '}first or choose "General Interview Prep".
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {selectedJob && (
                                            <div>
                                                <label htmlFor="job-description" className="block text-sm font-medium text-gray-300 mb-2">
                                                    Job Description
                                                </label>
                                                <textarea
                                                    id="job-description"
                                                    name="job-description"
                                                    rows={5}
                                                    value={jobDescription}
                                                    onChange={(e) => setJobDescription(e.target.value)}
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                    placeholder="Paste the full job description here (optional but recommended for better question tailoring)"
                                                />
                                                <p className="mt-2 text-sm text-gray-400">
                                                    Adding the job description helps our AI generate more relevant questions
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Question Categories */}
                        <div className={`${getCardClasses()} mb-8`}>
                            <div className="px-4 py-5 sm:p-6">
                                <h2 className="text-lg font-medium text-white mb-4">Question Categories</h2>
                                <p className="text-sm text-gray-400 mb-6">
                                    Select the types of questions you want to practice. You can select multiple categories.
                                </p>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="relative">
                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="motivational"
                                                    name="motivational"
                                                    type="checkbox"
                                                    checked={categories.includes('Motivational')}
                                                    onChange={() => handleCategoryToggle('Motivational')}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-600 rounded bg-gray-700"
                                                />
                                            </div>
                                            <div className="ml-3">
                                                <label htmlFor="motivational" className="text-sm font-medium text-white">
                                                    Motivational Questions
                                                </label>
                                                <p className="text-sm text-gray-400">
                                                    Why this company? Why this role? Career goals and aspirations
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="behavioral"
                                                    name="behavioral"
                                                    type="checkbox"
                                                    checked={categories.includes('Behavioral')}
                                                    onChange={() => handleCategoryToggle('Behavioral')}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-600 rounded bg-gray-700"
                                                />
                                            </div>
                                            <div className="ml-3">
                                                <label htmlFor="behavioral" className="text-sm font-medium text-white">
                                                    Behavioral Questions
                                                </label>
                                                <p className="text-sm text-gray-400">
                                                    Past experiences, teamwork, conflict resolution, leadership
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="technical"
                                                    name="technical"
                                                    type="checkbox"
                                                    checked={categories.includes('Technical')}
                                                    onChange={() => handleCategoryToggle('Technical')}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-600 rounded bg-gray-700"
                                                />
                                            </div>
                                            <div className="ml-3">
                                                <label htmlFor="technical" className="text-sm font-medium text-white">
                                                    Technical Questions
                                                </label>
                                                <p className="text-sm text-gray-400">
                                                    Role-specific skills, problem-solving, domain knowledge
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="personality"
                                                    name="personality"
                                                    type="checkbox"
                                                    checked={categories.includes('Personality')}
                                                    onChange={() => handleCategoryToggle('Personality')}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-600 rounded bg-gray-700"
                                                />
                                            </div>
                                            <div className="ml-3">
                                                <label htmlFor="personality" className="text-sm font-medium text-white">
                                                    Personality Questions
                                                </label>
                                                <p className="text-sm text-gray-400">
                                                    Work style, strengths, weaknesses, cultural fit
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {categories.length === 0 && (
                                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600/30 rounded-md">
                                        <p className="text-sm text-blue-200">
                                            💡 Select at least one category to start your practice session
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Start Session Button */}
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={handleStartSession}
                                disabled={loading || categories.length === 0 || (sessionType === 'job-specific' && !selectedJob)}
                                className={`${getButtonClasses('primary')} px-8 py-3 text-base font-medium transform transition-all hover:scale-105 disabled:hover:scale-100`}
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Starting Session...
                                    </div>
                                ) : (
                                    'Start Practice Session'
                                )}
                            </button>
                        </div>

                        {/* Tips Section */}
                        <div className={`${getCardClasses()} mt-8`}>
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-white mb-4">💡 Practice Tips</h3>
                                <ul className="space-y-3 text-sm text-gray-300">
                                    <li className="flex items-start">
                                        <span className="text-blue-400 mr-2">•</span>
                                        Practice in a quiet environment where you won't be interrupted
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-blue-400 mr-2">•</span>
                                        Speak your answers out loud, even when typing them
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-blue-400 mr-2">•</span>
                                        Use the STAR method (Situation, Task, Action, Result) for behavioral questions
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-blue-400 mr-2">•</span>
                                        Take time to review the AI feedback and improve your answers
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}