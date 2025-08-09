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

const questionCategories = [
    {
        id: 'Motivational',
        label: 'Motivational Questions',
        desc: 'Why this company? Why this role? Career goals and aspirations'
    },
    {
        id: 'Behavioral',
        label: 'Behavioral Questions',
        desc: 'Past experiences, teamwork, conflict resolution, leadership'
    },
    {
        id: 'Technical',
        label: 'Technical Questions',
        desc: 'Role-specific skills, problem-solving, domain knowledge'
    },
    {
        id: 'Personality',
        label: 'Personality Questions',
        desc: 'Work style, strengths, weaknesses, cultural fit'
    }
];

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

    useEffect(() => {
        const jobParam = searchParams.get('job');
        if (jobParam) {
            setSessionType('job-specific');
            setSelectedJob(jobParam);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!currentUser) return;

        const loadUserData = async () => {
            setLoading(true);

            try {
                const [profile, userJobs] = await Promise.all([
                    getUserProfile(currentUser.uid),
                    getJobs(currentUser.uid)
                ]);

                setUserProfile(profile);
                setJobs(userJobs);

                const jobParam = searchParams.get('job');
                if (jobParam) {
                    const matchedJob = userJobs.find(j => j.id === jobParam);
                    if (matchedJob?.description) {
                        setJobDescription(matchedJob.description);
                    }
                }
            } catch (err) {
                console.error('Failed to load user data:', err);
                toast.error('Something went wrong loading your data');
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [currentUser, searchParams]);

    const toggleCategory = (category: QuestionCategory) => {
        setCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const selectJob = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const jobId = e.target.value;
        setSelectedJob(jobId);

        const job = jobs.find(j => j.id === jobId);
        setJobDescription(job?.description || '');
    };

    const startSession = async () => {
        if (!categories.length) {
            toast.error('Pick at least one question type');
            return;
        }

        setLoading(true);
        const loadingToast = toast.loading('Setting up your practice session...');

        try {
            const sessionId = await createPracticeSession(
                currentUser!.uid,
                categories,
                sessionType === 'job-specific' ? selectedJob : undefined
            );

            toast.dismiss(loadingToast);
            router.push(`/practice/session/${sessionId}`);
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error('Failed to create session. Try again?');
            console.error('Session creation failed:', err);
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

    const canStart = categories.length > 0 &&
        (sessionType === 'general' || selectedJob);

    return (
        <PrivateRoute>
            <ProfileCheck>
                <div className="min-h-screen bg-gray-700">
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
                                                value={selectedJob}
                                                onChange={selectJob}
                                                className={`${getInputClasses()} block w-full sm:text-sm rounded-md appearance-none`}
                                            >
                                                <option value="">Select a job...</option>
                                                {jobs.map(job => (
                                                    <option key={job.id} value={job.id}>
                                                        {job.title} at {job.company}
                                                    </option>
                                                ))}
                                            </select>
                                            {!jobs.length && (
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

                        <div className={`${getCardClasses()} mb-8`}>
                            <div className="px-4 py-5 sm:p-6">
                                <h2 className="text-lg font-medium text-white mb-4">Question Categories</h2>
                                <p className="text-sm text-gray-400 mb-6">
                                    Select the types of questions you want to practice. You can select multiple categories.
                                </p>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    {questionCategories.map(({ id, label, desc }) => (
                                        <div key={id} className="relative">
                                            <div className="flex items-start">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        id={id.toLowerCase()}
                                                        type="checkbox"
                                                        checked={categories.includes(id as QuestionCategory)}
                                                        onChange={() => toggleCategory(id as QuestionCategory)}
                                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-600 rounded bg-gray-700"
                                                    />
                                                </div>
                                                <div className="ml-3">
                                                    <label htmlFor={id.toLowerCase()} className="text-sm font-medium text-white">
                                                        {label}
                                                    </label>
                                                    <p className="text-sm text-gray-400">
                                                        {desc}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {!categories.length && (
                                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600/30 rounded-md">
                                        <p className="text-sm text-blue-200">
                                            💡 Select at least one category to start your practice session
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={startSession}
                                disabled={loading || !canStart}
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