'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { Answer, Job } from '../../types';
import { getCardClasses } from '../../ui/styles/theme';

interface ProgressStatsProps {
    allAnswers: Answer[];
    jobs: Job[];
}

export default function ProgressStats({ allAnswers, jobs }: ProgressStatsProps) {
    const router = useRouter();

    const interviewingJobs = jobs.filter(job => job.status === 'Interviewing').length;
    const jobOffers = jobs.filter(job => job.status === 'Offer').length;

    const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
        <div className={`bg-${color}-900/20 border border-${color}-600/30 overflow-hidden shadow rounded-lg hover:border-${color}-600/50 transition-all duration-200`}>
            <div className="px-4 py-5 sm:p-6">
                <dt className={`text-sm font-medium text-${color}-200 truncate`}>{label}</dt>
                <dd className="mt-1 text-3xl font-semibold text-white">{value}</dd>
            </div>
        </div>
    );

    return (
        <div className={`mt-8 ${getCardClasses()}`}>
            <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-white mb-4">Your Progress</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Answers" value={allAnswers.length} color="blue" />
                    <StatCard label="Jobs Tracked" value={jobs.length} color="purple" />

                    <div className="bg-indigo-900/20 border border-indigo-600/30 overflow-hidden shadow rounded-lg hover:border-indigo-600/50 transition-all duration-200">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-indigo-200 truncate">Job Interviews</dt>
                            <dd className="mt-1 text-3xl font-semibold text-white">{interviewingJobs}</dd>
                        </div>
                    </div>

                    <div className="bg-green-900/20 border border-green-600/30 overflow-hidden shadow rounded-lg hover:border-green-600/50 transition-all duration-200">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-green-200 truncate">Job Offers</dt>
                            <dd className="mt-1 text-3xl font-semibold text-white">{jobOffers}</dd>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                        onClick={() => router.push('/practice/setup')}
                        className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Start Practice
                    </button>

                    <button
                        onClick={() => router.push('/answers')}
                        className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        View Answers
                    </button>

                    <button
                        onClick={() => router.push('/jobs/new')}
                        className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Job
                    </button>
                </div>
            </div>
        </div>
    );
}