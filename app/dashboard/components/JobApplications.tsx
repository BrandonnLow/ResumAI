'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Job, JobStatus } from '../../types';
import { getCardClasses } from '../../ui/styles/theme';

interface JobApplicationsProps {
    jobs: Job[];
    onQuickStatusUpdate: (jobId: string, newStatus: JobStatus) => Promise<void>;
}

export default function JobApplications({ jobs, onQuickStatusUpdate }: JobApplicationsProps) {
    const router = useRouter();
    const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

    const handleQuickStatusUpdate = async (jobId: string, newStatus: JobStatus) => {
        if (updatingJobId) return;

        console.log('Starting status update for job:', jobId, 'to status:', newStatus);
        setUpdatingJobId(jobId);

        try {
            await onQuickStatusUpdate(jobId, newStatus);
            console.log('Status update successful');
        } catch (error) {
            console.error('Error in JobApplications component:', error);
        } finally {
            console.log('Clearing updating job ID');
            setUpdatingJobId(null);
        }
    };

    return (
        <div className={`${getCardClasses()} hover:border-green-500/40 transition-all duration-200`}>
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-medium text-white">Job Applications</h2>
                    <p className="mt-1 text-sm text-gray-400">Track your job search progress</p>
                </div>
                <button
                    onClick={() => router.push('/jobs')}
                    className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                    View all
                    <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            <div className="border-t border-gray-600 px-4 py-5 sm:p-0">
                {jobs.length === 0 ? (
                    <div className="px-4 py-5 sm:px-6 text-center">
                        <div className="w-12 h-12 mx-auto mb-4 bg-green-900/20 border border-green-600/30 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">You haven't added any jobs yet.</p>
                        <button
                            onClick={() => router.push('/jobs/new')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                        >
                            Add job
                        </button>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-600">
                        {jobs.slice(0, 5).map((job) => (
                            <li key={job.id} className="px-4 py-4 sm:px-6">
                                <div className="flex justify-between items-center">
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/jobs/${job.id}`} className="block hover:text-blue-400 transition-colors">
                                            <p className="text-sm font-medium text-white truncate">{job.title}</p>
                                            <p className="text-sm text-gray-400">{job.company}</p>
                                        </Link>
                                    </div>
                                    <div className="ml-4 flex-shrink-0 relative">
                                        <select
                                            value={job.status}
                                            onChange={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const newStatus = e.target.value as JobStatus;
                                                handleQuickStatusUpdate(job.id, newStatus);
                                            }}
                                            disabled={updatingJobId === job.id}
                                            className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer
                        ${job.status === 'Drafted' ? 'bg-blue-100 text-blue-800' :
                                                    job.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                                                        job.status === 'Interviewing' ? 'bg-purple-100 text-purple-800' :
                                                            job.status === 'Offer' ? 'bg-green-100 text-green-800' :
                                                                'bg-red-100 text-red-800'
                                                }
                        ${updatingJobId === job.id ? 'opacity-50 cursor-wait' : 'hover:opacity-80'}
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        appearance-none -webkit-appearance-none -moz-appearance-none
                        pr-6 disabled:cursor-wait
                      `}
                                            style={{
                                                backgroundImage: updatingJobId === job.id ? 'none' : `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                                backgroundSize: '1em 1em',
                                                backgroundPosition: 'right 0.25rem center',
                                                backgroundRepeat: 'no-repeat'
                                            }}
                                        >
                                            <option value="Drafted">Drafted</option>
                                            <option value="Submitted">Submitted</option>
                                            <option value="Interviewing">Interviewing</option>
                                            <option value="Offer">Offer</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>

                                        {updatingJobId === job.id && (
                                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-current"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}