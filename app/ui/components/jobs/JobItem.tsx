'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { Job, JobStatus } from '../../../types';
import { updateJobStatus } from '../../../Services/firebase/firestore';

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
                return 'bg-blue-100 text-blue-800';
            case 'Submitted':
                return 'bg-yellow-100 text-yellow-800';
            case 'Interviewing':
                return 'bg-purple-100 text-purple-800';
            case 'Offer':
                return 'bg-green-100 text-green-800';
            case 'Rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as JobStatus;
        if (newStatus === currentStatus) return;

        setIsUpdatingStatus(true);

        try {
            await updateJobStatus(job.id, newStatus);
            setCurrentStatus(newStatus);
            onJobUpdate(job.id, newStatus);
        } catch (error) {
            console.error('Error updating job status:', error);
            e.target.value = currentStatus;
        } finally {
            setIsUpdatingStatus(false);
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

    return (
        <div className="border border-gray-200 rounded-lg shadow-sm p-4 mb-4 hover:shadow-md transition-shadow">
            <Link href={`/jobs/${job.id}`}>
                <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                <p className="text-sm text-gray-600">{job.company}</p>
            </Link>

            <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Status:</span>
                    <select
                        value={currentStatus}
                        onChange={handleStatusChange}
                        disabled={isUpdatingStatus}
                        className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${getStatusColor(currentStatus)} ${isUpdatingStatus ? 'opacity-50' : 'hover:opacity-80'
                            }`}
                    >
                        <option value="Drafted">Drafted</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>

                <div className="text-sm text-gray-500 mb-2">
                    Added on {formatDate(job.createdAt)}
                </div>
                <div className="text-sm text-gray-700 line-clamp-3">
                    {job.description || 'No description provided'}
                </div>
            </div>
        </div>
    );
}