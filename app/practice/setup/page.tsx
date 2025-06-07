'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../ui/Context/AuthContext';
import { getUserProfile, getJobs, createPracticeSession } from '../../Services/firebase/firestore';
import { QuestionCategory, UserProfile, Job } from '../../types';
import PrivateRoute from '../../ui/components/PrivateRoute';
import ProfileCheck from '../../ui/components/ProfileCheck';

export default function PracticeSetup() {
    const { currentUser } = useAuth();
    const router = useRouter();
    const [sessionType, setSessionType] = useState<'general' | 'job-specific'>('general');
    const [selectedJob, setSelectedJob] = useState<string>('');
    const [categories, setCategories] = useState<QuestionCategory[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            try {
                // Fetch user profile and jobs
                const [profile, userJobs] = await Promise.all([
                    getUserProfile(currentUser.uid),
                    getJobs(currentUser.uid)
                ]);

                setUserProfile(profile);
                setJobs(userJobs);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [currentUser]);

    const handleCategoryToggle = (category: QuestionCategory) => {
        setCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    const handleStartSession = async () => {
        if (categories.length === 0) {
            alert('Please select at least one question category');
            return;
        }

        if (sessionType === 'job-specific' && !selectedJob) {
            alert('Please select a job for job-specific practice');
            return;
        }

        try {
            setLoading(true);

            // Create practice session in Firestore
            const sessionId = await createPracticeSession(
                currentUser!.uid,
                categories,
                sessionType === 'job-specific' ? selectedJob : undefined
            );

            // Navigate to practice session
            router.push(`/practice/session/${sessionId}`);
        } catch (error) {
            console.error('Error creating session:', error);
            alert('Failed to start practice session. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PrivateRoute>
            <ProfileCheck>
                <div className="min-h-screen bg-gray-700 p-8">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold text-white mb-8">Start Practice Session</h1>

                        <div className="bg-gray-800 p-8 rounded-lg border border-gray-600 space-y-8">
                            {/* Session Type */}
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-4">Session Type</h2>
                                <div className="space-y-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="sessionType"
                                            value="general"
                                            checked={sessionType === 'general'}
                                            onChange={(e) => setSessionType(e.target.value as 'general')}
                                            className="mr-3"
                                        />
                                        <div>
                                            <div className="text-white font-medium">General Interview Prep</div>
                                            <div className="text-gray-400 text-sm">Practice common interview questions</div>
                                        </div>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="sessionType"
                                            value="job-specific"
                                            checked={sessionType === 'job-specific'}
                                            onChange={(e) => setSessionType(e.target.value as 'job-specific')}
                                            className="mr-3"
                                        />
                                        <div>
                                            <div className="text-white font-medium">Job-Specific Prep</div>
                                            <div className="text-gray-400 text-sm">Tailored questions for a specific job</div>
                                        </div>
                                    </label>
                                </div>

                                {sessionType === 'job-specific' && (
                                    <div className="mt-4">
                                        <label className="block text-white text-sm font-bold mb-2">
                                            Select Job
                                        </label>
                                        <select
                                            value={selectedJob}
                                            onChange={(e) => setSelectedJob(e.target.value)}
                                            className="w-full p-3 border rounded bg-gray-700 text-white border-gray-600"
                                        >
                                            <option value="">Select a job...</option>
                                            {jobs.map(job => (
                                                <option key={job.id} value={job.id}>
                                                    {job.title} at {job.company}
                                                </option>
                                            ))}
                                        </select>
                                        {jobs.length === 0 && (
                                            <p className="mt-2 text-sm text-yellow-400">
                                                No jobs found. Add a job first or choose general practice.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Question Categories */}
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-4">Question Categories</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="flex items-start p-4 border border-gray-600 rounded cursor-pointer hover:border-gray-500">
                                        <input
                                            type="checkbox"
                                            checked={categories.includes('Motivational')}
                                            onChange={() => handleCategoryToggle('Motivational')}
                                            className="mt-1 mr-3"
                                        />
                                        <div>
                                            <div className="text-white font-medium">Motivational</div>
                                            <div className="text-gray-400 text-sm">Why this company? Career goals?</div>
                                        </div>
                                    </label>

                                    <label className="flex items-start p-4 border border-gray-600 rounded cursor-pointer hover:border-gray-500">
                                        <input
                                            type="checkbox"
                                            checked={categories.includes('Behavioral')}
                                            onChange={() => handleCategoryToggle('Behavioral')}
                                            className="mt-1 mr-3"
                                        />
                                        <div>
                                            <div className="text-white font-medium">Behavioral</div>
                                            <div className="text-gray-400 text-sm">Past experiences, teamwork, leadership</div>
                                        </div>
                                    </label>

                                    <label className="flex items-start p-4 border border-gray-600 rounded cursor-pointer hover:border-gray-500">
                                        <input
                                            type="checkbox"
                                            checked={categories.includes('Technical')}
                                            onChange={() => handleCategoryToggle('Technical')}
                                            className="mt-1 mr-3"
                                        />
                                        <div>
                                            <div className="text-white font-medium">Technical</div>
                                            <div className="text-gray-400 text-sm">Role-specific skills and knowledge</div>
                                        </div>
                                    </label>

                                    <label className="flex items-start p-4 border border-gray-600 rounded cursor-pointer hover:border-gray-500">
                                        <input
                                            type="checkbox"
                                            checked={categories.includes('Personality')}
                                            onChange={() => handleCategoryToggle('Personality')}
                                            className="mt-1 mr-3"
                                        />
                                        <div>
                                            <div className="text-white font-medium">Personality</div>
                                            <div className="text-gray-400 text-sm">Work style, strengths, weaknesses</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleStartSession}
                                    disabled={loading || categories.length === 0}
                                    className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Starting...' : 'Start Practice Session'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}