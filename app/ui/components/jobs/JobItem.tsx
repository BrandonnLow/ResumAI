'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { Job, JobStatus } from '../../../types';
import { updateJobStatus } from '../../../Services/firebase/firestore';
import toast from 'react-hot-toast';

interface JobItemProps {
    job: Job;
    onJobUpdate: (jobId: string, newStatus: JobStatus) => void;
}

export default function JobItem({ job, onJobUpdate }: JobItemProps) {
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<JobStatus>(job.status);

    const getStatusColor = (status: JobStatus) => {
        switch (status) {
            case 'Drafted':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Submitted':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Interviewing':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Offer':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Rejected':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatDate = (date: any) => {
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

        return 'Date not available';
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        e.preventDefault(); // Prevent navigation to job detail page
        e.stopPropagation();

        const newStatus = e.target.value as JobStatus;
        if (newStatus === currentStatus) return;

        setIsUpdatingStatus(true);

        try {
            await updateJobStatus(job.id, newStatus);
            setCurrentStatus(newStatus);
            onJobUpdate(job.id, newStatus);

            // Show success message with status change
            toast.success(`Job status updated to "${newStatus}"`);
        } catch (error) {
            console.error('Error updating job status:', error);
            toast.error('Failed to update job status');
            // Reset select to previous value on error
            e.target.value = currentStatus;
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleSelectClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div className="block hover:shadow-lg transition-shadow duration-200">
            <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg divide-y divide-gray-600 h-full hover:border-blue-500/40">
                {/* Main job content */}
                <Link href={`/jobs/${job.id}`} className="block">
                    <div className="px-4 py-5 sm:px-6">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-medium text-white truncate">{job.title}</h3>
                                <p className="mt-1 text-sm text-gray-300">{job.company}</p>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Status and details section */}
                <div className="px-4 py-4 sm:px-6">
                    {/* Status dropdown */}
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Status:</span>
                        <div className="relative" onClick={handleSelectClick}>
                            <select
                                value={job.status}
                                onChange={handleStatusChange}
                                disabled={isUpdatingStatus}
                                className={`
                                    px-2 py-1 rounded-full text-xs font-medium cursor-pointer
                                    ${getStatusColor(job.status)} 
                                    ${isUpdatingStatus ? 'opacity-50' : 'hover:opacity-80'}
                                    appearance-none -webkit-appearance-none -moz-appearance-none
                                    bg-no-repeat bg-right-2 bg-center
                                    pr-6 focus:outline-none focus:ring-2 focus:ring-blue-500
                                `}
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                    backgroundSize: '1em 1em',
                                    backgroundPosition: 'right 0.25rem center'
                                }}
                            >
                                <option value="Drafted">Drafted</option>
                                <option value="Submitted">Submitted</option>
                                <option value="Interviewing">Interviewing</option>
                                <option value="Offer">Offer</option>
                                <option value="Rejected">Rejected</option>
                            </select>

                            {isUpdatingStatus && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-current"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Date and description */}
                    <Link href={`/jobs/${job.id}`} className="block">
                        <div className="text-sm text-gray-400 mb-2">
                            Added on {formatDate(job.createdAt)}
                        </div>
                        <div className="text-sm text-gray-300 line-clamp-3">
                            {job.description ?
                                job.description.substring(0, 150) + (job.description.length > 150 ? '...' : '') :
                                'No description provided'
                            }
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}