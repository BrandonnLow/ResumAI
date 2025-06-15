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
            return new Date(date.seconds * 1000).toLocaleDateString();
        }

        if (date) {
            const jsDate = new Date(date);
            if (!isNaN(jsDate.getTime())) {
                return jsDate.toLocaleDateString();
            }
        }

        return 'Date not available';
    };

    return (
        <div className="border rounded-lg p-4 mb-4">
            <Link href={`/jobs/${job.id}`}>
                <h3 className="text-lg font-medium">{job.title}</h3>
                <p className="text-sm">{job.company}</p>
            </Link>

            <div className="mt-2">
                <div className="flex justify-between items-center mb-2">
                    <span>Status:</span>
                    <select
                        value={currentStatus}
                        onChange={handleStatusChange}
                        disabled={isUpdatingStatus}
                        className="border rounded p-1"
                    >
                        <option value="Drafted">Drafted</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>

                <div className="text-sm">
                    Added on {formatDate(job.createdAt)}
                </div>
                <div className="text-sm line-clamp-3">
                    {job.description || 'No description provided'}
                </div>
            </div>
        </div>
    );
}