'use client'

import React from 'react';
import { UserProfile } from '../../../types';

interface ReviewStepProps {
    profile: Partial<UserProfile>;
    isEditMode: boolean;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
    profile,
    isEditMode
}) => {
    return (
        <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-600 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-white">Profile Summary</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-400">Review your profile before submitting.</p>
                </div>
                <div className="border-t border-gray-600 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-600">
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-400">Full name</dt>
                            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{profile.name}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-400">Email</dt>
                            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{profile.email}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-400">Phone</dt>
                            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{profile.phone || 'Not provided'}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-400">Location</dt>
                            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{profile.location || 'Not provided'}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-400">Education</dt>
                            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                                {profile.education && profile.education.length > 0 ? (
                                    <ul className="border border-gray-600 rounded-md divide-y divide-gray-600">
                                        {profile.education.map((edu, index) => (
                                            <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                                <div className="w-0 flex-1 flex items-center">
                                                    <span className="ml-2 flex-1 w-0 truncate">
                                                        {edu.degree} in {edu.field}, {edu.institution}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    'No education details provided'
                                )}
                            </dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-400">Work Experience</dt>
                            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                                {profile.workExperience && profile.workExperience.length > 0 ? (
                                    <ul className="border border-gray-600 rounded-md divide-y divide-gray-600">
                                        {profile.workExperience.map((exp, index) => (
                                            <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                                <div className="w-0 flex-1 flex items-center">
                                                    <span className="ml-2 flex-1 w-0 truncate">
                                                        {exp.position} at {exp.company}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    'No work experience provided'
                                )}
                            </dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-400">Skills</dt>
                            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                                {profile.skills && profile.skills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {profile.skills.map((skill, index) => (
                                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/20 text-blue-300 border border-blue-600/30">
                                                {skill.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    'No skills provided'
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-300">Ready to get started!</h3>
                        <div className="mt-2 text-sm text-yellow-200">
                            <p>
                                {isEditMode
                                    ? 'You are updating your existing profile. Once saved, you\'ll have access to all resumAI features.'
                                    : 'Once you submit your profile, you\'ll have access to personalized interview questions, AI feedback, and job tracking features.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};