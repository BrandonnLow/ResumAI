'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../ui/Context/AuthContext';
import { getJob, updateJob, deleteJob, getAnswersByJob } from '../../Services/firebase/firestore';
import { Job, JobStatus, Answer } from '../../types';
import toast from 'react-hot-toast';
import PrivateRoute from '../../ui/components/PrivateRoute';
import ProfileCheck from '../../ui/components/ProfileCheck';
import { getCardClasses, getInputClasses, getButtonClasses } from '../../ui/styles/theme';
import { LoadingPage } from '../../ui/components/Loading';

export default function JobDetail() {
    const params = useParams();
    const jobId = params.jobId as string;
    const { currentUser } = useAuth();
    const router = useRouter();

    const [job, setJob] = useState<Job | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Job>>({});

    useEffect(() => {
        const fetchJobData = async () => {
            if (!jobId || !currentUser) return;

            try {
                setLoading(true);

                // Fetch job details
                const jobData = await getJob(jobId);

                if (!jobData) {
                    toast.error('Job not found');
                    return router.push('/jobs');
                }

                if (jobData.userId !== currentUser.uid) {
                    toast.error('You do not have access to this job');
                    return router.push('/jobs');
                }

                setJob(jobData);
                setFormData(jobData);

                // Fetch answers associated with this job
                const jobAnswers = await getAnswersByJob(currentUser.uid, jobId);
                setAnswers(jobAnswers);
            } catch (error) {
                console.error('Error fetching job data:', error);
                toast.error('Failed to load job details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchJobData();
    }, [jobId, currentUser, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateJob = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!job) return;

        try {
            setLoading(true);

            await updateJob({
                id: job.id,
                ...formData
            });

            setJob(prev => prev ? { ...prev, ...formData } : null);
            setEditing(false);
            toast.success('Job updated successfully!');
        } catch (error) {
            console.error('Error updating job:', error);
            toast.error('Failed to update job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteJob = async () => {
        if (!job) return;

        if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);

            await deleteJob(job.id);

            toast.success('Job deleted successfully!');
            router.push('/jobs');
        } catch (error) {
            console.error('Error deleting job:', error);
            toast.error('Failed to delete job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const startPracticeSession = () => {
        router.push(`/practice/setup?job=${job?.id}`);
    };

    if (loading && !job) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <LoadingPage text="Loading..." />
                </ProfileCheck>
            </PrivateRoute>
        );
    }

    if (!job) {
        return (
            <PrivateRoute>
                <ProfileCheck>
                    <div className="min-h-screen bg-gray-700">
                        <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-6">
                            <div className="max-w-7xl mx-auto text-center">
                                <h1 className="text-2xl font-bold text-red-400 mb-4">Job not found</h1>
                                <p className="mb-4 text-gray-300">The job you're looking for doesn't exist or you don't have access to it.</p>
                                <Link
                                    href="/jobs"
                                    className={getButtonClasses('primary')}
                                >
                                    Back to Jobs
                                </Link>
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
                    <div className="bg-gray-700 border-b border-gray-600 px-4 sm:px-6 lg:px-8 py-6 pt-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center mb-4 sm:mb-0">
                                    <Link
                                        href="/jobs"
                                        className="mr-4 text-gray-400 hover:text-gray-300 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                    </Link>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white">{editing ? 'Edit Job' : job.title}</h1>
                                        <p className="mt-1 text-gray-400">{job.company}</p>
                                    </div>
                                </div>
                                {!editing && (
                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => setEditing(true)}
                                            className={getButtonClasses('secondary')}
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={startPracticeSession}
                                            className={getButtonClasses('primary')}
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            Practice for this Job
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {editing ? (
                            <div className={getCardClasses()}>
                                <form onSubmit={handleUpdateJob}>
                                    <div className="px-4 py-5 sm:p-6">
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                                            <div className="sm:col-span-3">
                                                <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                                                    Job Title
                                                </label>
                                                <div className="mt-1">
                                                    <input
                                                        type="text"
                                                        name="title"
                                                        id="title"
                                                        value={formData.title || ''}
                                                        onChange={handleInputChange}
                                                        required
                                                        className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="sm:col-span-3">
                                                <label htmlFor="company" className="block text-sm font-medium text-gray-300">
                                                    Company
                                                </label>
                                                <div className="mt-1">
                                                    <input
                                                        type="text"
                                                        name="company"
                                                        id="company"
                                                        value={formData.company || ''}
                                                        onChange={handleInputChange}
                                                        required
                                                        className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="sm:col-span-3">
                                                <label htmlFor="status" className="block text-sm font-medium text-gray-300">
                                                    Status
                                                </label>
                                                <div className="mt-1">
                                                    <select
                                                        id="status"
                                                        name="status"
                                                        value={formData.status || 'Drafted'}
                                                        onChange={handleInputChange}
                                                        className={`${getInputClasses()} block w-full sm:text-sm rounded-md appearance-none`}
                                                    >
                                                        <option value="Drafted">Drafted</option>
                                                        <option value="Submitted">Submitted</option>
                                                        <option value="Interviewing">Interviewing</option>
                                                        <option value="Offer">Offer</option>
                                                        <option value="Rejected">Rejected</option>
                                                    </select>

                                                </div>
                                            </div>

                                            <div className="sm:col-span-6">
                                                <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                                                    Job Description
                                                </label>
                                                <div className="mt-1">
                                                    <textarea
                                                        id="description"
                                                        name="description"
                                                        rows={8}
                                                        value={formData.description || ''}
                                                        onChange={handleInputChange}
                                                        className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                        placeholder="Paste the job description here"
                                                    />
                                                </div>
                                            </div>

                                            <div className="sm:col-span-6">
                                                <label htmlFor="notes" className="block text-sm font-medium text-gray-300">
                                                    Notes
                                                </label>
                                                <div className="mt-1">
                                                    <textarea
                                                        id="notes"
                                                        name="notes"
                                                        rows={4}
                                                        value={formData.notes || ''}
                                                        onChange={handleInputChange}
                                                        className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                        placeholder="Add any notes about this job (recruiter info, interview details, etc.)"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-4 py-3 bg-gray-700 text-right sm:px-6 flex justify-between border-t border-gray-600">
                                        <button
                                            type="button"
                                            onClick={handleDeleteJob}
                                            className={getButtonClasses('danger')}
                                        >
                                            Delete Job
                                        </button>
                                        <div className="space-x-3">
                                            <button
                                                type="button"
                                                onClick={() => setEditing(false)}
                                                className={getButtonClasses('secondary')}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className={getButtonClasses('primary')}
                                            >
                                                {loading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <>
                                <div className={`${getCardClasses()} mb-6`}>
                                    <div className="px-4 py-5 sm:px-6 flex justify-between">
                                        <div>
                                            <h2 className="text-lg font-medium text-white">{job.title}</h2>
                                            <p className="mt-1 max-w-2xl text-sm text-gray-400">{job.company}</p>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${job.status === 'Drafted' ? 'bg-blue-100 text-blue-800' :
                                            job.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                                                job.status === 'Interviewing' ? 'bg-purple-100 text-purple-800' :
                                                    job.status === 'Offer' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                            }`}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-600">
                                        <dl>
                                            <div className="bg-gray-700/50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                                <dt className="text-sm font-medium text-gray-400">Job Description</dt>
                                                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2 whitespace-pre-line">
                                                    {job.description || 'No description provided'}
                                                </dd>
                                            </div>
                                            <div className="bg-gray-800/50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                                <dt className="text-sm font-medium text-gray-400">Notes</dt>
                                                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2 whitespace-pre-line">
                                                    {job.notes || 'No notes added'}
                                                </dd>
                                            </div>
                                            <div className="bg-gray-700/50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                                <dt className="text-sm font-medium text-gray-400">Date Added</dt>
                                                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                                                    {new Date(job.createdAt).toLocaleDateString()}
                                                </dd>
                                            </div>
                                            <div className="bg-gray-800/50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                                <dt className="text-sm font-medium text-gray-400">Last Updated</dt>
                                                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                                                    {new Date(job.updatedAt).toLocaleDateString()}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>

                                <div className={getCardClasses()}>
                                    <div className="px-4 py-5 sm:px-6">
                                        <h2 className="text-lg font-medium text-white">Saved Answers for this Job</h2>
                                        <p className="mt-1 max-w-2xl text-sm text-gray-400">
                                            Practice responses you've saved for this specific job ({answers.length} answers)
                                        </p>
                                    </div>
                                    <div className="border-t border-gray-600">
                                        {answers.length === 0 ? (
                                            <div className="px-4 py-5 sm:px-6 text-center">
                                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-600 rounded-full flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm text-gray-400 mb-4">
                                                    You haven't saved any answers for this job yet.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={startPracticeSession}
                                                    className={getButtonClasses('primary')}
                                                >
                                                    Start Practice Session
                                                </button>
                                            </div>
                                        ) : (
                                            <ul className="divide-y divide-gray-600">
                                                {answers.map((answer) => (
                                                    <li key={answer.id} className="px-4 py-4 sm:px-6">
                                                        <div className="mb-2">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${answer.category === 'Motivational' ? 'bg-green-100 text-green-800' :
                                                                answer.category === 'Behavioral' ? 'bg-blue-100 text-blue-800' :
                                                                    answer.category === 'Technical' ? 'bg-purple-100 text-purple-800' :
                                                                        'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {answer.category}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-medium text-blue-400 mb-1">{answer.questionText}</p>
                                                        <p className="text-sm text-gray-300 mb-2 line-clamp-3">{answer.answerText}</p>
                                                        <Link
                                                            href="/answers"
                                                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                                        >
                                                            View full answer →
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </ProfileCheck>
        </PrivateRoute>
    );
}